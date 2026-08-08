const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dropIndex = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/FInventry-System';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('products');

        console.log('Attempting to drop index: tenantId_1_sku_1');
        try {
            await collection.dropIndex('tenantId_1_sku_1');
            console.log('Successfully dropped index tenantId_1_sku_1');
        } catch (e) {
            if (e.codeName === 'IndexNotFound') {
                console.log('Index tenantId_1_sku_1 not found, might have been dropped already.');
            } else {
                throw e;
            }
        }

        console.log('Ensuring new index: tenantId_1_branchId_1_sku_1');
        await collection.createIndex({ tenantId: 1, branchId: 1, sku: 1 }, { unique: true });
        console.log('New unique index created/verified.');

        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

dropIndex();
