const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    lang: {
        type: String,
        default: 'en'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: [chatMessageSchema],
    lastLanguage: {
        type: String,
        default: 'en'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-expire sessions after 30 days
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
chatSessionSchema.index({ userId: 1, updatedAt: -1 });

// Update the updatedAt timestamp before saving
chatSessionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
