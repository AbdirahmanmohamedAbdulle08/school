const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Account = require('../models/Account');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const diagnose = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const orphans = await Account.find({
            tenantId: { $exists: true },
            parentAccount: null,
            accountCategory: { $in: ['Mobile Money', 'Bank'] },
            code: { $nin: ['1010', '1020'] }
        });

        console.log(`Found ${orphans.length} orphans.`);

        for (const orphan of orphans) {
            console.log(`Orphan: ${orphan.name} (${orphan.code}) - Category: ${orphan.accountCategory} - Warehouse: ${orphan.warehouseId}`);

            // Check for potential parent
            const parentCode = orphan.accountCategory === 'Mobile Money' ? '1010' : '1020';
            const parent = await Account.findOne({
                tenantId: orphan.tenantId,
                warehouseId: orphan.warehouseId,
                code: parentCode
            });

            if (parent) {
                console.log(`  > MATCH FOUND: Parent ${parent.name} (${parent._id}) exists in same warehouse.`);
            } else {
                console.log(`  > FAIL: No parent ${parentCode} found in warehouse ${orphan.warehouseId}`);

                // Check if parent exists in ANY warehouse for this tenant
                const anyParent = await Account.findOne({
                    tenantId: orphan.tenantId,
                    code: parentCode
                });
                if (anyParent) {
                    console.log(`  > NOTE: Parent exists in distinct warehouse: ${anyParent.warehouseId}`);
                }
            }
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

diagnose();
