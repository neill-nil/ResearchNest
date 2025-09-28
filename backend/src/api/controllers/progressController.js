const db = require('../../models');
const Milestone = db.Milestone;
const Stage = db.Stage;
const Task = db.Task;
const Subtask = db.Subtask;

// GET /api/progress/:studentId → full hierarchy
exports.getFullProgress = async (req, res) => {
    try {
        const { studentId } = req.params;

        const milestones = await Milestone.findAll({
            where: { student_id: studentId },
            include: [
                {
                    model: Stage,
                    include: [
                        {
                            model: Task,
                            include: [ Subtask ]
                        }
                    ]
                }
            ],
            order: [
                ['milestone_id', 'ASC'],
                [Stage, 'stage_id', 'ASC'],
                [Stage, Task, 'task_id', 'ASC'],
                [Stage, Task, Subtask, 'subtask_id', 'ASC']
            ]
        });

        return res.json({ studentId, milestones });
    } catch (err) {
        console.error("❌ Get full progress error:", err);
        return res.status(500).json({ message: "Failed to fetch progress", error: err.message });
    }
};

// GET /api/progress/:studentId/summary → aggregated counts
exports.getProgressSummary = async (req, res) => {
    try {
        const { studentId } = req.params;

        const milestones = await Milestone.findAll({ where: { student_id: studentId } });
        const stages = await Stage.findAll({
            include: [{ model: Milestone, where: { student_id: studentId } }]
        });
        const tasks = await Task.findAll({
            include: [{ model: Stage, include: [{ model: Milestone, where: { student_id: studentId } }] }]
        });
        const subtasks = await Subtask.findAll({
            include: [{ model: Task, include: [{ model: Stage, include: [{ model: Milestone, where: { student_id: studentId } }] }] }]
        });

        const countByStatus = (items, field = "status") =>
            items.reduce((acc, item) => {
                acc[item[field]] = (acc[item[field]] || 0) + 1;
                return acc;
            }, {});

        return res.json({
            studentId,
            milestones: {
                total: milestones.length,
                byStatus: countByStatus(milestones)
            },
            stages: {
                total: stages.length,
                byStatus: countByStatus(stages)
            },
            tasks: {
                total: tasks.length,
                byStatus: countByStatus(tasks)
            },
            subtasks: {
                total: subtasks.length,
                byStatus: countByStatus(subtasks)
            }
        });
    } catch (err) {
        console.error("❌ Get summary error:", err);
        return res.status(500).json({ message: "Failed to fetch summary", error: err.message });
    }
};
