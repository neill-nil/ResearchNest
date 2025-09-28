const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, taskController.createTask);
router.get('/:stageId', authenticateToken, taskController.getTasksByStage);
router.patch('/:id', authenticateToken, taskController.updateTask);
router.delete('/:id', authenticateToken, taskController.deleteTask);

module.exports = router;