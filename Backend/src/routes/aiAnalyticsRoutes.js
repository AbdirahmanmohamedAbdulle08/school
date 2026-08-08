const express = require('express');
const router = express.Router();
const aiAnalyticsController = require('../controllers/aiAnalyticsController');
const { protect } = require('../middleware/authMiddleware');

// Protect all AI analytics routes
router.use(protect);

router.get('/demand-prediction', aiAnalyticsController.getDemandPrediction);
router.get('/reorder-suggestions', aiAnalyticsController.getReorderSuggestions);
router.get('/expiry-risk', aiAnalyticsController.getExpiryRisk);
router.get('/stock-analysis', aiAnalyticsController.getStockAnalysis);

module.exports = router;
