const asyncHandler = require('../middleware/asyncHandler');
const Class = require('../models/Class');

const getClasss = asyncHandler(async (req, res) => {
    const data = await Class.find();
    res.json(data);
});

const getClassById = asyncHandler(async (req, res) => {
    const data = await Class.findById(req.params.id);
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Class not found');
    }
});

const normalizeClassPayload = (req) => {
    const payload = { ...req.body };

    if (payload.name && !payload.className) {
        payload.className = payload.name;
    }

    if (!payload.name && payload.className) {
        payload.name = payload.className;
    }

    if (payload.fee !== undefined && payload.monthlyFee === undefined) {
        payload.monthlyFee = payload.fee;
    }

    if (payload.gradeLevel === undefined) {
        payload.gradeLevel = '';
    }

    if (payload.room === undefined) {
        payload.room = '';
    }

    return payload;
};

const createClass = asyncHandler(async (req, res) => {
    const data = await Class.create(normalizeClassPayload(req));
    res.status(201).json(data);
});

const updateClass = asyncHandler(async (req, res) => {
    const data = await Class.findByIdAndUpdate(req.params.id, normalizeClassPayload(req), { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Class not found');
    }
});

const deleteClass = asyncHandler(async (req, res) => {
    const data = await Class.findByIdAndDelete(req.params.id);
    if (data) {
        res.json({ message: 'Class removed' });
    } else {
        res.status(404);
        throw new Error('Class not found');
    }
});

module.exports = {
    getClasss,
    getClassById,
    createClass,
    updateClass,
    deleteClass
};
