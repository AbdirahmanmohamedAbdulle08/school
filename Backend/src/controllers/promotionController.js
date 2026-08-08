const asyncHandler = require('../middleware/asyncHandler');
const PromotionHistory = require('../models/PromotionHistory');
const Student = require('../models/Student');

// Promote selected students to a new class
const promoteStudents = asyncHandler(async (req, res) => {
    const { studentIds, previousClassId, newClassId, academicYear, remarks } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400);
        throw new Error('Please select at least one student to promote.');
    }

    if (!previousClassId || !newClassId) {
        res.status(400);
        throw new Error('Both previous class and new class are required.');
    }

    if (String(previousClassId) === String(newClassId)) {
        res.status(400);
        throw new Error('Current class and next class cannot be the same.');
    }

    if (!academicYear) {
        res.status(400);
        throw new Error('Academic Year is required.');
    }

    const promotedBy = req.user?._id;
    if (!promotedBy) {
        res.status(401);
        throw new Error('User context not found. Please log in again.');
    }

    const promotionRecords = [];

    // Complete in one operation loop
    for (const studentId of studentIds) {
        const student = await Student.findById(studentId);
        if (!student) continue;

        // Update student's classId
        student.classId = newClassId;
        await student.save();

        // Create log in PromotionHistory
        const log = await PromotionHistory.create({
            studentId,
            previousClassId,
            newClassId,
            promotedBy,
            academicYear,
            remarks: remarks || ''
        });
        promotionRecords.push(log);
    }

    res.status(200).json({
        message: `Successfully promoted ${promotionRecords.length} student(s).`,
        count: promotionRecords.length,
        records: promotionRecords
    });
});

// View all promotions
const getPromotionHistory = asyncHandler(async (req, res) => {
    const history = await PromotionHistory.find()
        .populate('studentId', 'fullName studentCode rollNumber')
        .populate('previousClassId', 'name')
        .populate('newClassId', 'name')
        .populate('promotedBy', 'fullName email')
        .sort({ promotionDate: -1 });

    res.json(history);
});

// View class history for a single student
const getStudentClassHistory = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('classId');
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }

    // Get all promotion logs chronologically
    const history = await PromotionHistory.find({ studentId })
        .populate('previousClassId', 'name')
        .populate('newClassId', 'name')
        .populate('promotedBy', 'fullName')
        .sort({ promotionDate: 1 });

    res.json({
        student,
        history
    });
});

module.exports = {
    promoteStudents,
    getPromotionHistory,
    getStudentClassHistory
};
