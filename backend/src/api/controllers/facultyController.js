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

// GET /api/faculty/:id/progress → full hierarchy of all students in faculty’s dept
exports.getDepartmentProgress = async (req, res) => {
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

        // fetch milestones + nested stages/tasks/subtasks
        const milestones = await Milestone.findAll({
            where: { department: faculty.department },
            include: [
                { model: Student },
                {
                    model: db.Stage,
                    include: [
                        {
                            model: db.Task,
                            include: [ db.Subtask ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'ASC']]
        });

        // group milestones by student
        const studentProgress = {};
        milestones.forEach(m => {
            if (!studentProgress[m.Student.student_id]) {
                studentProgress[m.Student.student_id] = {
                    student_id: m.Student.student_id,
                    name: m.Student.name,
                    email: m.Student.email,
                    milestones: []
                };
            }
            studentProgress[m.Student.student_id].milestones.push(m);
        });

        return res.json({
            faculty_id: id,
            department: faculty.department,
            students: Object.values(studentProgress)
        });
    } catch (err) {
        console.error("❌ Get department progress error:", err);
        return res.status(500).json({ message: "Failed to fetch department progress", error: err.message });
    }
};

exports.getAllStudents = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can access this." });
    }

    const students = await Student.findAll();
    return res.json({ students });
  } catch (err) {
    console.error("❌ Get all students error:", err);
    return res.status(500).json({ message: "Failed to fetch students", error: err.message });
  }
};
