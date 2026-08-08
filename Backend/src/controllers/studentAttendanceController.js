const asyncHandler = require('../middleware/asyncHandler');
const StudentAttendance = require('../models/StudentAttendance');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// Count late/absent occurrences and trigger warnings if they are multiples of 3
const checkAndTriggerWarnings = async (studentId) => {
    try {
        const student = await Student.findById(studentId).populate('guardianId');
        if (!student) return;

        // Count total Late records
        const lateCount = await StudentAttendance.countDocuments({ studentId, status: 'Late' });
        if (lateCount > 0 && lateCount % 3 === 0) {
            const message = `Attendance Alert: Student ${student.fullName} (Code: ${student.studentCode || ''}) has reached ${lateCount} Late records.`;
            await Notification.create({
                title: 'Late Attendance Warning',
                message,
                receiverType: 'Guardian',
                receiverId: student.guardianId?._id || student._id
            });
        }

        // Count total Absent records
        const absentCount = await StudentAttendance.countDocuments({ studentId, status: 'Absent' });
        if (absentCount > 0 && absentCount % 3 === 0) {
            const message = `Attendance Alert: Student ${student.fullName} (Code: ${student.studentCode || ''}) has reached ${absentCount} Absent records.`;
            await Notification.create({
                title: 'Absent Attendance Warning',
                message,
                receiverType: 'Guardian',
                receiverId: student.guardianId?._id || student._id
            });
        }
    } catch (err) {
        console.error('Failed to process attendance warning', err);
    }
};

const getStudentAttendances = asyncHandler(async (req, res) => {
    const { classId, date, session, startDate, endDate } = req.query;
    const query = {};
    if (classId) query.classId = classId;
    if (session) query.session = session;
    
    if (date) {
        query.date = date;
    } else if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }

    // Load matching records, sorting by date/timestamp to allow finding the latest recorded status
    const data = await StudentAttendance.find(query)
        .populate('studentId')
        .populate('classId')
        .populate('markedBy', 'fullName email')
        .sort({ date: -1, createdAt: -1 });
    res.json(data);
});

const getStudentAttendanceById = asyncHandler(async (req, res) => {
    const data = await StudentAttendance.findById(req.params.id)
        .populate('studentId')
        .populate('classId')
        .populate('markedBy', 'fullName email');
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('StudentAttendance not found');
    }
});

const createStudentAttendance = asyncHandler(async (req, res) => {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const item of records) {
        const { studentId, classId, date, status, session, arrivalTime } = item;
        if (!studentId || !classId || !date) continue;

        // Requirement 10: Always create a new attendance record instead of replacing
        const created = await StudentAttendance.create({
            studentId,
            classId,
            date,
            status: status || 'Present',
            session: session || 'Morning',
            arrivalTime: status === 'Late' ? (arrivalTime || '08:30') : '',
            markedBy: req.user?._id
        });

        // Trigger warning check
        await checkAndTriggerWarnings(studentId);

        results.push(created);
    }

    res.status(201).json(Array.isArray(req.body) ? results : (results[0] || {}));
});

const getStudentAttendanceHistory = asyncHandler(async (req, res) => {
    const { studentId, startDate, endDate, status } = req.query;
    if (!studentId) {
        res.status(400);
        throw new Error('studentId is required');
    }

    const query = { studentId };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }

    if (status && status !== 'All') {
        query.status = status;
    }

    const data = await StudentAttendance.find(query)
        .populate('classId')
        .populate('markedBy', 'fullName')
        .sort({ date: -1, createdAt: -1 });

    res.json(data);
});

const updateStudentAttendance = asyncHandler(async (req, res) => {
    const data = await StudentAttendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('StudentAttendance not found');
    }
});

const deleteStudentAttendance = asyncHandler(async (req, res) => {
    const data = await StudentAttendance.findByIdAndDelete(req.params.id);
    if (data) {
        res.json({ message: 'StudentAttendance removed' });
    } else {
        res.status(404);
        throw new Error('StudentAttendance not found');
    }
});

module.exports = {
    getStudentAttendances,
    getStudentAttendanceById,
    createStudentAttendance,
    getStudentAttendanceHistory,
    updateStudentAttendance,
    deleteStudentAttendance
};
