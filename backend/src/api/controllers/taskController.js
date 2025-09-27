const db = require('../../models');
const { Task, Stage, Milestone } = db;


exports.createTask = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: "Only students can create tasks." });
        }

        const { stage_id, name, due_date } = req.body;
        if (!stage_id || !name) {
            return res.status(400).json({ message: "Missing required fields: stage_id and name." });
        }

        const stage = await Stage.findByPk(stage_id, { include: Milestone });
        if (!stage) {
            return res.status(404).json({ message: "Stage not found." });
        }

        if (stage.Milestone.student_id !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You can only add tasks to your own stages." });
        }

        const task = await Task.create({ stage_id, name, due_date });
        return res.status(201).json({ message: "Task created successfully", task });

    } catch (error) {
        console.error("❌ Create task error:", error);
        return res.status(500).json({ message: "Failed to create task", error: error.message });
    }
};


exports.getTasksByStage = async (req, res) => {
    try {
        const { stageId } = req.params;

        const stage = await Stage.findByPk(stageId, { include: Milestone });
        if (!stage) {
            return res.status(404).json({ message: "Stage not found." });
        }

        if (req.user.role === 'student' && stage.Milestone.student_id !== req.user.id) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (req.user.role === 'faculty' && stage.Milestone.department !== req.user.department) {
            return res.status(403).json({ message: "Access denied for this department." });
        }

        const tasks = await Task.findAll({
            where: { stage_id: stageId },
            order: [['created_at', 'ASC']]
        });
        return res.status(200).json(tasks);

    } catch (error) {
        console.error("❌ Get tasks error:", error);
        return res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
    }
};


exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, due_date, status } = req.body;

        const task = await Task.findByPk(id, { include: { model: Stage, include: Milestone } });
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        const isStudentOwner = req.user.role === 'student' && task.Stage.Milestone.student_id === req.user.id;
        const isFacultyInDept = req.user.role === 'faculty' && task.Stage.Milestone.department === req.user.department;

        if (!isStudentOwner && !isFacultyInDept) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (status && !['In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        if (name !== undefined) task.name = name;
        if (due_date !== undefined) task.due_date = due_date;
        if (status !== undefined) task.status = status;

        await task.save();
        return res.json({ message: 'Task updated successfully.', task });

    } catch (error) {
        console.error("❌ Update task error:", error);
        return res.status(500).json({ message: "Failed to update task", error: error.message });
    }
};


exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findByPk(id, { include: { model: Stage, include: Milestone } });
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        if (req.user.role === 'student' && task.Stage.Milestone.student_id !== req.user.id) {
            return res.status(403).json({ message: "Students can only delete their own tasks." });
        }
        
        if (req.user.role === 'faculty' && task.Stage.Milestone.department !== req.user.department) {
            return res.status(403).json({ message: "Faculty can only delete tasks within their department." });
        }

        await task.destroy();
        return res.json({ message: "Task deleted successfully." });

    } catch (error) {
        console.error("❌ Delete task error:", error);
        return res.status(500).json({ message: "Failed to delete task", error: error.message });
    }
};