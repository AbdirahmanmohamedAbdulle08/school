require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');
const User = require('./models/User');
const Role = require('./models/Role');
const connectDB = require('./db');

const createMireAdmin = async () => {
    try {
        await connectDB();
        console.log('Connected to DB...');

        // 1. Find System Tenant
        const systemTenant = await Tenant.findOne({ subdomain: 'system' });
        if (!systemTenant) {
            console.error('System Tenant not found. Please run seed-admin.js first or ensure system tenant exists.');
            process.exit(1);
        }

        // 2. Find or Create "System Admin" Role
        // User asked for "role system admin". I'll check for that or "Super Admin".
        let adminRole = await Role.findOne({
            tenantId: systemTenant._id,
            $or: [{ name: 'System Admin' }, { name: 'Super Admin' }]
        });

        if (!adminRole) {
            console.log('Creating "System Admin" role...');
            adminRole = await Role.create({
                tenantId: systemTenant._id,
                name: 'System Admin',
                description: 'Requested System Admin Role',
                isSystemRole: true
            });
        } else {
            console.log(`Using existing role: ${adminRole.name}`);
        }

        // 3. Create/Update User
        const email = 'mire@gmail.com';
        const username = 'mire';
        const password = '123456';

        const existingUser = await User.findOne({ email, tenantId: systemTenant._id });

        if (existingUser) {
            console.log('User already exists. Updating password and roles...');
            existingUser.passwordHash = password; // Will be hashed by pre-save
            existingUser.roles = [adminRole._id];
            existingUser.username = username;
            await existingUser.save();
            console.log('User updated successfully.');
        } else {
            console.log('Creating new user...');
            await User.create({
                tenantId: systemTenant._id,
                username,
                email,
                passwordHash: password, // Will be hashed by pre-save
                roles: [adminRole._id],
                status: 'active'
            });
            console.log('User created successfully.');
        }

        console.log('-----------------------------------');
        console.log(`User: ${username}`);
        console.log(`Email: ${email}`);
        console.log('Role: System Admin');
        console.log('Status: Active');
        console.log('-----------------------------------');

        process.exit(0);

    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
};

createMireAdmin();
