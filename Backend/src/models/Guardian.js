const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    address: {
        type: String,
        trim: true
    },
    relationship: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['Parent', 'Responsible'],
        default: 'Parent'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Guardian', guardianSchema);
