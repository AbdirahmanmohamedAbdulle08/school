const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentCode: {
        type: String,
        unique: true,
        trim: true
    },
    rollNumber: {
        type: String,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    dateOfBirth: {
        type: Date
    },
    fatherName: {
        type: String,
        required: true,
        trim: true
    },
    fatherPhone: {
        type: String,
        required: true,
        trim: true
    },
    guardianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guardian'
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    monthlyFee: {
        type: Number,
        default: 0
    },
    fee: {
        type: Number,
        default: 0
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Graduated'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
