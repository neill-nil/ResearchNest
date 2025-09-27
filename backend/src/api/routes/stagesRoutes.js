const express = require('express');
const router = express.Router();
const stageController = require('../controllers/stageController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, stageController.createStage);
router.get('/:milestoneId', authenticateToken, stageController.getStagesByMilestone);
router.patch('/:id/status', authenticateToken, stageController.updateStageStatus);
router.patch('/:id/freeze', authenticateToken, stageController.freezeStage);
router.delete('/:id', authenticateToken, stageController.deleteStage);

module.exports = router;