require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const connectDB = require('./db');

const seedAdmin = async () => {
    try {
        await connectDB();

        // 1. Ensure an "Owner" role exists
        console.log('Checking for Owner Role...');
        let ownerRole = await Role.findOne({ name: 'Owner' });
        if (!ownerRole) {
            ownerRole = await Role.create({
                name: 'Owner',
                description: 'Full system access - Business Owner',
                isSystemRole: true
            });
            console.log('✓ Owner Role created.');
        } else {
            console.log('✓ Owner Role already exists.');
        }

        // 2. Check if admin user already exists
        const adminEmail = 'admin@procare.com';
        console.log(`Checking for admin user (${adminEmail})...`);
        const existingUser = await User.findOne({ email: adminEmail });

        if (existingUser) {
            console.log('Admin user already exists. Updating password to 123456...');
            existingUser.passwordHash = '123456'; // Pre-save hook will bcrypt hash this
            existingUser.roles = [ownerRole._id];
            existingUser.status = 'active';
            await existingUser.save();
            console.log('✓ Admin user password updated to 123456.');
        } else {
            console.log('Creating admin user...');
            await User.create({
                username: 'Admin',
                email: adminEmail,
                passwordHash: '123456', // Pre-save hook will bcrypt hash this
                roles: [ownerRole._id],
                status: 'active'
            });
            console.log('✓ Admin user created successfully.');
        }

        console.log('\n========================================');
        console.log('  LOGIN CREDENTIALS');
        console.log('  Email:    admin@procare.com');
        console.log('  Password: 123456');
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
