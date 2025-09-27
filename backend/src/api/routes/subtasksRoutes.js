const express = require('express');
const router = express.Router();
const subtaskController = require('../controllers/subtasksController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, subtaskController.createSubtask);
router.get('/:taskId', authenticateToken, subtaskController.getSubtasksByTask);
router.patch('/:id', authenticateToken, subtaskController.updateSubtask);
router.delete('/:id', authenticateToken, subtaskController.deleteSubtask);

module.exports = router;