const mongoose = require('mongoose');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
require('dotenv').config();

const createSystemAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: 'admin@system.local' });
        if (existingAdmin) {
            console.log('❌ System Admin already exists!');
            console.log('Email: admin@system.local');
            console.log('Username: admin');
            process.exit(0);
        }

        // Create System Admin role (tenant-agnostic)
        let systemAdminRole = await Role.findOne({ name: 'System Admin', tenantId: null });

        if (!systemAdminRole) {
            try {
                systemAdminRole = await Role.create({
                    name: 'System Admin',
                    description: 'Platform administrator with global access',
                    permissions: { '*': true },
                    isSystemRole: true,
                    isRequired: true,
                    tenantId: null
                });
                console.log('✓ Created System Admin role');
            } catch (roleError) {
                console.error('Error creating role:', roleError.message);
                console.error('Validation errors:', roleError.errors);
                process.exit(1);
            }
        }

        // Create the admin user
        try {
            const adminUser = await User.create({
                username: 'admin',
                email: 'admin@system.local',
                passwordHash: '1234',
                roles: [systemAdminRole._id],
                status: 'active',
                profile: {
                    firstName: 'System',
                    lastName: 'Administrator'
                }
                // Intentionally omitting tenantId and branchId (they default to undefined/null)
            });

            console.log('\n✅ System Admin created successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Username: admin');
            console.log('Email:    admin@system.local');
            console.log('Password: 1234');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\nYou can now log in to the system.\n');
        } catch (userError) {
            console.error('Error creating user:', userError.message);
            if (userError.errors) {
                console.error('Validation errors:');
                for (const field in userError.errors) {
                    console.error(`  - ${field}: ${userError.errors[field].message}`);
                }
            }
            process.exit(1);
        }

        process.exit(0);
    } catch (error) {
        console.error('Unexpected error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

createSystemAdmin();
