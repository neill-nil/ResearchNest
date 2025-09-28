const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../models'); 

const Student = db.Student;
const Faculty = db.Faculty;

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// helper: return model based on role
const getModel = (role) => {
    if (role === "student") return Student;
    if (role === "faculty") return Faculty;
    throw new Error("Invalid role");
};

exports.register = async (req, res) => {
    try {
        const { role, name, email, program, department, password } = req.body;

        if (!role || !email || !password || !name) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const Model = getModel(role);

        // hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        let newUser;

        if (role === "student") {
            // Generate new student_id (2025XXXX)
            const latestStudent = await Model.findOne({
                order: [['student_id', 'DESC']]
            });

            let newId = "20250001";
            if (latestStudent) {
                const lastNum = parseInt(latestStudent.student_id.slice(4));
                newId = "2025" + String(lastNum + 1).padStart(4, '0');
            }

            newUser = await Model.create({
                student_id: newId,
                name,
                email,
                program,
                password_hash
            });
        } else if (role === "faculty") {
            // Generate new faculty_id (2000XXX)
            const latestFaculty = await Model.findOne({
                order: [['faculty_id', 'DESC']]
            });

            let newId = "2000001";
            if (latestFaculty) {
                const lastNum = parseInt(latestFaculty.faculty_id.slice(4));
                newId = "2000" + String(lastNum + 1).padStart(3, '0');
            }

            newUser = await Model.create({
                faculty_id: newId,
                name,
                email,
                department,
                password_hash
            });
        } else {
            return res.status(400).json({ message: "Invalid role" });
        }

        return res.status(201).json({
            message: `${role} registered successfully`,
            user: {
                id: newUser.student_id || newUser.faculty_id,
                name: newUser.name,
                email: newUser.email,
                role
            }
        });
    } catch (err) {
        console.error("❌ Register error:", err);
        return res.status(500).json({ message: "Registration failed", error: err.message });
    }
};


exports.login = async (req, res) => {
    try {
        const { role, email, password } = req.body;

        if (!role || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const Model = getModel(role);

        // find user
        const user = await Model.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: `${role} not found` });
        }

        // check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // issue JWT
        const token = jwt.sign(
            {
                id: user.student_id || user.faculty_id,
                email: user.email,
                role,
                ...(role === "faculty" && { department: user.department })
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.student_id || user.faculty_id,
                name: user.name,
                email: user.email,
                role
            }
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        return res.status(500).json({ message: "Login failed", error: err.message });
    }
};
