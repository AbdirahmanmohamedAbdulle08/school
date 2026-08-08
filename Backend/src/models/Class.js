const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    className: {
        type: String,
        trim: true
    },
    gradeLevel: {
        type: String,
        trim: true
    },
    room: {
        type: String,
        trim: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    monthlyFee: {
        type: Number,
        min: 0
    },
    schedule: {
        type: String,
        trim: true
    },
    capacity: {
        type: Number,
        default: 30
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

classSchema.pre('save', function(next) {
    if (!this.name && this.className) {
        this.name = this.className;
    }
    if (!this.className && this.name) {
        this.className = this.name;
    }
    next();
});

module.exports = mongoose.model('Class', classSchema);
