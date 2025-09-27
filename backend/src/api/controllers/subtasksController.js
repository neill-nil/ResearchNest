const db = require('../../models');
const { Subtask, Task, Stage, Milestone } = db;

// Student creates a subtask
exports.createSubtask = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: "Only students can create subtasks." });
        }

        const { task_id, name } = req.body;
        if (!task_id || !name) {
            return res.status(400).json({ message: "Missing required fields: task_id and name." });
        }

        const task = await Task.findByPk(task_id, { include: { model: Stage, include: Milestone } });
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        if (task.Stage.Milestone.student_id !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You can only add subtasks to your own tasks." });
        }

        const subtask = await Subtask.create({ task_id, name });
        return res.status(201).json({ message: "Subtask created successfully", subtask });

    } catch (error) {
        console.error("❌ Create subtask error:", error);
        return res.status(500).json({ message: "Failed to create subtask", error: error.message });
    }
};

// Get all subtasks for a specific task
exports.getSubtasksByTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findByPk(taskId, { include: { model: Stage, include: Milestone } });
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        if (req.user.role === 'student' && task.Stage.Milestone.student_id !== req.user.id) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (req.user.role === 'faculty' && task.Stage.Milestone.department !== req.user.department) {
            return res.status(403).json({ message: "Access denied for this department." });
        }

        const subtasks = await Subtask.findAll({
            where: { task_id: taskId },
            order: [['created_at', 'ASC']]
        });
        return res.status(200).json(subtasks);

    } catch (error) {
        console.error("❌ Get subtasks error:", error);
        return res.status(500).json({ message: "Failed to fetch subtasks", error: error.message });
    }
};

// Student or Faculty updates any field of a subtask
exports.updateSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status } = req.body;

        const subtask = await Subtask.findByPk(id, { include: { model: Task, include: { model: Stage, include: Milestone } } });
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found." });
        }

        const isStudentOwner = req.user.role === 'student' && subtask.Task.Stage.Milestone.student_id === req.user.id;
        const isFacultyInDept = req.user.role === 'faculty' && subtask.Task.Stage.Milestone.department === req.user.department;

        if (!isStudentOwner && !isFacultyInDept) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (status && !['In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        if (name !== undefined) subtask.name = name;
        if (status !== undefined) subtask.status = status;

        await subtask.save();
        return res.json({ message: 'Subtask updated successfully.', subtask });

    } catch (error) {
        console.error("❌ Update subtask error:", error);
        return res.status(500).json({ message: "Failed to update subtask", error: error.message });
    }
};

// Delete a subtask (accessible by both students and faculty with checks)
exports.deleteSubtask = async (req, res) => {
    try {
        const { id } = req.params;

        const subtask = await Subtask.findByPk(id, { include: { model: Task, include: { model: Stage, include: Milestone } } });
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found." });
        }

        const isStudentOwner = req.user.role === 'student' && subtask.Task.Stage.Milestone.student_id === req.user.id;
        const isFacultyInDept = req.user.role === 'faculty' && subtask.Task.Stage.Milestone.department === req.user.department;

        if (!isStudentOwner && !isFacultyInDept) {
            return res.status(403).json({ message: "Access denied." });
        }

        await subtask.destroy();
        return res.json({ message: "Subtask deleted successfully." });

    } catch (error) {
        console.error("❌ Delete subtask error:", error);
        return res.status(500).json({ message: "Failed to delete subtask", error: error.message });
    }
};