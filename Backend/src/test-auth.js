require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');
const User = require('./models/User');
const Role = require('./models/Role');
const connectDB = require('./db');

const testAuth = async () => {
    try {
        await connectDB();
        console.log('Using DB:', process.env.MONGO_URI);

        // 1. Cleanup old test data
        console.log('Cleaning up old test tenant...');
        await Tenant.deleteMany({ subdomain: 'testcompany' });
        await User.deleteMany({ email: 'owner@test.com' }); // CAREFUL!

        // 2. Mock Registration Flow (like in tenantController)
        console.log('Testing Registration Flow...');

        // Create Tenant
        const tenant = await Tenant.create({
            name: 'Test Company',
            subdomain: 'testcompany',
            status: 'active'
        });

        // Create Role
        const ownerRole = await Role.create({
            tenantId: tenant._id,
            name: 'Owner',
            isSystemRole: true
        });

        // Create User (This triggers pre-save hash hook)
        const passwordOriginal = 'secret123';
        const user = await User.create({
            tenantId: tenant._id,
            username: 'owner',
            email: 'owner@test.com',
            passwordHash: passwordOriginal,
            roles: [ownerRole._id]
        });
        console.log('User created. Hashed Password:', user.passwordHash);

        // 3. Test Password Matching
        console.log('Testing Password Match...');
        const isMatch = await user.matchPassword(passwordOriginal);
        console.log(`Password Match Result (should be true): ${isMatch}`);

        const isMatchFail = await user.matchPassword('wrongpassword');
        console.log(`Password Match Fail Test (should be false): ${isMatchFail}`);

        // cleanup
        console.log('Cleaning up...');
        await Tenant.deleteOne({ _id: tenant._id });
        await User.deleteOne({ _id: user._id });
        await Role.deleteOne({ _id: ownerRole._id });

        console.log('Auth Logic Verified.');
        process.exit(0);

    } catch (error) {
        console.error('Auth Verification Failed:', error);
        process.exit(1);
    }
};

testAuth();
