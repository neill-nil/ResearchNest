const db = require('../../models');
const { Stage, Milestone } = db;

exports.createStage = async (req, res) => {
    const { milestone_id, name } = req.body;
    try {
        const milestone = await Milestone.findByPk(milestone_id);
        if (!milestone) {
            return res.status(404).send({ message: "Milestone not found." });
        }
        if (milestone.department !== req.user.department) {
            return res.status(403).send({ message: "Access denied for this department." });
        }
        const stage = await Stage.create({ milestone_id, name });
        res.status(201).send(stage);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getStagesByMilestone = async (req, res) => {
    const { milestoneId } = req.params;
    try {
        const milestone = await Milestone.findByPk(milestoneId);
        if (!milestone) {
            return res.status(404).send({ message: "Milestone not found." });
        }
        if (req.user.role === 'student' && milestone.student_id !== req.user.id) {
            return res.status(403).send({ message: "Access denied." });
        }
        const stages = await Stage.findAll({
            where: { milestone_id: milestoneId },
            order: [['created_at', 'ASC']]
        });
        res.status(200).send(stages);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.updateStageStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['In Progress', 'Completed'].includes(status)) {
        return res.status(400).send({ message: 'Invalid status provided.' });
    }
    try {
        const stage = await Stage.findByPk(id, { include: Milestone });
        if (!stage) {
            return res.status(404).send({ message: "Stage not found." });
        }
        if (stage.Milestone.student_id !== req.user.id) {
            return res.status(403).send({ message: "Access denied." });
        }
        stage.status = status;
        await stage.save();
        res.send({ message: 'Stage status updated successfully.' });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.freezeStage = async (req, res) => {
    const { id } = req.params;
    const { is_frozen } = req.body;
    if (typeof is_frozen !== 'boolean') {
        return res.status(400).send({ message: 'is_frozen must be a boolean.' });
    }
    try {
        const stage = await Stage.findByPk(id, { include: Milestone });
        if (!stage) {
            return res.status(404).send({ message: "Stage not found." });
        }
        if (stage.Milestone.department !== req.user.department) {
            return res.status(403).send({ message: "Access denied for this department." });
        }
        stage.is_frozen = is_frozen;
        stage.frozen_by_faculty_id = is_frozen ? req.user.id : null;
        stage.frozen_at = is_frozen ? new Date() : null;
        await stage.save();
        res.send({ message: `Stage ${is_frozen ? 'frozen' : 'unfrozen'} successfully.` });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.deleteStage = async (req, res) => {
    const { id } = req.params;
    try {
        const stage = await Stage.findByPk(id, { include: Milestone });
        if (!stage) {
            return res.status(404).send({ message: "Stage not found." });
        }
        if (stage.Milestone.department !== req.user.department) {
            return res.status(403).send({ message: "Access denied for this department." });
        }
        await stage.destroy();
        res.send({ message: "Stage deleted successfully." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};