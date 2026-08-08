const asyncHandler = require('../middleware/asyncHandler');
const Notification = require('../models/Notification');

const getNotifications = asyncHandler(async (req, res) => {
    const data = await Notification.find();
    res.json(data);
});

const getNotificationById = asyncHandler(async (req, res) => {
    const data = await Notification.findById(req.params.id);
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

const createNotification = asyncHandler(async (req, res) => {
    const data = await Notification.create(req.body);
    res.status(201).json(data);
});

const updateNotification = asyncHandler(async (req, res) => {
    const data = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

const deleteNotification = asyncHandler(async (req, res) => {
    const data = await Notification.findByIdAndDelete(req.params.id);
    if (data) {
        res.json({ message: 'Notification removed' });
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

module.exports = {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification
};
