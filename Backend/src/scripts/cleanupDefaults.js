const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Account = require('../models/Account');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const cleanupDefaults = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Codes of accounts to remove
        const codesToRemove = [
            '1010-01', // EVC Plus
            '1010-02', // Edahab
            '1010-03', // Merchant Account
            '1020-01', // Salaam Somali Bank
            '1020-02'  // My Bank
        ];

        const result = await Account.deleteMany({
            code: { $in: codesToRemove }
        });

        console.log(`Deleted ${result.deletedCount} default sub-accounts.`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanupDefaults();
