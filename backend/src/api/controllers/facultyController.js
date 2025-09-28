const db = require('../../models');
const Faculty = db.Faculty;
const Student = db.Student;
const Milestone = db.Milestone;

// GET /api/faculty/:id/students → list students under faculty’s department
exports.getStudentsInDepartment = async (req, res) => {
    try {
        if (req.user.role !== "faculty") {
            return res.status(403).json({ message: "Only faculty can access this route." });
        }

        const { id } = req.params;

        // faculty can only view their own department
        if (req.user.id !== id) {
            return res.status(403).json({ message: "Access denied. You can only view your own department." });
        }

        const faculty = await Faculty.findByPk(id);
        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found." });
        }

        // get distinct students that have milestones in faculty's department
        const milestones = await Milestone.findAll({
            where: { department: faculty.department },
            include: [{ model: Student }]
        });

        const students = milestones.map(m => m.Student);
        const uniqueStudents = Array.from(new Map(students.map(s => [s.student_id, s])).values());

        return res.json({ faculty_id: id, department: faculty.department, students: uniqueStudents });
    } catch (err) {
        console.error("❌ Get students in department error:", err);
        return res.status(500).json({ message: "Failed to fetch students", error: err.message });
    }
};

// GET /api/faculty/:id/milestones → milestones assigned to faculty’s department
exports.getDepartmentMilestones = async (req, res) => {
    try {
        if (req.user.role !== "faculty") {
            return res.status(403).json({ message: "Only faculty can access this route." });
        }

        const { id } = req.params;

        if (req.user.id !== id) {
            return res.status(403).json({ message: "Access denied. You can only view your own department." });
        }

        const faculty = await Faculty.findByPk(id);
        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found." });
        }

        const milestones = await Milestone.findAll({
            where: { department: faculty.department },
            include: [{ model: Student }]
        });

        return res.json({ faculty_id: id, department: faculty.department, milestones });
    } catch (err) {
        console.error("❌ Get department milestones error:", err);
        return res.status(500).json({ message: "Failed to fetch milestones", error: err.message });
    }
};
