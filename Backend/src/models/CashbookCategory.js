const mongoose = require('mongoose');

const cashbookCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Income', 'Expense'],
        required: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

cashbookCategorySchema.index({ title: 1 });

module.exports = mongoose.model('CashbookCategory', cashbookCategorySchema);
