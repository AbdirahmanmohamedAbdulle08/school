const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const Tenant = require('./src/models/Tenant');
const Branch = require('./src/models/Branch');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Product = require('./src/models/Product');
const Sale = require('./src/models/Sale');
const Purchase = require('./src/models/Purchase');
const Customer = require('./src/models/Customer');
const Vendor = require('./src/models/Vendor');
const Account = require('./src/models/Account');
const Service = require('./src/models/Service');
const Category = require('./src/models/Category');
const Unit = require('./src/models/Unit');
const Adjustment = require('./src/models/Adjustment');
const StockTransaction = require('./src/models/StockTransaction');

const cleanupDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('\n=== DATABASE CLEANUP SCRIPT ===\n');
        console.log('This will delete ALL data from the database.');
        console.log('Press Ctrl+C within 5 seconds to cancel...\n');

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 1: Delete all operational data
        console.log('Step 1: Deleting operational data...');

        const operationalModels = [
            { model: Sale, name: 'Sales' },
            { model: Purchase, name: 'Purchases' },
            { model: StockTransaction, name: 'Stock Transactions' },
            { model: Adjustment, name: 'Adjustments' },
            { model: Product, name: 'Products' },
            { model: Service, name: 'Services' },
            { model: Customer, name: 'Customers' },
            { model: Vendor, name: 'Vendors' },
            { model: Account, name: 'Accounts' }
        ];

        for (const item of operationalModels) {
            const result = await item.model.deleteMany({});
            console.log(`  ✓ Deleted ${result.deletedCount} ${item.name}`);
        }

        // Step 2: Delete configuration data
        console.log('\nStep 2: Deleting configuration data...');

        const configModels = [
            { model: Category, name: 'Categories' },
            { model: Unit, name: 'Units' }
        ];

        for (const item of configModels) {
            const result = await item.model.deleteMany({});
            console.log(`  ✓ Deleted ${result.deletedCount} ${item.name}`);
        }

        // Step 3: Delete users and roles
        console.log('\nStep 3: Deleting users and roles...');

        const userResult = await User.deleteMany({});
        console.log(`  ✓ Deleted ${userResult.deletedCount} Users`);

        const roleResult = await Role.deleteMany({});
        console.log(`  ✓ Deleted ${roleResult.deletedCount} Roles`);

        // Step 4: Delete branches
        console.log('\nStep 4: Deleting branches...');
        const branchResult = await Branch.deleteMany({});
        console.log(`  ✓ Deleted ${branchResult.deletedCount} Branches`);

        // Step 5: Delete tenants
        console.log('\nStep 5: Deleting tenants...');
        const tenantResult = await Tenant.deleteMany({});
        console.log(`  ✓ Deleted ${tenantResult.deletedCount} Tenants`);

        console.log('\n=== CLEANUP COMPLETE ===');
        console.log('Database has been reset. You can now register new tenants.\n');

        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

cleanupDatabase();
