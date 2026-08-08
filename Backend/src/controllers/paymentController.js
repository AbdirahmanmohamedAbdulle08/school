const asyncHandler = require('../middleware/asyncHandler');
const Payment = require('../models/Payment');

const getPayments = asyncHandler(async (req, res) => {
    const data = await Payment.find()
        .populate({
            path: 'studentId',
            populate: { path: 'classId', select: 'name' }
        })
        .populate('guardianId')
        .populate('walletId', 'name type balance currency')
        .sort({ createdAt: -1 });
    res.json(data);
});

const getPaymentById = asyncHandler(async (req, res) => {
    const data = await Payment.findById(req.params.id)
        .populate({
            path: 'studentId',
            populate: { path: 'classId', select: 'name' }
        })
        .populate('guardianId')
        .populate('walletId', 'name type balance currency');
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Payment not found');
    }
});

const createPayment = asyncHandler(async (req, res) => {
    const Student = require('../models/Student');
    const Transaction = require('../models/Transaction');
    const Wallet = require('../models/Wallet');

    const body = { ...req.body };

    // Auto-generate month if not provided (YYYY-MM format)
    if (!body.month) {
        body.month = new Date().toISOString().slice(0, 7);
    }

    // Auto-resolve guardianId from the student if not provided
    if (!body.guardianId && body.studentId) {
        const student = await Student.findById(body.studentId).select('guardianId fullName branchId');
        if (student?.guardianId) {
            body.guardianId = student.guardianId;
        }
    }

    // Find specific wallet or fallback to active branch wallet
    let wallet = null;
    if (body.walletId) {
        wallet = await Wallet.findById(body.walletId);
    }
    if (!wallet) {
        const student = await Student.findById(body.studentId).select('branchId');
        let branchId = student?.branchId || req.user?.branchId;
        if (!branchId) {
            const Branch = require('../models/Branch');
            const defaultBranch = await Branch.findOne();
            branchId = defaultBranch?._id;
        }
        if (branchId) {
            wallet = await Wallet.findOne({ branchId, status: 'Active' });
        }
        if (!wallet) {
            wallet = await Wallet.findOne({ status: 'Active' });
        }
    }

    // No wallet in the system → refuse to record the payment (no money movement).
    if (!wallet) {
        res.status(400);
        throw new Error('No wallet found in the system. Create a wallet before recording payments.');
    }
    body.walletId = wallet._id;

    // Create the payment record
    const payment = await Payment.create(body);

    // Link transaction & update wallet if payment is completed
    if (payment.status === 'Completed' && wallet) {
        const student = await Student.findById(body.studentId).select('fullName branchId');
        
        let targetBranchId = wallet.branchId || req.user?.branchId || student?.branchId;
        if (!targetBranchId) {
            const Branch = require('../models/Branch');
            const defaultBranch = await Branch.findOne();
            targetBranchId = defaultBranch?._id;
        }

        await Transaction.create({
            branchId: targetBranchId || null,
            walletId: wallet._id,
            type: 'Income',
            amount: body.amount,
            referenceId: payment._id,
            description: body.description || `Fee Payment for ${student?.fullName || 'Student'} (Month: ${body.month})`,
            createdBy: req.user?._id
        });

        wallet.balance = (wallet.balance || 0) + Number(body.amount);
        await wallet.save();
    }

    res.status(201).json(payment);
});

const updatePayment = asyncHandler(async (req, res) => {
    const data = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Payment not found');
    }
});

const deletePayment = asyncHandler(async (req, res) => {
    const Transaction = require('../models/Transaction');
    const Wallet = require('../models/Wallet');

    const payment = await Payment.findById(req.params.id);
    if (payment) {
        if (payment.status === 'Completed' && payment.walletId) {
            const wallet = await Wallet.findById(payment.walletId);
            if (wallet) {
                wallet.balance = Math.max(0, (wallet.balance || 0) - Number(payment.amount));
                await wallet.save();
            }
            await Transaction.deleteMany({ referenceId: payment._id });
        }
        await payment.deleteOne();
        res.json({ message: 'Payment removed' });
    } else {
        res.status(404);
        throw new Error('Payment not found');
    }
});

module.exports = {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment
};
