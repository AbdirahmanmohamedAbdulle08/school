const express = require('express');
const router = express.Router();
const {
    getExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    getExamResults,
    saveExamResults,
    getStudentResult,
    publishExam
} = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getExams)
    .post(protect, createExam);

router.route('/:id')
    .get(protect, getExamById)
    .put(protect, updateExam)
    .delete(protect, deleteExam);

router.patch('/:id/publish', protect, publishExam);

router.route('/:id/results')
    .get(protect, getExamResults)
    .post(protect, saveExamResults);

router.get('/:id/results/:studentId', protect, getStudentResult);

module.exports = router;
