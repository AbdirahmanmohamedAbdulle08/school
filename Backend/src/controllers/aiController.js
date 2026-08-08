const asyncHandler = require('../middleware/asyncHandler');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const ChatSession = require('../models/ChatSession');

// Handle AI Query for Institute Management
const handleAiQuery = asyncHandler(async (req, res) => {
    const { question, sessionId } = req.body;

    if (!question) {
        res.status(400);
        throw new Error('Please provide a question');
    }

    let session = null;
    let currentSessionId = sessionId;

    if (sessionId) {
        session = await ChatSession.findById(sessionId);
    }

    if (!session) {
        session = new ChatSession({
            userId: req.user?._id || '000000000000000000000000',
            title: question.substring(0, 50),
            messages: [],
            lastLanguage: 'en'
        });
        await session.save();
        currentSessionId = session._id;
    }

    session.messages.push({ role: 'user', content: question, lang: 'en' });

    const totalStudents = await Student.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'Teacher' });
    const totalClasses = await Class.countDocuments();

    let answer = `**Institute Assistant Response**\n\n- Active Students: **${totalStudents}**\n- Teachers: **${totalTeachers}**\n- Classes: **${totalClasses}**\n\nHow can I help you manage your institute today?`;

    session.messages.push({ role: 'assistant', content: answer, lang: 'en' });
    await session.save();

    res.json({
        answer,
        lang: 'en',
        sessionId: currentSessionId,
        data: {}
    });
});

const getChatHistory = asyncHandler(async (req, res) => {
    const sessions = await ChatSession.find({ userId: req.user?._id })
        .select('title createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();
    res.json({ success: true, data: sessions });
});

const getChatSession = asyncHandler(async (req, res) => {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
        res.status(404);
        throw new Error('Chat session not found');
    }
    res.json({ success: true, data: session });
});

const deleteChatSession = asyncHandler(async (req, res) => {
    await ChatSession.findByIdAndDelete(req.params.sessionId);
    res.json({ success: true, message: 'Chat session deleted' });
});

const clearAllHistory = asyncHandler(async (req, res) => {
    await ChatSession.deleteMany({ userId: req.user?._id });
    res.json({ success: true, message: 'All chat history cleared' });
});

const downloadPdf = asyncHandler(async (req, res) => {
    res.status(400).json({ message: 'PDF export not configured' });
});

module.exports = {
    handleAiQuery,
    getChatHistory,
    getChatSession,
    deleteChatSession,
    clearAllHistory,
    downloadPdf
};
