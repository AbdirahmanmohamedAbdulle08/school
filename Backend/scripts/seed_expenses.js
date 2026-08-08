const mongoose = require('mongoose');
const JournalEntry = require('../src/models/JournalEntry');
const Account = require('../src/models/Account');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_app');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Failed to connect', err);
        process.exit(1);
    }
};

const seed = async () => {
    await connectDB();

    try {
        // 1. Get Context (Tenant, Branch, User)
        const tenant = await Tenant.findOne();
        if (!tenant) throw new Error('No tenant found');
        const branch = await Branch.findOne({ tenantId: tenant._id });
        const user = await User.findOne({ tenantId: tenant._id });

        console.log(`Using Tenant: ${tenant.name}`);

        // 2. Get Accounts (Expense + Cash)
        // Find 'Rent' or 'Utilities' or any Expense
        const expenseAcc = await Account.findOne({ tenantId: tenant._id, type: 'Expense' });
        // Find 'Cash'
        const cashAcc = await Account.findOne({ tenantId: tenant._id, type: 'Asset', name: { $regex: /Cash|Bank/i } });

        if (!expenseAcc || !cashAcc) {
            throw new Error('Required accounts (Expense/Cash) not found. Run seed_accounts first?');
        }

        // 3. Create Expenses
        const expenses = [
            { desc: 'Office Rent - Jan', amount: 1200 },
            { desc: 'Internet Bill', amount: 85 }
        ];

        for (const exp of expenses) {
            await JournalEntry.create({
                tenantId: tenant._id,
                branchId: branch._id,
                date: new Date(),
                reference: `EXP-SEED-${Date.now()}-${Math.floor(Math.random() * 100)}`,
                description: exp.desc,
                type: 'Expense',
                lines: [
                    {
                        accountId: expenseAcc._id,
                        accountName: expenseAcc.name,
                        accountCode: expenseAcc.code,
                        debit: exp.amount,
                        credit: 0
                    },
                    {
                        accountId: cashAcc._id,
                        accountName: cashAcc.name,
                        accountCode: cashAcc.code,
                        debit: 0,
                        credit: exp.amount
                    }
                ],
                totalDebit: exp.amount,
                totalCredit: exp.amount,
                createdBy: user ? user._id : null
            });
            console.log(`Created expense: ${exp.desc} ($${exp.amount})`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

seed();
