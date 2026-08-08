const asyncHandler = require('../middleware/asyncHandler');
const CashbookCategory = require('../models/CashbookCategory');
const CashbookEntry = require('../models/CashbookEntry');
const Guardian = require('../models/Guardian');
const Student = require('../models/Student');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Salary = require('../models/Salary');
const { phoneVariants, isValidSomaliMobile, digitsOnly } = require('../utils/somaliPhone');

const populateEntry = { path: 'categoryId', select: 'title type description' };

// Resolve the wallet an entry should affect: explicit wallet → branch's active wallet → any active wallet.
const resolveWallet = async (walletId, branchId) => {
    let wallet = null;
    if (walletId) wallet = await Wallet.findById(walletId);
    if (!wallet && branchId) wallet = await Wallet.findOne({ branchId, status: 'Active' });
    if (!wallet) wallet = await Wallet.findOne({ status: 'Active' });
    return wallet;
};

// Apply a signed effect to a wallet balance. sign = +1 to apply, -1 to reverse.
// Income raises the balance, Expense lowers it (clamped at 0, mirroring expense/payment flows).
const applyWalletEffect = async (wallet, type, amount, sign = 1) => {
    if (!wallet) return;
    const delta = (type === 'Income' ? 1 : -1) * Number(amount || 0) * sign;
    wallet.balance = Math.max(0, (wallet.balance || 0) + delta);
    await wallet.save();
};

// Keep student fee Payment records in sync with a Cashbook entry.
// When a responsible payer (guardian / student's father) records Income, the
// amount is allocated across their students' outstanding monthly balances and
// stored as Payment records — WITHOUT crediting the wallet again (the Cashbook
// entry already did). This is what makes "Remaining" drop after a partial pay.
const syncFeePayments = async (entry, category, createdBy) => {
    // Always clear any prior fee payments tied to this entry first (idempotent).
    await Payment.deleteMany({ sourceEntryId: entry._id });

    if (!category || category.type !== 'Income') return null;
    if (!['guardian', 'student'].includes(entry.senderEntityType)) return null;

    const variants = phoneVariants(entry.senderPhone);
    const orConds = [];
    if (variants.length) orConds.push({ fatherPhone: { $in: variants } });
    if (entry.senderEntityType === 'guardian' && entry.senderEntityId) {
        orConds.push({ guardianId: entry.senderEntityId });
    }
    if (!orConds.length) return null;

    const students = await Student.find({ $or: orConds })
        .select('fullName monthlyFee fee guardianId branchId');
    if (!students.length) return null;

    const startMonth = (entry.date || new Date().toISOString().split('T')[0]).slice(0, 7); // YYYY-MM

    // Add n months to a "YYYY-MM" string.
    const addMonths = (ym, n) => {
        const [y, m] = ym.split('-').map(Number);
        const d = new Date(Date.UTC(y, (m - 1) + n, 1));
        return d.toISOString().slice(0, 7);
    };

    // Current-month owed (for the ledger snapshot below).
    let totalOwedBefore = 0;
    for (const s of students) {
        const paidDocs = await Payment.find({ studentId: s._id, status: 'Completed', month: startMonth }).select('amount');
        const paid = paidDocs.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        totalOwedBefore += Math.max(0, Number(s.monthlyFee || s.fee || 0) - paid);
    }

    // Allocate the entry amount across the current month first, then roll any
    // leftover into upcoming months (pre-payment). Capped at 12 months ahead.
    let leftover = Number(entry.amount) || 0;
    const toCreate = [];
    for (let mOffset = 0; mOffset < 12 && leftover > 0; mOffset++) {
        const month = addMonths(startMonth, mOffset);
        for (const s of students) {
            if (leftover <= 0) break;
            const paidDocs = await Payment.find({ studentId: s._id, status: 'Completed', month }).select('amount');
            const paid = paidDocs.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const monthlyFee = Number(s.monthlyFee || s.fee || 0);
            const remaining = Math.max(0, monthlyFee - paid);
            if (remaining <= 0) continue;
            const alloc = Math.min(remaining, leftover);
            toCreate.push({
                studentId: s._id,
                guardianId: s.guardianId || undefined,
                walletId: entry.walletId,
                amount: alloc,
                month,
                paymentDate: entry.date || new Date(),
                paymentMethod: ['Bank', 'Mobile Money', 'Card'].includes(entry.method) ? 'Bank Transfer' : 'Cash',
                status: 'Completed',
                description: `Cashbook fee payment (${category.title})${mOffset > 0 ? ` · ${month}` : ''}`,
                sourceEntryId: entry._id
            });
            leftover -= alloc;
        }
    }

    if (toCreate.length) {
        // Direct insert only — no wallet credit / Transaction (Cashbook already handled that).
        await Payment.insertMany(toCreate.map((p) => ({ ...p, createdBy })));
    }

    // Remaining still owed for the CURRENT month after this entry was applied.
    const allocatedThisMonth = toCreate
        .filter((p) => p.month === startMonth)
        .reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, totalOwedBefore - allocatedThisMonth);
};

const getCategories = asyncHandler(async (req, res) => {
    const data = await CashbookCategory.find().sort({ title: 1 });
    res.json(data);
});

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createCategory = asyncHandler(async (req, res) => {
    const { title, type, description } = req.body;
    if (!title || !type) {
        res.status(400);
        throw new Error('Title and type are required');
    }
    // No duplicate category names (case-insensitive) for the same type.
    const duplicate = await CashbookCategory.findOne({
        title: new RegExp(`^${escapeRegex(title.trim())}$`, 'i'),
        type
    });
    if (duplicate) {
        res.status(400);
        throw new Error(`A "${type}" category named "${title.trim()}" already exists`);
    }
    const data = await CashbookCategory.create({
        title: title.trim(),
        type,
        description: description || '',
        createdBy: req.user?._id
    });
    res.status(201).json(data);
});

const updateCategory = asyncHandler(async (req, res) => {
    // Block renaming into a duplicate (case-insensitive, same type), ignoring self.
    if (req.body.title && req.body.type) {
        const duplicate = await CashbookCategory.findOne({
            _id: { $ne: req.params.id },
            title: new RegExp(`^${escapeRegex(req.body.title.trim())}$`, 'i'),
            type: req.body.type
        });
        if (duplicate) {
            res.status(400);
            throw new Error(`A "${req.body.type}" category named "${req.body.title.trim()}" already exists`);
        }
    }
    const data = await CashbookCategory.findByIdAndUpdate(
        req.params.id,
        {
            title: req.body.title?.trim(),
            type: req.body.type,
            description: req.body.description ?? ''
        },
        { new: true, runValidators: true }
    );
    if (!data) {
        res.status(404);
        throw new Error('Category not found');
    }
    res.json(data);
});

const deleteCategory = asyncHandler(async (req, res) => {
    const inUse = await CashbookEntry.countDocuments({ categoryId: req.params.id });
    if (inUse > 0) {
        res.status(400);
        throw new Error('Category is used by cashbook transactions and cannot be deleted');
    }
    const data = await CashbookCategory.findByIdAndDelete(req.params.id);
    if (!data) {
        res.status(404);
        throw new Error('Category not found');
    }
    res.json({ message: 'Category removed' });
});

const getEntries = asyncHandler(async (req, res) => {
    const data = await CashbookEntry.find()
        .populate(populateEntry)
        .sort({ date: -1, createdAt: -1 });
    res.json(data);
});

const resStatus400 = (message) => {
    const err = new Error(message);
    err.statusCode = 400;
    throw err;
};

const validateMobileFields = (method, senderPhone, receiverPhone) => {
    const needsParties = ['Mobile Money', 'Bank', 'EVC-Plus', 'E-Dahab'].includes(method);
    if (!needsParties) return;

    if (['EVC-Plus', 'E-Dahab'].includes(method)) {
        if (!senderPhone || !receiverPhone) {
            resStatus400('EVC-Plus and E-Dahab require both sender and receiver phone numbers');
        }
    }

    if (['EVC-Plus', 'E-Dahab', 'Mobile Money'].includes(method)) {
        if (senderPhone && !isValidSomaliMobile(senderPhone)) {
            resStatus400('Sender phone must be 9 digits (61/62…) or 10 digits (061/062…)');
        }
        if (receiverPhone && !isValidSomaliMobile(receiverPhone)) {
            resStatus400('Receiver phone must be 9 digits (61/62…) or 10 digits (061/062…)');
        }
    }
};

const phoneOrQuery = (field, variants) => ({
    [field]: { $in: variants }
});

const createEntry = asyncHandler(async (req, res) => {
    const {
        categoryId,
        amount,
        method,
        payerName,
        senderPhone,
        senderName,
        senderEntityType,
        senderEntityId,
        receiverPhone,
        receiverName,
        receiverEntityType,
        receiverEntityId,
        date,
        description
    } = req.body;

    if (!categoryId || amount === undefined || amount === null || amount === '') {
        res.status(400);
        throw new Error('Category and amount are required');
    }

    const category = await CashbookCategory.findById(categoryId);
    if (!category) {
        res.status(400);
        throw new Error('Invalid category');
    }

    try {
        validateMobileFields(method || 'Cash', senderPhone, receiverPhone);
    } catch (e) {
        res.status(e.statusCode || 400);
        throw e;
    }

    const branchId = req.user?.branchId;
    const wallet = await resolveWallet(req.body.walletId, branchId);

    // No wallet in the system → refuse to record money (income or expense).
    if (!wallet) {
        res.status(400);
        throw new Error('No wallet found in the system. Create a wallet before recording income or expenses.');
    }

    const data = await CashbookEntry.create({
        categoryId,
        amount: Number(amount),
        method: method || 'Cash',
        payerName: payerName || '',
        senderPhone: digitsOnly(senderPhone),
        senderName: senderName || '',
        senderEntityType: senderEntityType || '',
        senderEntityId: senderEntityId || undefined,
        receiverPhone: digitsOnly(receiverPhone),
        receiverName: receiverName || '',
        receiverEntityType: receiverEntityType || '',
        receiverEntityId: receiverEntityId || undefined,
        date: date || new Date().toISOString().split('T')[0],
        description: description || '',
        branchId,
        walletId: wallet?._id,
        createdBy: req.user?._id
    });

    // Reflect the movement on the system wallet and record it in the transaction ledger.
    if (wallet) {
        await applyWalletEffect(wallet, category.type, data.amount, 1);
        await Transaction.create({
            branchId: wallet.branchId || branchId || null,
            walletId: wallet._id,
            type: category.type,
            amount: data.amount,
            referenceId: data._id,
            description: description || `Cashbook: ${category.title} (${category.type})`,
            date: data.date,
            createdBy: req.user?._id
        });
    }

    // Record student fee payments (partial-aware) linked to this entry, and
    // snapshot how much the payer still owes after this payment.
    const feeRemaining = await syncFeePayments(data, category, req.user?._id);
    if (feeRemaining !== null && feeRemaining !== undefined) {
        data.feeRemaining = feeRemaining;
        await data.save();
    }

    await data.populate(populateEntry);
    res.status(201).json(data);
});

const updateEntry = asyncHandler(async (req, res) => {
    const existing = await CashbookEntry.findById(req.params.id);
    if (!existing) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    const method = req.body.method ?? existing.method;
    const senderPhone = req.body.senderPhone ?? existing.senderPhone;
    const receiverPhone = req.body.receiverPhone ?? existing.receiverPhone;

    try {
        validateMobileFields(method, senderPhone, receiverPhone);
    } catch (e) {
        res.status(e.statusCode || 400);
        throw e;
    }

    // Old category type is needed to reverse the previous wallet effect.
    const oldCategory = await CashbookCategory.findById(existing.categoryId);
    let newCategory = oldCategory;
    if (req.body.categoryId && String(req.body.categoryId) !== String(existing.categoryId)) {
        newCategory = await CashbookCategory.findById(req.body.categoryId);
        if (!newCategory) {
            res.status(400);
            throw new Error('Invalid category');
        }
    }

    const payload = { ...req.body };
    if (payload.senderPhone !== undefined) payload.senderPhone = digitsOnly(payload.senderPhone);
    if (payload.receiverPhone !== undefined) payload.receiverPhone = digitsOnly(payload.receiverPhone);
    if (payload.amount !== undefined) payload.amount = Number(payload.amount);

    // Empty strings for ObjectId fields must become null, otherwise Mongoose throws a Cast error.
    ['senderEntityId', 'receiverEntityId'].forEach((k) => {
        if (k in payload && !payload[k]) payload[k] = null;
    });

    // Reverse the previous effect only if one was actually applied (entry had a wallet).
    if (existing.walletId && oldCategory) {
        const oldWallet = await Wallet.findById(existing.walletId);
        if (oldWallet) await applyWalletEffect(oldWallet, oldCategory.type, existing.amount, -1);
    }

    // Resolve the wallet for the updated entry and apply the new effect.
    const newWallet = await resolveWallet(payload.walletId ?? existing.walletId, existing.branchId);
    payload.walletId = newWallet?._id;

    const data = await CashbookEntry.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true
    }).populate(populateEntry);

    if (newWallet && newCategory) {
        await applyWalletEffect(newWallet, newCategory.type, data.amount, 1);
    }

    // Keep the transaction ledger in sync with the edited entry.
    await Transaction.updateMany(
        { referenceId: data._id },
        {
            walletId: newWallet?._id,
            type: newCategory?.type,
            amount: data.amount,
            branchId: newWallet?.branchId || existing.branchId || null,
            description: data.description || `Cashbook: ${newCategory?.title} (${newCategory?.type})`,
            date: data.date
        }
    );

    // Re-sync linked fee payments against the updated amount / category / date.
    const feeRemaining = await syncFeePayments(data, newCategory, req.user?._id);
    data.feeRemaining = feeRemaining ?? null;
    await data.save();

    res.json(data);
});

const deleteEntry = asyncHandler(async (req, res) => {
    const existing = await CashbookEntry.findById(req.params.id);
    if (!existing) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Reverse the wallet effect (only if one was applied) and remove linked ledger transaction(s).
    if (existing.walletId) {
        const category = await CashbookCategory.findById(existing.categoryId);
        const wallet = await Wallet.findById(existing.walletId);
        if (wallet && category) await applyWalletEffect(wallet, category.type, existing.amount, -1);
    }
    await Transaction.deleteMany({ referenceId: existing._id });
    // Remove any student fee payments recorded from this entry.
    await Payment.deleteMany({ sourceEntryId: existing._id });

    await existing.deleteOne();
    res.json({ message: 'Transaction removed' });
});

const lookupGuardian = async (variants) => {
    const guardian = await Guardian.findOne(phoneOrQuery('phone', variants)).select('fullName phone type');
    if (!guardian) return null;
    return {
        found: true,
        name: guardian.fullName,
        entityType: 'guardian',
        entityId: guardian._id,
        role: guardian.type === 'Responsible' ? 'Responsible' : guardian.type || 'Parent',
        phone: guardian.phone
    };
};

const lookupStudent = async (variants) => {
    const student = await Student.findOne(phoneOrQuery('fatherPhone', variants)).select('fullName fatherPhone fatherName');
    if (!student) return null;
    return {
        found: true,
        name: student.fatherName || student.fullName,
        entityType: 'student',
        entityId: student._id,
        role: 'Responsible',
        phone: student.fatherPhone,
        responsibleName: student.fatherName,
        studentName: student.fullName
    };
};

const lookupUser = async (variants, preferTeacher = false) => {
    const baseQuery = phoneOrQuery('phone', variants);
    const user = preferTeacher
        ? await User.findOne({ ...baseQuery, role: 'Teacher' }).select('fullName phone role')
        : await User.findOne(baseQuery).select('fullName phone role');
    if (!user) return null;
    const entityType = user.role === 'Teacher' ? 'teacher' : 'user';
    return {
        found: true,
        name: user.fullName,
        entityType,
        entityId: user._id,
        role: user.role,
        phone: user.phone
    };
};

// Summarize the students a responsible person pays for: fees, amount paid this month,
// and the remaining balance still owed for the current month.
const summarizeStudents = async (students) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const list = [];
    let totalMonthlyFee = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    for (const s of students) {
        const paidThisMonthAgg = await Payment.find({
            studentId: s._id,
            status: 'Completed',
            month: currentMonth
        }).select('amount');
        const paidThisMonth = paidThisMonthAgg.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const monthlyFee = Number(s.monthlyFee || s.fee || 0);
        const balance = Math.max(0, monthlyFee - paidThisMonth);
        totalMonthlyFee += monthlyFee;
        totalPaid += paidThisMonth;
        totalBalance += balance;
        list.push({
            studentId: s._id,
            name: s.fullName,
            className: s.classId?.name || s.classId?.className || '',
            monthlyFee,
            totalPaid: paidThisMonth,
            balance
        });
    }
    return { students: list, totalMonthlyFee, totalPaid, totalBalance, month: currentMonth, count: list.length };
};

// Attach financial context to a matched payer: teacher salary, or the students they are responsible for.
const buildPayerInfo = async (match, variants) => {
    if (!match) return null;

    // Teacher / staff → show their configured salary and latest paid salary record.
    if (match.entityType === 'teacher' || match.entityType === 'user') {
        const user = await User.findById(match.entityId).select('fullName role salary');
        const lastSalary = await Salary.findOne({ teacherId: match.entityId }).sort({ month: -1, createdAt: -1 }).select('amount month status');
        return {
            kind: 'staff',
            role: user?.role || match.role,
            salary: Number(user?.salary || 0),
            lastSalary: lastSalary ? { amount: Number(lastSalary.amount || 0), month: lastSalary.month, status: lastSalary.status } : null
        };
    }

    // Guardian / responsible / student's father → gather all students under them.
    const orConds = [{ fatherPhone: { $in: variants } }];
    if (match.entityType === 'guardian') orConds.push({ guardianId: match.entityId });
    const students = await Student.find({ $or: orConds })
        .select('fullName classId monthlyFee fee fatherPhone guardianId')
        .populate('classId', 'name className');

    if (!students.length) return { kind: 'responsible', students: [], totalMonthlyFee: 0, totalPaid: 0, count: 0 };
    return { kind: 'responsible', ...(await summarizeStudents(students)) };
};

const lookupPhone = asyncHandler(async (req, res) => {
    const raw = (req.query.phone || '').trim();
    const purpose = (req.query.purpose || 'sender').toLowerCase();
    const variants = phoneVariants(raw);

    if (!variants.length) {
        return res.json({ found: false, name: '', entityType: '', entityId: null, role: '' });
    }

    const tryOrder =
        purpose === 'receiver'
            ? [
                  () => lookupUser(variants, true),
                  () => lookupUser(variants, false),
                  () => lookupGuardian(variants),
                  () => lookupStudent(variants)
              ]
            : [
                  () => lookupGuardian(variants),
                  () => lookupStudent(variants),
                  () => lookupUser(variants, false)
              ];

    for (const lookup of tryOrder) {
        const match = await lookup();
        if (match) {
            const payerInfo = await buildPayerInfo(match, variants);
            return res.json({ ...match, payerInfo });
        }
    }

    res.json({ found: false, name: '', entityType: '', entityId: null, role: '' });
});

// One row per responsible payer (father / guardian): name, number, how many
// students they cover, the total monthly fee, and whether it's fully paid this month.
const getPayers = asyncHandler(async (req, res) => {
    const students = await Student.find()
        .select('fullName fatherName fatherPhone guardianId monthlyFee fee classId')
        .populate('classId', 'name className')
        .populate('guardianId', 'fullName phone')
        .lean();
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    const groups = new Map();
    for (const s of students) {
        // Group by the fee payer (guardian), not the responsible person.
        const guardian = s.guardianId && typeof s.guardianId === 'object' ? s.guardianId : null;
        const payerName = guardian?.fullName || '';
        const payerPhone = guardian?.phone || '';
        const phoneKey = digitsOnly(payerPhone);
        const key = (guardian?._id && `g:${guardian._id}`) || phoneKey || `s:${s._id}`;
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                name: payerName,
                phone: payerPhone,
                guardianId: guardian?._id || null,
                students: [],
                totalFee: 0
            });
        }
        const g = groups.get(key);
        g.students.push(s);
        g.totalFee += Number(s.monthlyFee || s.fee || 0);
        if (!g.name && payerName) g.name = payerName;
        if (!g.phone && payerPhone) g.phone = payerPhone;
    }

    const result = [];
    for (const g of groups.values()) {
        // Per-student paid / remaining for the month.
        const studentDetails = [];
        let paidAmount = 0;
        for (const s of g.students) {
            const pays = await Payment.find({ studentId: s._id, status: 'Completed', month }).select('amount');
            const paid = pays.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const fee = Number(s.monthlyFee || s.fee || 0);
            paidAmount += paid;
            studentDetails.push({
                studentId: s._id,
                name: s.fullName,
                className: s.classId?.name || s.classId?.className || '',
                monthlyFee: fee,
                paid,
                remaining: Math.max(0, fee - paid),
                isPaid: fee > 0 && paid >= fee
            });
        }
        result.push({
            key: g.key,
            name: g.name || 'Unknown',
            phone: g.phone,
            guardianId: g.guardianId,
            studentIds: g.students.map((s) => s._id),
            students: studentDetails,
            studentCount: g.students.length,
            totalFee: g.totalFee,
            paidAmount,
            paid: g.totalFee > 0 && paidAmount >= g.totalFee,
            month
        });
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    res.json(result);
});

// Tick / untick "paid" for a payer. Ticking records the remaining fee as a
// Payment for each of their students (crediting the wallet); unticking removes
// only the payments this toggle created and reverses the wallet.
const togglePayer = asyncHandler(async (req, res) => {
    const { studentIds, paid } = req.body;
    if (!Array.isArray(studentIds) || !studentIds.length) {
        res.status(400);
        throw new Error('No students provided for this payer');
    }

    const month = new Date().toISOString().slice(0, 7);
    const students = await Student.find({ _id: { $in: studentIds } })
        .select('fullName monthlyFee fee guardianId branchId');

    if (paid) {
        const wallet = await resolveWallet(req.body.walletId, req.user?.branchId);
        // No wallet → do not catch any money.
        if (!wallet) {
            res.status(400);
            throw new Error('No wallet found in the system. Create a wallet before recording payments.');
        }
        for (const s of students) {
            const existing = await Payment.find({ studentId: s._id, status: 'Completed', month }).select('amount');
            const already = existing.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const fee = Number(s.monthlyFee || s.fee || 0);
            const remaining = Math.max(0, fee - already);
            if (remaining <= 0) continue;

            const payment = await Payment.create({
                studentId: s._id,
                guardianId: s.guardianId || undefined,
                walletId: wallet?._id,
                amount: remaining,
                month,
                paymentDate: new Date(),
                paymentMethod: 'Cash',
                status: 'Completed',
                description: 'Payer table quick-pay',
                viaPayerToggle: true
            });

            if (wallet) {
                await Transaction.create({
                    branchId: wallet.branchId || req.user?.branchId || null,
                    walletId: wallet._id,
                    type: 'Income',
                    amount: remaining,
                    referenceId: payment._id,
                    description: `Payer quick-pay: ${s.fullName}`,
                    date: new Date(),
                    createdBy: req.user?._id
                });
                wallet.balance = (wallet.balance || 0) + remaining;
            }
        }
        if (wallet) await wallet.save();
    } else {
        // Remove only payments this toggle created, and reverse their wallet effect.
        const pays = await Payment.find({ studentId: { $in: studentIds }, month, viaPayerToggle: true });
        for (const p of pays) {
            if (p.walletId) {
                const w = await Wallet.findById(p.walletId);
                if (w) {
                    w.balance = Math.max(0, (w.balance || 0) - Number(p.amount || 0));
                    await w.save();
                }
            }
            await Transaction.deleteMany({ referenceId: p._id });
            await p.deleteOne();
        }
    }

    res.json({ message: 'Payer payment updated' });
});

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    lookupPhone,
    getPayers,
    togglePayer
};
