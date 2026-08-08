const asyncHandler = require('../middleware/asyncHandler');
const TeacherAttendance = require('../models/TeacherAttendance');

const getTeacherAttendances = asyncHandler(async (req, res) => {
    const data = await TeacherAttendance.find();
    res.json(data);
});

const getTeacherAttendanceById = asyncHandler(async (req, res) => {
    const data = await TeacherAttendance.findById(req.params.id);
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('TeacherAttendance not found');
    }
});

const createTeacherAttendance = asyncHandler(async (req, res) => {
    const data = await TeacherAttendance.create(req.body);
    res.status(201).json(data);
});

const updateTeacherAttendance = asyncHandler(async (req, res) => {
    const data = await TeacherAttendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('TeacherAttendance not found');
    }
});

const deleteTeacherAttendance = asyncHandler(async (req, res) => {
    const data = await TeacherAttendance.findByIdAndDelete(req.params.id);
    if (data) {
        res.json({ message: 'TeacherAttendance removed' });
    } else {
        res.status(404);
        throw new Error('TeacherAttendance not found');
    }
});

module.exports = {
    getTeacherAttendances,
    getTeacherAttendanceById,
    createTeacherAttendance,
    updateTeacherAttendance,
    deleteTeacherAttendance
};
