const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Tenant = require('./src/models/Tenant');

async function createSystemAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Step 1: Find or create a tenant
        let tenant = await Tenant.findOne();
        if (!tenant) {
            console.log('No tenant found. Creating default tenant...');
            tenant = await Tenant.create({
                name: 'System Administration',
                subdomain: 'system-admin',
                legalName: 'System Administration',
                contactInfo: {
                    email: 'admin@system.com'
                },
                status: 'active'
            });
            console.log('✓ Tenant created:', tenant.name);
        } else {
            console.log('✓ Using existing tenant:', tenant.name);
        }

        // Step 2: Find or create System Admin role
        let adminRole = await Role.findOne({
            tenantId: tenant._id,
            name: 'System Admin'
        });

        if (!adminRole) {
            console.log('\nCreating System Admin role...');
            adminRole = await Role.create({
                tenantId: tenant._id,
                name: 'System Admin',
                description: 'Full system access',
                isSystemRole: true,
                permissions: {} // System Admin has full access by role name check
            });
            console.log('✓ System Admin role created');
        } else {
            console.log('\n✓ System Admin role already exists');
        }

        // Step 3: Check if user already exists
        const existingUser = await User.findOne({
            email: 'ccm@gmail.com',
            tenantId: tenant._id
        });

        if (existingUser) {
            console.log('\n⚠ User ccm@gmail.com already exists!');
            console.log('Updating password and role...');

            existingUser.passwordHash = '1234'; // Will be hashed by pre-save hook
            existingUser.roles = [adminRole._id];
            existingUser.status = 'active';
            await existingUser.save();

            console.log('✓ User updated successfully');
        } else {
            console.log('\nCreating new user...');

            const newUser = await User.create({
                tenantId: tenant._id,
                username: 'ccm',
                email: 'ccm@gmail.com',
                passwordHash: '1234', // Will be hashed by pre-save hook
                roles: [adminRole._id],
                status: 'active'
            });

            console.log('✓ User created successfully');
        }

        // Step 4: Verify the user
        const verifyUser = await User.findOne({ email: 'ccm@gmail.com' }).populate('roles');
        console.log('\n=== User Details ===');
        console.log('Email:', verifyUser.email);
        console.log('Username:', verifyUser.username);
        console.log('Status:', verifyUser.status);
        console.log('Roles:', verifyUser.roles.map(r => r.name));
        console.log('Tenant ID:', verifyUser.tenantId);

        console.log('\n✅ SUCCESS! You can now login with:');
        console.log('  Email: ccm@gmail.com');
        console.log('  Password: 1234');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

createSystemAdmin();
