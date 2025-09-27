const db = require('../../models');
const { Stage, Milestone } = db;

exports.createStage = async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ message: "Only faculty can create stages." });
        }

        const { milestone_id, name } = req.body;
        if (!milestone_id || !name) {
            return res.status(400).json({ message: "Missing required fields: milestone_id and name." });
        }

        const milestone = await Milestone.findByPk(milestone_id);
        if (!milestone) {
            return res.status(404).json({ message: "Milestone not found." });
        }


        if (milestone.department !== req.user.department) {
            return res.status(403).json({ message: "Access denied for this department." });
        }

        const stage = await Stage.create({ milestone_id, name });
        return res.status(201).json({ message: "Stage created successfully", stage });

    } catch (error) {
        console.error("❌ Create stage error:", error);
        return res.status(500).json({ message: "Failed to create stage", error: error.message });
    }
};

exports.getStagesByMilestone = async (req, res) => {
    try {
        const { milestoneId } = req.params;

        const milestone = await Milestone.findByPk(milestoneId);
        if (!milestone) {
            return res.status(404).json({ message: "Milestone not found." });
        }

        if (req.user.role === 'student' && milestone.student_id !== req.user.id) {
            return res.status(403).json({ message: "Access denied." });
        }

        const stages = await Stage.findAll({
            where: { milestone_id: milestoneId },
            order: [['created_at', 'ASC']]
        });
        return res.status(200).json(stages);

    } catch (error) {
        console.error("❌ Get stages error:", error);
        return res.status(500).json({ message: "Failed to fetch stages", error: error.message });
    }
};

exports.updateStageStatus = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: "Only students can update stage status." });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!['In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }
        
        const stage = await Stage.findByPk(id, { include: Milestone });
        if (!stage) {
            return res.status(404).json({ message: "Stage not found." });
        }

        if (stage.Milestone.student_id !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You can only update your own stages." });
        }
        
        stage.status = status;
        await stage.save();
        return res.json({ message: 'Stage status updated successfully.', stage });

    } catch (error) {
        console.error("❌ Update stage status error:", error);
        return res.status(500).json({ message: "Failed to update stage status", error: error.message });
    }
};

exports.freezeStage = async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ message: "Only faculty can freeze/unfreeze stages." });
        }

        const { id } = req.params;
        const { freeze } = req.body; 

        if (typeof freeze !== 'boolean') {
            return res.status(400).json({ message: 'The "freeze" field must be a boolean.' });
        }
        
        const stage = await Stage.findByPk(id, { include: Milestone });
        if (!stage) {
            return res.status(404).json({ message: "Stage not found." });
        }

        if (stage.Milestone.department !== req.user.department) {
            return res.status(403).json({ message: "Access denied for this department." });
        }
        
        stage.is_frozen = freeze;
        stage.frozen_by_faculty_id = freeze ? req.user.id : null;
        stage.frozen_at = freeze ? new Date() : null;
        await stage.save();
        
        return res.json({ message: `Stage ${freeze ? 'frozen' : 'unfrozen'} successfully.`, stage });

    } catch (error) {
        console.error("❌ Freeze stage error:", error);
        return res.status(500).json({ message: "Failed to freeze stage", error: error.message });
    }
};

exports.deleteStage = async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ message: "Only faculty can delete stages." });
        }

        const { id } = req.params;

        const stage = await Stage.findByPk(id, { include: Milestone });
        if (!stage) {
            return res.status(404).json({ message: "Stage not found." });
        }

        if (stage.Milestone.department !== req.user.department) {
            return res.status(403).json({ message: "Access denied for this department." });
        }

        await stage.destroy();
        return res.json({ message: "Stage deleted successfully." });

    } catch (error) {
        console.error("❌ Delete stage error:", error);
        return res.status(500).json({ message: "Failed to delete stage", error: error.message });
    }
};