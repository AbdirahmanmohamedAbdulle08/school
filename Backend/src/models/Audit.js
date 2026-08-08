const mongoose = require('mongoose');

const auditItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    bin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    systemQuantity: {
        type: Number,
        required: true
    },
    physicalQuantity: {
        type: Number,
        required: true
    },
    difference: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Matched', 'Missing', 'Overstock'],
        required: true
    }
});

const auditSchema = new mongoose.Schema({
    auditNo: {
        type: String,
        required: true,
        unique: true
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    status: {
        type: String,
        enum: ['In-Progress', 'Completed', 'Cancelled'],
        default: 'In-Progress'
    },
    items: [auditItemSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    completedAt: Date,
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('Audit', auditSchema);
