const asyncHandler = require('../middleware/asyncHandler');
const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Branch = require('../models/Branch');

const getExpenses = asyncHandler(async (req, res) => {
    const data = await Expense.find()
        .populate('walletId', 'name type balance currency')
        .populate('createdBy', 'fullName username')
        .sort({ createdAt: -1 });
    res.json(data);
});

const getExpenseById = asyncHandler(async (req, res) => {
    const data = await Expense.findById(req.params.id)
        .populate('walletId', 'name type balance currency')
        .populate('createdBy', 'fullName username');
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Expense not found');
    }
});

const createExpense = asyncHandler(async (req, res) => {
    const body = { ...req.body };
    body.createdBy = req.user?._id || body.createdBy;

    // Auto-inject branchId
    if (!body.branchId) {
        body.branchId = req.user?.branchId || req.user?.warehouseId;
        if (!body.branchId) {
            const defaultBranch = await Branch.findOne();
            body.branchId = defaultBranch?._id;
        }
    }

    // Find specific wallet or fallback to active branch wallet
    let wallet = null;
    if (body.walletId) {
        wallet = await Wallet.findById(body.walletId);
    }
    if (!wallet && body.branchId) {
        wallet = await Wallet.findOne({ branchId: body.branchId, status: 'Active' });
    }
    if (!wallet) {
        wallet = await Wallet.findOne({ status: 'Active' });
    }

    // No wallet in the system → refuse to record the expense (no money movement).
    if (!wallet) {
        res.status(400);
        throw new Error('No wallet found in the system. Create a wallet before recording expenses.');
    }
    body.walletId = wallet._id;

    const expense = await Expense.create(body);

    // Deduct from wallet & create transaction
    if (wallet) {
        await Transaction.create({
            branchId: wallet.branchId || body.branchId || null,
            walletId: wallet._id,
            type: 'Expense',
            amount: body.amount,
            referenceId: expense._id,
            description: body.description || `Expense: ${body.title} (${body.category || 'General'})`,
            createdBy: req.user?._id
        });

        wallet.balance = Math.max(0, (wallet.balance || 0) - Number(body.amount));
        await wallet.save();
    }

    res.status(201).json(expense);
});

const updateExpense = asyncHandler(async (req, res) => {
    const data = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Expense not found');
    }
});

const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (expense) {
        if (expense.walletId) {
            const wallet = await Wallet.findById(expense.walletId);
            if (wallet) {
                wallet.balance = (wallet.balance || 0) + Number(expense.amount);
                await wallet.save();
            }
            await Transaction.deleteMany({ referenceId: expense._id });
        }
        await expense.deleteOne();
        res.json({ message: 'Expense removed' });
    } else {
        res.status(404);
        throw new Error('Expense not found');
    }
});

module.exports = {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense
};
