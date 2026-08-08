// Script to check and fix user-role relationships
// Run this in your MongoDB shell or create an endpoint to execute it

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Role = require('./src/models/Role');

async function fixUserRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Step 1: Check all users and their roles
        const users = await User.find().populate('roles');
        console.log(`\nTotal users: ${users.length}`);

        users.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`, {
                email: user.email,
                username: user.username,
                rolesCount: user.roles?.length || 0,
                roles: user.roles?.map(r => r?.name || 'INVALID_ROLE_ID') || []
            });
        });

        // Step 2: Check all roles in database
        const roles = await Role.find();
        console.log(`\n\nTotal roles in database: ${roles.length}`);
        roles.forEach((role, index) => {
            console.log(`Role ${index + 1}:`, {
                id: role._id,
                name: role.name,
                tenantId: role.tenantId
            });
        });

        // Step 3: Fix users with no roles by assigning them a default role
        console.log('\n\n=== Fixing users with no roles ===');
        const usersWithoutRoles = users.filter(u => !u.roles || u.roles.length === 0);

        if (usersWithoutRoles.length > 0) {
            console.log(`Found ${usersWithoutRoles.length} users without roles`);

            for (const user of usersWithoutRoles) {
                console.log(`\nFixing user: ${user.email}`);

                // Find an appropriate role for this user's tenant
                const availableRole = roles.find(r => r.tenantId.toString() === user.tenantId.toString());

                if (availableRole) {
                    user.roles = [availableRole._id];
                    await user.save();
                    console.log(`  ✓ Assigned role "${availableRole.name}" to user ${user.email}`);
                } else {
                    console.log(`  ✗ No role found for tenant ${user.tenantId}. Please create a role first.`);
                }
            }
        } else {
            console.log('All users have roles assigned!');
        }

        console.log('\n\nDone! Please try logging in again.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixUserRoles();
