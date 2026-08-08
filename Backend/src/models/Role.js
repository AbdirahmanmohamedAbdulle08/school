const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: {
        type: Object,
        default: {}
    },
    isSystemRole: {
        type: Boolean,
        default: false
    },
    isRequired: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
