const express = require('express');
const router = express.Router();
const {
    getStudentAttendances,
    getStudentAttendanceById,
    createStudentAttendance,
    getStudentAttendanceHistory,
    updateStudentAttendance,
    deleteStudentAttendance
} = require('../controllers/studentAttendanceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getStudentAttendances)
    .post(protect, createStudentAttendance);

router.route('/history')
    .get(protect, getStudentAttendanceHistory);

router.route('/:id')
    .get(protect, getStudentAttendanceById)
    .put(protect, updateStudentAttendance)
    .delete(protect, deleteStudentAttendance);

module.exports = router;
