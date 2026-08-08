const mongoose = require('mongoose');

// Marks a student scored in one subject of an exam.
const subjectMarkSchema = new mongoose.Schema({
    subject: { type: String, required: true, trim: true },
    marksObtained: { type: Number, default: 0, min: 0 },
    isAbsent: { type: Boolean, default: false }
}, { _id: false });

const examResultSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    marks: {
        type: [subjectMarkSchema],
        default: []
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// One result document per student per exam.
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
