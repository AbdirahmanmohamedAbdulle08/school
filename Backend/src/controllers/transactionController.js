const asyncHandler = require('../middleware/asyncHandler');
const Transaction = require('../models/Transaction');

const getTransactions = asyncHandler(async (req, res) => {
    const data = await Transaction.find();
    res.json(data);
});

const getTransactionById = asyncHandler(async (req, res) => {
    const data = await Transaction.findById(req.params.id);
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Transaction not found');
    }
});

const createTransaction = asyncHandler(async (req, res) => {
    const data = await Transaction.create(req.body);
    res.status(201).json(data);
});

const updateTransaction = asyncHandler(async (req, res) => {
    const data = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Transaction not found');
    }
});

const deleteTransaction = asyncHandler(async (req, res) => {
    const Wallet = require('../models/Wallet');

    const tx = await Transaction.findById(req.params.id);
    if (!tx) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Reverse the wallet movement this transaction represents, since it is being
    // removed from the system. Income had raised the balance (subtract it back);
    // Expense had lowered it (add it back).
    if (tx.walletId) {
        const wallet = await Wallet.findById(tx.walletId);
        if (wallet) {
            const delta = tx.type === 'Income' ? -Number(tx.amount || 0) : Number(tx.amount || 0);
            wallet.balance = Math.max(0, (wallet.balance || 0) + delta);
            await wallet.save();
        }
    }

    await tx.deleteOne();
    res.json({ message: 'Transaction removed' });
});

module.exports = {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
};
