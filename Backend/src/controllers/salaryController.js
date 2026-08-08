const asyncHandler = require('../middleware/asyncHandler');
const Salary = require('../models/Salary');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

const getSalarys = asyncHandler(async (req, res) => {
    const data = await Salary.find()
        .populate('teacherId', 'fullName username email')
        .populate('paidBy', 'fullName username')
        .populate('walletId', 'name type balance currency')
        .sort({ createdAt: -1 });
    res.json(data);
});

const getSalaryById = asyncHandler(async (req, res) => {
    const data = await Salary.findById(req.params.id)
        .populate('teacherId', 'fullName username email')
        .populate('paidBy', 'fullName username')
        .populate('walletId', 'name type balance currency');
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Salary not found');
    }
});

const createSalary = asyncHandler(async (req, res) => {
    const body = { ...req.body };
    body.paidBy = req.user?._id;

    // Find specific wallet or fallback to active branch wallet
    let wallet = null;
    if (body.walletId) {
        wallet = await Wallet.findById(body.walletId);
    }
    if (!wallet) {
        let branchId = req.user?.branchId || req.user?.warehouseId;
        if (branchId) {
            wallet = await Wallet.findOne({ branchId, status: 'Active' });
        }
        if (!wallet) {
            wallet = await Wallet.findOne({ status: 'Active' });
        }
    }

    if (wallet) {
        body.walletId = wallet._id;
    }

    const salary = await Salary.create(body);

    // Deduct from wallet & create transaction if Paid
    if (salary.status === 'Paid' && wallet) {
        const teacher = await User.findById(body.teacherId).select('fullName username');
        const teacherName = teacher?.fullName || teacher?.username || 'Teacher';

        let targetBranchId = wallet.branchId || req.user?.branchId;
        if (!targetBranchId) {
            const Branch = require('../models/Branch');
            const defaultBranch = await Branch.findOne();
            targetBranchId = defaultBranch?._id;
        }

        await Transaction.create({
            branchId: targetBranchId || null,
            walletId: wallet._id,
            type: 'Expense',
            amount: body.amount,
            referenceId: salary._id,
            description: `Salary Disbursement for ${teacherName} (Month: ${body.month || 'Current'})`,
            createdBy: req.user?._id
        });

        wallet.balance = Math.max(0, (wallet.balance || 0) - Number(body.amount));
        await wallet.save();
    }

    res.status(201).json(salary);
});

const updateSalary = asyncHandler(async (req, res) => {
    const data = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Salary not found');
    }
});

const deleteSalary = asyncHandler(async (req, res) => {
    const salary = await Salary.findById(req.params.id);
    if (salary) {
        if (salary.status === 'Paid' && salary.walletId) {
            const wallet = await Wallet.findById(salary.walletId);
            if (wallet) {
                wallet.balance = (wallet.balance || 0) + Number(salary.amount);
                await wallet.save();
            }
            await Transaction.deleteMany({ referenceId: salary._id });
        }
        await salary.deleteOne();
        res.json({ message: 'Salary removed' });
    } else {
        res.status(404);
        throw new Error('Salary not found');
    }
});

module.exports = {
    getSalarys,
    getSalaryById,
    createSalary,
    updateSalary,
    deleteSalary
};
