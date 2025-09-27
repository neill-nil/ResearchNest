const express = require('express');
const router = express.Router();
const controller = require('../controllers/stageController');
const { authenticateToken, isFaculty, isStudent } = require('../../middleware/authMiddleware');

router.post('/', [authenticateToken, isFaculty], controller.createStage);
router.get('/:milestoneId', [authenticateToken], controller.getStagesByMilestone);
router.patch('/:id/status', [authenticateToken, isStudent], controller.updateStageStatus);
router.patch('/:id/freeze', [authenticateToken, isFaculty], controller.freezeStage);
router.delete('/:id', [authenticateToken, isFaculty], controller.deleteStage);

module.exports = router;