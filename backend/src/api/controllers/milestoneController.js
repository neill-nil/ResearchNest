const db = require('../../models');
const Milestone = db.Milestone;
const Stage = db.Stage;


exports.createMilestone = async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ message: "Only faculty can create milestones." });
        }

        const { student_id, name, department } = req.body;
        if (!student_id || !name || !department) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const milestone = await Milestone.create({
            student_id,
            name,
            department
        });

        return res.status(201).json({ message: "Milestone created", milestone });
    } catch (err) {
        console.error("❌ Create milestone error:", err);
        return res.status(500).json({ message: "Failed to create milestone", error: err.message });
    }
};


exports.getMilestonesByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const milestones = await Milestone.findAll({
            where: { student_id: studentId },
            include: [{ model: Stage }]
        });

        return res.json(milestones);
    } catch (err) {
        console.error("❌ Get milestones error:", err);
        return res.status(500).json({ message: "Failed to fetch milestones", error: err.message });
    }
};


exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { role } = req.user;

        const milestone = await Milestone.findByPk(id);
        if (!milestone) return res.status(404).json({ message: "Milestone not found" });

     
        if (role === "student" && status === "Open") {
            return res.status(403).json({ message: "Only faculty can set milestone to Open" });
        }
        if (role === "student" && status === "Completed") {
            return res.status(403).json({ message: "Milestone completion requires faculty approval" });
        }

        milestone.status = status;
        await milestone.save();

        return res.json({ message: "Milestone status updated", milestone });
    } catch (err) {
        console.error("❌ Update milestone status error:", err);
        return res.status(500).json({ message: "Failed to update milestone status", error: err.message });
    }
};


exports.freezeMilestone = async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ message: "Only faculty can freeze/unfreeze milestones." });
        }

        const { id } = req.params;
        const { freeze } = req.body; 

        const milestone = await Milestone.findByPk(id);
        if (!milestone) return res.status(404).json({ message: "Milestone not found" });

        milestone.is_frozen = freeze;
        milestone.frozen_by_faculty_id = freeze ? req.user.id : null;
        milestone.frozen_at = freeze ? new Date() : null;
        await milestone.save();

        return res.json({ message: `Milestone ${freeze ? "frozen" : "unfrozen"}`, milestone });
    } catch (err) {
        console.error("❌ Freeze milestone error:", err);
        return res.status(500).json({ message: "Failed to freeze milestone", error: err.message });
    }
};


exports.approveMilestone = async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ message: "Only faculty can approve milestones." });
        }

        const { id } = req.params;

        const milestone = await Milestone.findByPk(id);
        if (!milestone) return res.status(404).json({ message: "Milestone not found" });

        if (milestone.status !== "Pending Approval") {
            return res.status(400).json({ message: "Milestone is not pending approval" });
        }

        milestone.status = "Completed";
        milestone.approved_by_faculty_id = req.user.id;
        milestone.approved_at = new Date();
        await milestone.save();

        return res.json({ message: "Milestone approved", milestone });
    } catch (err) {
        console.error("❌ Approve milestone error:", err);
        return res.status(500).json({ message: "Failed to approve milestone", error: err.message });
    }
};


exports.deleteMilestone = async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({ message: "Only faculty can delete milestones." });
        }

        const { id } = req.params;

        const milestone = await Milestone.findByPk(id);
        if (!milestone) return res.status(404).json({ message: "Milestone not found" });

        await milestone.destroy();

        return res.json({ message: "Milestone deleted" });
    } catch (err) {
        console.error("❌ Delete milestone error:", err);
        return res.status(500).json({ message: "Failed to delete milestone", error: err.message });
    }
};
