const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticateToken } = require('../middleware/authMiddleware');

// List students under faculty's department
router.get('/:id/students', authenticateToken, facultyController.getStudentsInDepartment);

// List milestones in faculty's department
router.get('/:id/milestones', authenticateToken, facultyController.getDepartmentMilestones);

// List deparment wise all details
router.get('/:id/progress', authenticateToken, facultyController.getDepartmentProgress);

module.exports = router;
