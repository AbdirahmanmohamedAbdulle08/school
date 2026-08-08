const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Account = require('../models/Account');

// Assuming running from 'Backend' root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixHierarchy = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const accounts = await Account.find({});
        console.log(`Found ${accounts.length} total accounts.`);

        // Group by Tenant/Warehouse to ensure we find parents within the same scope
        const scopeMap = {};

        // 1. Index all potential parents (1010, 1020)
        for (const acc of accounts) {
            const key = `${acc.tenantId}-${acc.warehouseId}`;
            if (!scopeMap[key]) scopeMap[key] = { cashParent: null, bankParent: null };

            if (acc.code === '1010') scopeMap[key].cashParent = acc._id;
            if (acc.code === '1020') scopeMap[key].bankParent = acc._id;
        }

        let updatedCount = 0;

        // 2. Fix Orphans
        for (const acc of accounts) {
            const key = `${acc.tenantId}-${acc.warehouseId}`;
            const scope = scopeMap[key];

            if (!scope) continue;

            let newParent = null;

            if (acc.accountCategory === 'Mobile Money' && acc.code !== '1010' && !acc.parentAccount) {
                newParent = scope.cashParent;
            } else if (acc.accountCategory === 'Bank' && acc.code !== '1020' && !acc.parentAccount) {
                newParent = scope.bankParent;
            }

            if (newParent) {
                acc.parentAccount = newParent;
                await acc.save();
                console.log(`Linked ${acc.name} (${acc.code}) to parent ${newParent}`);
                updatedCount++;
            }
        }

        console.log(`Hierarchy fix complete. Updated ${updatedCount} accounts.`);
        process.exit();
    } catch (error) {
        console.error('Error fixing hierarchy:', error);
        process.exit(1);
    }
};

fixHierarchy();
