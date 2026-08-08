const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Bank', 'Mobile'],
        default: 'Bank'
    },
    balance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    // Institute's account/number for this wallet (bank account no. or mobile-money number).
    accountNumber: {
        type: String,
        default: '',
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Disabled'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
