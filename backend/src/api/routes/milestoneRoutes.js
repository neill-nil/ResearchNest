const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, milestoneController.createMilestone);
router.get('/:studentId', authenticateToken, milestoneController.getMilestonesByStudent);
router.patch('/:id/status', authenticateToken, milestoneController.updateStatus);
router.patch('/:id/freeze', authenticateToken, milestoneController.freezeMilestone);
router.patch('/:id/approve', authenticateToken, milestoneController.approveMilestone);
router.delete('/:id', authenticateToken, milestoneController.deleteMilestone);

module.exports = router;
