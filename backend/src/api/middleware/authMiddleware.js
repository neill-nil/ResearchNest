const jwt = require('jsonwebtoken');
const db = require('../models');
const Milestone = db.Milestone;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send({ message: 'No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Failed to authenticate token.' });
        }
        req.user = decoded;
        next();
    });
};

const isFaculty = (req, res, next) => {
    if (req.user.role !== 'faculty') {
        return res.status(403).send({ message: 'Requires Faculty role.' });
    }
    next();
};

const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).send({ message: 'Requires Student role.' });
    }
    next();
};

const hasDeptAccess = async (req, res, next) => {
    try {
        const milestoneId = req.params.milestoneId || (req.body.milestone_id || req.params.id);
        if (!milestoneId) {
            if (req.body.department && req.user.department === req.body.department) {
                return next();
            }
            return res.status(400).send({ message: 'Milestone ID or department is required.' });
        }

        const milestone = await Milestone.findByPk(milestoneId);
        if (!milestone) {
            return res.status(404).send({ message: 'Milestone not found.' });
        }

        if (milestone.department !== req.user.department) {
            return res.status(403).send({ message: 'Access denied: You do not have permission for this department.' });
        }
        
        req.milestone = milestone;
        next();
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

module.exports = {
    authenticateToken,
    isFaculty,
    isStudent,
    hasDeptAccess
};