require('dotenv').config();
const mongoose = require('mongoose');
const Account = require('./src/models/Account');
const JournalEntry = require('./src/models/JournalEntry');
const Purchase = require('./src/models/Purchase');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✓ MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));

async function diagnose() {
    try {
        console.log('\n=== JOURNAL ENTRIES COUNT ===');
        const jeCount = await JournalEntry.countDocuments();
        console.log(`Total Journal Entries: ${jeCount}`);

        console.log('\n=== RECENT PURCHASES ===');
        const purchases = await Purchase.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();

        purchases.forEach((p, i) => {
            console.log(`\n[${i + 1}] Purchase from ${p.supplier}`);
            console.log(`  Total: $${p.totalCost}`);
            console.log(`  Paid: $${p.amountPaid}`);
            console.log(`  Balance: $${p.balance}`);
            console.log(`  Payment Account: ${p.paymentAccountId || 'Not Set'}`);
            console.log(`  Date: ${p.createdAt}`);
        });

        if (jeCount > 0) {
            console.log('\n=== RECENT JOURNAL ENTRIES ===');
            const entries = await JournalEntry.find()
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();

            entries.forEach((entry, i) => {
                console.log(`\n[${i + 1}] ${entry.description}`);
                console.log(`  Type: ${entry.type} | Ref: ${entry.reference}`);
                console.log(`  Date: ${entry.createdAt}`);
                console.log('  Lines:');
                entry.lines.forEach(line => {
                    console.log(`    ${line.accountCode} - ${line.accountName}`);
                    console.log(`      DR: $${line.debit.toFixed(2)} | CR: $${line.credit.toFixed(2)}`);
                });
            });
        }

        console.log('\n=== ACCOUNT BALANCES ===');
        const accounts = await Account.find({ code: { $in: ['1010', '1020', '1020-01', '1020-02', '1200', '2010'] } })
            .sort({ code: 1 })
            .lean();

        accounts.forEach(acc => {
            console.log(`${acc.code} - ${acc.name}: $${acc.balance.toFixed(2)} (${acc.type})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Diagnostic Error:', error);
        process.exit(1);
    }
}

setTimeout(diagnose, 1000);
