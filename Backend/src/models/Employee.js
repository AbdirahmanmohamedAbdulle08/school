const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    employeeCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: String,
    emergencyContact: {
        name: String,
        phone: String
    },
    department: {
        type: String,
        default: 'General'
    },
    jobTitle: {
        type: String,
        required: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'On Leave'],
        default: 'Active'
    },
    salaryType: {
        type: String,
        enum: ['Monthly', 'Daily', 'Hourly'],
        default: 'Monthly'
    },
    salaryAmount: {
        type: Number,
        default: 0
    },
    payDay: String,
    hasSystemAccess: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for quick lookups
employeeSchema.index({ warehouseId: 1 });
employeeSchema.index({ employeeCode: 1 }, { sparse: true });

module.exports = mongoose.model('Employee', employeeSchema);
