const express = require('express');
const router = express.Router();
const {
    getAttendance,
    markAttendance,
    updateAttendance,
    deleteAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAttendance)
    .post(protect, markAttendance);

router.route('/:id')
    .put(protect, updateAttendance)
    .delete(protect, deleteAttendance);

module.exports = router;
