const mongoose = require('mongoose');

const cashbookEntrySchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CashbookCategory',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    method: {
        type: String,
        enum: ['Mobile Money', 'Bank', 'EVC-Plus', 'E-Dahab', 'Cash'],
        default: 'Cash'
    },
    payerName: {
        type: String,
        default: '',
        trim: true
    },
    senderPhone: {
        type: String,
        default: '',
        trim: true
    },
    senderName: {
        type: String,
        default: '',
        trim: true
    },
    senderEntityType: {
        type: String,
        enum: ['guardian', 'student', 'user', 'manual', ''],
        default: ''
    },
    senderEntityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    receiverPhone: {
        type: String,
        default: '',
        trim: true
    },
    receiverName: {
        type: String,
        default: '',
        trim: true
    },
    receiverEntityType: {
        type: String,
        enum: ['teacher', 'user', 'manual', ''],
        default: ''
    },
    receiverEntityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    date: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    // Snapshot of how much the payer still owed after this fee entry was applied.
    // null for entries that are not student fee payments.
    feeRemaining: {
        type: Number,
        default: null
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

cashbookEntrySchema.index({ date: -1 });
cashbookEntrySchema.index({ categoryId: 1 });

module.exports = mongoose.model('CashbookEntry', cashbookEntrySchema);
