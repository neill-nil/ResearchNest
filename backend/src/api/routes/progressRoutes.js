const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/:studentId', authenticateToken, progressController.getFullProgress);

router.get('/:studentId/summary', authenticateToken, progressController.getProgressSummary);

module.exports = router;
