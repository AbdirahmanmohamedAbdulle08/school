const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    
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
    code: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'],
        required: true
    },
    parentAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null
    },
    balance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    systemId: {
        type: String,
        default: null
    },
    isRequired: {
        type: Boolean, // If true, tenant cannot delete this
        default: false
    },
    isSystemAccount: {
        type: Boolean,
        default: false
    },
    provider: {
        type: String, // e.g., 'Hormuud', 'Premier Bank'
        trim: true
    },
    accountNo: {
        type: String,
        trim: true
    },
    accountCategory: {
        type: String,
        enum: ['Cash', 'Mobile Money', 'Bank', 'Merchant', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure unique account code per tenant and warehouse
accountSchema.index({ warehouseId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Account', accountSchema);
