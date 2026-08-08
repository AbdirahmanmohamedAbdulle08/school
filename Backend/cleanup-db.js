require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/db');

const cleanupDatabase = async () => {
    try {
        await connectDB();
        console.log('\n--- Database Cleanup Started ---');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        console.log('Current collections in database:');
        console.log(collectionNames.join(', '));

        const collectionsToRemove = ['tenants', 'subscriptions', 'featureflags'];
        let removedCount = 0;

        for (const name of collectionsToRemove) {
            if (collectionNames.includes(name)) {
                console.log(`Dropping obsolete collection: ${name}...`);
                await db.dropCollection(name);
                console.log(`✓ Collection '${name}' dropped.`);
                removedCount++;
            }
        }

        if (removedCount === 0) {
            console.log('No obsolete collections found to clean up.');
        } else {
            console.log(`\nCleanup complete. Removed ${removedCount} collections.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

cleanupDatabase();
