const asyncHandler = require('../middleware/asyncHandler');
const Account = require('../models/Account');
const Warehouse = require('../models/Warehouse');

const getAccounts = asyncHandler(async (req, res) => {
    // Securely use the authenticated user's tenant ID
    const filter = { };
    const isOwner = req.user.roles.some(r => r.name.toLowerCase() === 'owner');

    if (req.query.warehouseId) {
        filter.warehouseId = req.query.warehouseId;
    } else if (!isOwner && req.user.warehouseId) {
        filter.warehouseId = req.user.warehouseId;
    }

    const accounts = await Account.find(filter);
    res.json(accounts);
});


const createAccount = asyncHandler(async (req, res) => {
    let { parentAccount, warehouseId, accountCategory, code, name } = req.body;
    let targetWarehouseId = warehouseId || req.user.warehouseId;

    if (!targetWarehouseId) {
        // Fallback: If no warehouse context, assign to the first created warehouse
        const defaultBranch = await Warehouse.findOne({ }).sort({ createdAt: 1 });
        if (defaultBranch) {
            targetWarehouseId = defaultBranch._id;
        } else {
            res.status(400);
            throw new Error('Warehouse context is missing. Please create a warehouse first.');
        }
    }

   
    if (parentAccount === '' || parentAccount === 'null') {
        parentAccount = null;
    }

    
    const existing = await Account.findOne({
        
        warehouseId: targetWarehouseId,
        code
    });
    if (existing) {
        res.status(400);
        throw new Error(`Account code ${code} already exists.`);
    }

    // Strict Parent Enforcement Logic
    // Mobile Money -> 1010 Cash on Hand
    // Bank -> 1020 Bank Account
    if (accountCategory === 'Mobile Money' && code !== '1010') {
        const parent = await Account.findOne({
            
            warehouseId: targetWarehouseId,
            code: '1010'
        });
        if (!parent) {
            res.status(400);
            throw new Error('System Error: "Cash on Hand" (1010) account missing. Cannot create Mobile Money account.');
        }
        parentAccount = parent._id;
    } else if (accountCategory === 'Bank' && code !== '1020') {
        const parent = await Account.findOne({
            
            warehouseId: targetWarehouseId,
            code: '1020'
        });
        if (!parent) {
            res.status(400);
            throw new Error('System Error: "Bank Account" (1020) account missing. Cannot create Bank account.');
        }
        parentAccount = parent._id;
    }

    const account = await Account.create({
        ...req.body,
        
        warehouseId: targetWarehouseId,
        parentAccount
    });
    res.status(201).json(account);
});

// @desc    Get account by ID
// @route   GET /api/accounts/:id
// @access  Private
const getAccountById = asyncHandler(async (req, res) => {
    const account = await Account.findById(req.params.id);
    if (account) {
        res.json(account);
    } else {
        res.status(404);
        throw new Error('Account not found');
    }
});

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = asyncHandler(async (req, res) => {
    let { parentAccount, code, name } = req.body;
    const account = await Account.findById(req.params.id);

    if (account) {
        // Sanitize parentAccount
        if (parentAccount === '' || parentAccount === 'null') {
            req.body.parentAccount = null;
        }

        // Check for duplicate code if code is changing
        if (code && code !== account.code) {
            const existing = await Account.findOne({
                
                warehouseId: account.warehouseId, // Use existing account's warehouse
                code
            });
            if (existing) {
                res.status(400);
                throw new Error(`Account code ${code} already exists.`);
            }
        }

        const updatedAccount = await Account.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.json(updatedAccount);
    } else {
        res.status(404);
        throw new Error('Account not found');
    }
});

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
    const account = await Account.findById(req.params.id);
    if (account) {
        if (account.isRequired) {
            res.status(403);
            throw new Error('This is a required system account and cannot be deleted.');
        }
        await account.deleteOne();
        res.json({ message: 'Account removed' });
    } else {
        res.status(404);
        throw new Error('Account not found');
    }
});

// @desc    Seed standard accounts
// @route   POST /api/accounts/seed
// @access  Private
const seedAccounts = asyncHandler(async (req, res) => {
    
    const warehouseId = req.body.warehouseId || req.user.warehouseId;

    if (!warehouseId) {
        res.status(400);
        throw new Error('Warehouse assignment required for seeding');
    }

    // Check if accounts already exist for this warehouse
    const existingCount = await Account.countDocuments({  warehouseId });
    if (existingCount > 0) {
        res.status(400);
        throw new Error('Accounts already exist for this warehouse. Seeding skipped.');
    }

    const standardAccounts = [
        // Assets - Roots
        { code: '1010', name: 'Cash on Hand', type: 'Asset', accountCategory: 'Cash', isRequired: true },
        { code: '1020', name: 'Bank Account', type: 'Asset', accountCategory: 'Bank', isRequired: true },
        { code: '1030', name: 'Accounts Receivable', type: 'Asset', accountCategory: 'Other', isRequired: true },
        { code: '1200', name: 'Inventory Asset', type: 'Asset', accountCategory: 'Other', isRequired: true },

        // Assets - Defaults Sub-Accounts (User Requested)
        // Mobile Money -> Cash on Hand (1010)
        { code: '1010-01', parentCode: '1010', name: 'EVC Plus', type: 'Asset', accountCategory: 'Mobile Money', isRequired: false },
        { code: '1010-02', parentCode: '1010', name: 'Edahab', type: 'Asset', accountCategory: 'Mobile Money', isRequired: false },
        { code: '1010-03', parentCode: '1010', name: 'Merchant Account', type: 'Asset', accountCategory: 'Mobile Money', isRequired: false },

        // Banks -> Bank Account (1020)
        { code: '1020-01', parentCode: '1020', name: 'Salaam Somali Bank', type: 'Asset', accountCategory: 'Bank', isRequired: false },
        { code: '1020-02', parentCode: '1020', name: 'My Bank', type: 'Asset', accountCategory: 'Bank', isRequired: false },

        // Liabilities
        { code: '2010', name: 'Accounts Payable', type: 'Liability', accountCategory: 'Other', isRequired: true },
        { code: '2020', name: 'Sales Tax Payable', type: 'Liability', accountCategory: 'Other', isRequired: true },

        // Equity
        { code: '3000', name: 'Equity', type: 'Equity', accountCategory: 'Other', isRequired: true },

        // Income
        { code: '4010', name: 'Income', type: 'Income', accountCategory: 'Other', isRequired: true },

        // Expenses
        { code: '5010', name: 'Cost of Goods Sold', type: 'Expense', accountCategory: 'Other', isRequired: true }
    ];

    const createdAccounts = [];
    const codeToIdMap = {};

    // First pass: Create roots
    for (const accData of standardAccounts.filter(a => !a.parentCode)) {
        const acc = await Account.create({
            
            warehouseId,
            name: accData.name,
            code: accData.code,
            type: accData.type,
            accountCategory: accData.accountCategory,
            isSystemAccount: true,
            isRequired: accData.isRequired
        });
        codeToIdMap[acc.code] = acc._id;
        createdAccounts.push(acc);
    }

    // Second pass: Create children (if any were in standardAccounts, though current prompt lists none)
    for (const accData of standardAccounts.filter(a => a.parentCode)) {
        const parentId = codeToIdMap[accData.parentCode];
        const acc = await Account.create({
            
            warehouseId,
            name: accData.name,
            code: accData.code,
            type: accData.type,
            parentAccount: parentId,
            accountCategory: accData.accountCategory,
            isSystemAccount: true,
            isRequired: accData.isRequired
        });
        codeToIdMap[acc.code] = acc._id;
        createdAccounts.push(acc);
    }

    res.status(201).json(createdAccounts);
});

module.exports = {
    getAccounts,
    createAccount,
    getAccountById,
    updateAccount,
    deleteAccount,
    seedAccounts
};
