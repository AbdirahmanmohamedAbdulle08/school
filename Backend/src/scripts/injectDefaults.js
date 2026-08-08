const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Account = require('../models/Account');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const injectDefaults = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Defaults to inject
        const defaults = [
            { code: '1010-01', parentCode: '1010', name: 'EVC Plus', type: 'Asset', accountCategory: 'Mobile Money' },
            { code: '1010-02', parentCode: '1010', name: 'Edahab', type: 'Asset', accountCategory: 'Mobile Money' },
            { code: '1010-03', parentCode: '1010', name: 'Merchant Account', type: 'Asset', accountCategory: 'Mobile Money' },
            { code: '1020-01', parentCode: '1020', name: 'Salaam Somali Bank', type: 'Asset', accountCategory: 'Bank' },
            { code: '1020-02', parentCode: '1020', name: 'My Bank', type: 'Asset', accountCategory: 'Bank' }
        ];

        const tenants = await Account.distinct('tenantId');
        console.log(`Processing ${tenants.length} tenants...`);

        for (const tenantId of tenants) {
            // Find warehouses for this tenant
            const warehouses = await Account.distinct('warehouseId', { tenantId });

            for (const warehouseId of warehouses) {
                console.log(`Checking Tenant ${tenantId} / Warehouse ${warehouseId}`);

                // Find parents
                const cashParent = await Account.findOne({ tenantId, warehouseId, code: '1010' });
                const bankParent = await Account.findOne({ tenantId, warehouseId, code: '1020' });

                if (!cashParent || !bankParent) {
                    console.log('Skipping: Parents 1010/1020 missing (run fixHierarchy first?)');
                    continue;
                }

                for (const def of defaults) {
                    const parent = def.parentCode === '1010' ? cashParent : bankParent;

                    // Check if exists
                    const exists = await Account.findOne({
                        tenantId,
                        warehouseId,
                        $or: [
                            { code: def.code },
                            { name: def.name } // Avoid dupes by name too
                        ]
                    });

                    if (!exists) {
                        await Account.create({
                            tenantId,
                            warehouseId,
                            name: def.name,
                            code: def.code,
                            type: def.type,
                            accountCategory: def.accountCategory,
                            parentAccount: parent._id,
                            isSystemAccount: true,
                            isRequired: false
                        });
                        console.log(`> Created ${def.name}`);
                    } else {
                        // console.log(`> Exists: ${def.name}`);
                    }
                }
            }
        }

        console.log('Injection complete.');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

injectDefaults();
