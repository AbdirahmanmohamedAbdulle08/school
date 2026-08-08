const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    guardianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guardian'
        // auto-resolved from student record in controller
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    // When a fee is paid through a Cashbook transaction, the resulting Payment
    // records are linked back to that entry so they stay in sync on edit/delete.
    // Their wallet credit is skipped here because the Cashbook entry already
    // credits the wallet — recording it twice would double the balance.
    sourceEntryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CashbookEntry'
    },
    // True when the payment was created by ticking "paid" on the Payers table,
    // so it can be cleanly reversed if the tick is removed.
    viaPayerToggle: {
        type: Boolean,
        default: false
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    month: {
        type: String,
        default: () => new Date().toISOString().slice(0, 7) // e.g. "YYYY-MM"
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Mobile Money', 'Card'],
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Failed'],
        default: 'Completed'
    },
    description: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
