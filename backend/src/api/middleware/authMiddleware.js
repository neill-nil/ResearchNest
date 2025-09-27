const jwt = require('jsonwebtoken');
const db = require('../../models');
const Milestone = db.Milestone;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = decoded; // { id, email, role, department? }
        next();
    });
};

const isFaculty = (req, res, next) => {
    if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: 'Requires Faculty role.' });
    }
    next();
};

const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Requires Student role.' });
    }
    next();
};

const hasDeptAccess = async (req, res, next) => {
    try {
        const milestoneId = req.params.milestoneId || req.params.id || req.body.milestone_id;

        if (!milestoneId) {
            return res.status(400).json({ message: 'Milestone ID is required.' });
        }

        const milestone = await Milestone.findByPk(milestoneId);
        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found.' });
        }

        if (req.user.role === 'faculty' && milestone.department !== req.user.department) {
            return res.status(403).json({ message: 'Access denied: Department mismatch.' });
        }

        req.milestone = milestone; 
        next();
    } catch (error) {
        console.error("❌ hasDeptAccess error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    authenticateToken,
    isFaculty,
    isStudent,
    hasDeptAccess
};