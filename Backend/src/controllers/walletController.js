const asyncHandler = require('../middleware/asyncHandler');
const Wallet = require('../models/Wallet');

const getWallets = asyncHandler(async (req, res) => {
    const data = await Wallet.find();
    res.json(data);
});

const getWalletById = asyncHandler(async (req, res) => {
    const data = await Wallet.findById(req.params.id);
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Wallet not found');
    }
});

const createWallet = asyncHandler(async (req, res) => {
    const body = { ...req.body };
    // Auto-inject branchId from the authenticated user if not provided
    if (!body.branchId && req.user) {
        body.branchId = req.user.branchId || req.user.warehouseId || req.user.branch || null;
    }
    const data = await Wallet.create(body);
    res.status(201).json(data);
});

const updateWallet = asyncHandler(async (req, res) => {
    const data = await Wallet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Wallet not found');
    }
});

const deleteWallet = asyncHandler(async (req, res) => {
    const data = await Wallet.findByIdAndDelete(req.params.id);
    if (data) {
        res.json({ message: 'Wallet removed' });
    } else {
        res.status(404);
        throw new Error('Wallet not found');
    }
});

module.exports = {
    getWallets,
    getWalletById,
    createWallet,
    updateWallet,
    deleteWallet
};
