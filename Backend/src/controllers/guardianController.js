const asyncHandler = require('../middleware/asyncHandler');
const Guardian = require('../models/Guardian');

const getGuardians = asyncHandler(async (req, res) => {
    const phone = (req.query.phone || '').trim();
    const query = phone ? { phone } : {};
    const data = await Guardian.find(query);
    res.json(data);
});

const getGuardianById = asyncHandler(async (req, res) => {
    const data = await Guardian.findById(req.params.id);
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Guardian not found');
    }
});

const createGuardian = asyncHandler(async (req, res) => {
    const normalizedPhone = (req.body.phone || '').trim();

    if (!normalizedPhone) {
        res.status(400);
        throw new Error('Guardian phone number is required');
    }

    const existingGuardian = await Guardian.findOne({ phone: normalizedPhone });
    if (existingGuardian) {
        res.status(200).json(existingGuardian);
        return;
    }

    const data = await Guardian.create({ ...req.body, phone: normalizedPhone });
    res.status(201).json(data);
});

const updateGuardian = asyncHandler(async (req, res) => {
    const normalizedPhone = (req.body.phone || '').trim();

    if (normalizedPhone) {
        const existingGuardian = await Guardian.findOne({ phone: normalizedPhone, _id: { $ne: req.params.id } });
        if (existingGuardian) {
            res.status(409);
            throw new Error('A guardian with this phone number already exists');
        }
    }

    const data = await Guardian.findByIdAndUpdate(req.params.id, { ...req.body, phone: normalizedPhone || undefined }, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Guardian not found');
    }
});

const deleteGuardian = asyncHandler(async (req, res) => {
    const data = await Guardian.findByIdAndDelete(req.params.id);
    if (data) {
        res.json({ message: 'Guardian removed' });
    } else {
        res.status(404);
        throw new Error('Guardian not found');
    }
});

module.exports = {
    getGuardians,
    getGuardianById,
    createGuardian,
    updateGuardian,
    deleteGuardian
};
