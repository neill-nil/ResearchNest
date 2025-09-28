const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, noteController.createNote);
router.get('/:studentId', authenticateToken, noteController.getNotesForStudent);
router.delete('/:id', authenticateToken, noteController.deleteNote);

module.exports = router;
