const express = require('express');
const router = express.Router();
const { handleAiQuery, getChatHistory, getChatSession, deleteChatSession, clearAllHistory, downloadPdf } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, handleAiQuery);
router.get('/history', protect, getChatHistory);
router.get('/history/:sessionId', protect, getChatSession);
router.delete('/history/:sessionId', protect, deleteChatSession);
router.delete('/history', protect, clearAllHistory);
router.get('/download-pdf/:filename', protect, downloadPdf);

module.exports = router;
