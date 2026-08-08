const express = require('express');
const router = express.Router();
const {
    getSettings,
    updateSettings,
    triggerBackup,
    getAlertsSummary
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);
router.post('/backup', protect, triggerBackup);
router.get('/alerts-summary', protect, getAlertsSummary);

module.exports = router;
