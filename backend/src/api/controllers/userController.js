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
        const { role, id, name, email, program, department, password } = req.body;

        if (!role || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const Model = getModel(role);

        // hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        let newUser;

        if (role === "student") {
            newUser = await Model.create({
                student_id: id,
                name,
                email,
                program,
                password_hash
            });
        } else {
            newUser = await Model.create({
                faculty_id: id,
                name,
                email,
                department,
                password_hash
            });
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
