require('dotenv').config();
const mongoose = require('mongoose');
const JournalEntry = require('./src/models/JournalEntry');
const Account = require('./src/models/Account');
const Purchase = require('./src/models/Purchase');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✓ Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB Error:', err);
        process.exit(1);
    });

async function traceBalances() {
    try {
        // Get the most recent purchase
        console.log('\n========== RECENT PURCHASE ==========');
        const purchase = await Purchase.findOne().sort({ createdAt: -1 });
        if (!purchase) {
            console.log('No purchases found');
            process.exit(0);
        }

        console.log(`Supplier: ${purchase.supplier}`);
        console.log(`Total: $${purchase.totalCost}`);
        console.log(`Paid: $${purchase.amountPaid}`);
        console.log(`Balance: $${purchase.balance}`);
        console.log(`Payment Account ID: ${purchase.paymentAccountId || 'Not set'}`);
        console.log(`Created: ${purchase.createdAt}`);

        // Find journal entries for this purchase
        console.log('\n========== JOURNAL ENTRIES FOR THIS PURCHASE ==========');
        const entries = await JournalEntry.find({
            reference: purchase._id.toString()
        });

        console.log(`Found ${entries.length} journal entry(ies)`);

        entries.forEach((entry, idx) => {
            console.log(`\n--- Entry ${idx + 1} ---`);
            console.log(`Description: ${entry.description}`);
            console.log(`Date: ${entry.createdAt}`);
            console.log(`Lines:`);
            entry.lines.forEach(line => {
                const sign = line.debit > 0 ? '+' : '-';
                const amount = line.debit > 0 ? line.debit : line.credit;
                console.log(`  ${line.accountCode} ${line.accountName}: ${sign}$${amount.toFixed(2)}`);
                console.log(`    (DR: $${line.debit} | CR: $${line.credit})`);
            });
            console.log(`Total DR: $${entry.totalDebit} | Total CR: $${entry.totalCredit}`);
        });

        // Check current account balances
        console.log('\n========== CURRENT ACCOUNT BALANCES ==========');
        const codes = ['1010', '1020', '1020-01', '1020-02', '1200', '2010'];
        const accounts = await Account.find({ code: { $in: codes } }).sort({ code: 1 });

        accounts.forEach(acc => {
            console.log(`${acc.code} ${acc.name}: $${acc.balance.toFixed(2)} (${acc.type})`);
        });

        // Manually calculate what balances SHOULD be based on journal entries
        console.log('\n========== EXPECTED vs ACTUAL BALANCES ==========');
        const allEntries = await JournalEntry.find();

        const expectedBalances = {};
        for (const entry of allEntries) {
            for (const line of entry.lines) {
                const account = await Account.findById(line.accountId);
                if (!account || !codes.includes(account.code)) continue;

                if (!expectedBalances[account.code]) {
                    expectedBalances[account.code] = 0;
                }

                // Calculate balance change
                let change = line.debit - line.credit;
                if (['Liability', 'Equity', 'Income'].includes(account.type)) {
                    change = line.credit - line.debit;
                }
                expectedBalances[account.code] += change;
            }
        }

        accounts.forEach(acc => {
            const expected = expectedBalances[acc.code] || 0;
            const actual = acc.balance;
            const match = Math.abs(expected - actual) < 0.01 ? '✓' : '✗';
            console.log(`${acc.code}: Expected $${expected.toFixed(2)} | Actual $${actual.toFixed(2)} ${match}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setTimeout(traceBalances, 1500);
