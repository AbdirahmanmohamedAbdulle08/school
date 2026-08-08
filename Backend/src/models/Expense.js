const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    paymentMethod: {
        type: String,
        default: 'Cash'
    },
    date: {
        type: String, // YYYY-MM-DD
        default: () => new Date().toISOString().split('T')[0]
    },
    note: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
