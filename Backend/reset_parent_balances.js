require('dotenv').config();
const mongoose = require('mongoose');
const Account = require('./src/models/Account');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✓ MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Error:', err);
        process.exit(1);
    });

async function resetParentBalances() {
    try {
        console.log('\n========== RESETTING PARENT ACCOUNT BALANCES ==========\n');

        const allAccounts = await Account.find().lean();

        // Find all accounts that have children (are parents)
        const parentIds = new Set(
            allAccounts
                .filter(a => a.parentAccount)
                .map(a => a.parentAccount.toString())
        );

        console.log(`Found ${parentIds.size} parent accounts to reset\n`);

        let resetCount = 0;
        for (const parentIdStr of parentIds) {
            const parent = allAccounts.find(a => a._id.toString() === parentIdStr);
            if (parent) {
                // Reset parent balance to 0
                // Frontend will calculate the correct total by summing children
                await Account.findByIdAndUpdate(parent._id, { balance: 0 });
                console.log(`✓ Reset ${parent.code} - ${parent.name} balance to $0.00`);
                resetCount++;
            }
        }

        console.log(`\n========== COMPLETED ==========`);
        console.log(`Reset ${resetCount} parent account balances`);
        console.log(`Child accounts retain their transaction balances`);
        console.log(`Parent totals will be calculated dynamically in the UI\n`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setTimeout(resetParentBalances, 1000);
