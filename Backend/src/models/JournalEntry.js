const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
    
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    reference: {
        type: String, // e.g., Invoice No, Purchase ID
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Sale', 'Purchase', 'Payment', 'Adjustment', 'Opening Balance', 'Manual', 'Expense'],
        required: true
    },
    notes: String,
    lines: [{
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            required: true
        },
        accountName: String, // Cache name for easier reporting
        accountCode: String, // Cache code
        debit: {
            type: Number,
            default: 0
        },
        credit: {
            type: Number,
            default: 0
        }
    }],
    totalDebit: {
        type: Number,
        required: true
    },
    totalCredit: {
        type: Number,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure debits equal credits before saving
journalEntrySchema.pre('save', function (next) {
    if (this.totalDebit !== this.totalCredit) {
        return next(new Error('Total debits must equal total credits'));
    }
    next();
});

// Post-save hook to update Account balances
journalEntrySchema.post('save', async function (doc) {
    const Account = mongoose.model('Account');

    console.log(`\n[JE Hook] Processing Journal Entry: ${doc._id}`);
    console.log(`[JE Hook] Description: ${doc.description}`);

    for (const line of doc.lines) {
        const adjustment = line.debit - line.credit;
        // Logic for balance increase/decrease depends on account type
        // Asset/Expense: Debit increases (+), Credit decreases (-)
        // Liability/Equity/Income: Credit increases (+), Debit decreases (-)

        const account = await Account.findById(line.accountId);
        if (account) {
            let balanceChange = adjustment;
            if (['Liability', 'Equity', 'Income'].includes(account.type)) {
                balanceChange = line.credit - line.debit;
            }

            console.log(`[JE Hook] Processing account: ${account.code} - ${account.name}`);
            console.log(`[JE Hook]   DR: ${line.debit}, CR: ${line.credit}, Change: ${balanceChange}`);

            // Update the account itself
            await Account.findByIdAndUpdate(line.accountId, {
                $inc: { balance: balanceChange }
            });
            console.log(`[JE Hook]   Updated ${account.code} balance by ${balanceChange}`);

            // REMOVED: Recursive parent update
            // Parent balances are now calculated dynamically on the frontend by summing children
            // This prevents double-counting when frontend also aggregates the hierarchy

            /* DISABLED - Frontend now handles parent aggregation
            let currentParentId = account.parentAccount;
            let depth = 1;
            while (currentParentId) {
                const parentAcc = await Account.findById(currentParentId);
                if (parentAcc) {
                    await Account.findByIdAndUpdate(currentParentId, {
                        $inc: { balance: balanceChange }
                    });
                    console.log(`[JE Hook]   ${'  '.repeat(depth)}Updated parent ${parentAcc.code} - ${parentAcc.name} by ${balanceChange}`);
                    currentParentId = parentAcc.parentAccount;
                    depth++;
                } else {
                    currentParentId = null;
                }
            }
            */
        }
    }
    console.log(`[JE Hook] Finished processing Journal Entry\n`);
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
