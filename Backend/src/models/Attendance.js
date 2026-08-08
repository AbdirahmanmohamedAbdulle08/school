const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD format for easy querying
        required: true
    },
    checkIn: {
        type: String, // Store as time string "08:00 AM" or ISO if preferred, keeping simple as per mock
    },
    checkOut: {
        type: String
    },
    shift: {
        type: String,
        enum: ['Morning', 'Evening', 'Night', 'Custom'],
        default: 'Morning'
    },
    workHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half Day', 'Leave', 'Late', 'Overtime', 'Remote'],
        default: 'Present'
    },
    source: {
        type: String,
        enum: ['Manual', 'System'],
        default: 'Manual'
    },
    notes: String,
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
