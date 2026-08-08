const express = require('express');
const router = express.Router();
const {
    promoteStudents,
    getPromotionHistory,
    getStudentClassHistory
} = require('../controllers/promotionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, promoteStudents);

router.route('/history')
    .get(protect, getPromotionHistory);

router.route('/student/:studentId')
    .get(protect, getStudentClassHistory);

module.exports = router;
