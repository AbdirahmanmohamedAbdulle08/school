const express = require('express');
const router = express.Router();
const {
    getTeacherAttendances,
    getTeacherAttendanceById,
    createTeacherAttendance,
    updateTeacherAttendance,
    deleteTeacherAttendance
} = require('../controllers/teacherAttendanceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTeacherAttendances)
    .post(protect, createTeacherAttendance);

router.route('/:id')
    .get(protect, getTeacherAttendanceById)
    .put(protect, updateTeacherAttendance)
    .delete(protect, deleteTeacherAttendance);

module.exports = router;
