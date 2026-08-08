const asyncHandler = require('../middleware/asyncHandler');
const Role = require('../models/Role');
const User = require('../models/User');

// Seed default system roles if none exist
const seedDefaultRoles = async () => {
    try {
        const count = await Role.countDocuments();
        if (count === 0) {
            const defaultRoles = [
                {
                    name: 'Super Admin',
                    description: 'Full system administrative authority across all modules and settings.',
                    permissions: { '*': true },
                    isSystemRole: true,
                    isRequired: true
                },
                {
                    name: 'Institute Admin',
                    description: 'Complete management access to institute operations, classes, and records.',
                    permissions: {},
                    isSystemRole: true,
                    isRequired: false
                },
                {
                    name: 'Branch Manager',
                    description: 'Administrative access restricted to specific branch operations.',
                    permissions: {},
                    isSystemRole: true,
                    isRequired: false
                },
                {
                    name: 'Teacher',
                    description: 'Access to student classes, attendance tracking, and reports.',
                    permissions: {},
                    isSystemRole: false,
                    isRequired: false
                },
                {
                    name: 'Accountant',
                    description: 'Financial management access for student payments, salaries, expenses, and wallets.',
                    permissions: {},
                    isSystemRole: false,
                    isRequired: false
                }
            ];
            await Role.insertMany(defaultRoles);
            console.log('✓ Default system roles seeded successfully.');
        }
    } catch (err) {
        console.error('Error seeding default roles:', err.message);
    }
};

// @desc    Get all roles with users count
// @route   GET /api/roles
// @access  Private
const getRoles = asyncHandler(async (req, res) => {
    await seedDefaultRoles();
    const roles = await Role.find().sort({ createdAt: -1 });

    const rolesWithCounts = await Promise.all(roles.map(async (role) => {
        const usersCount = await User.countDocuments({
            $or: [
                { roles: role._id },
                { role: role.name }
            ]
        });
        return {
            ...role.toObject(),
            usersCount
        };
    }));

    res.json(rolesWithCounts);
});

// @desc    Get single role by ID
// @route   GET /api/roles/:id
// @access  Private
const getRoleById = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (role) {
        res.json(role);
    } else {
        res.status(404);
        throw new Error('Role not found');
    }
});

// @desc    Create new role
// @route   POST /api/roles
// @access  Private
const createRole = asyncHandler(async (req, res) => {
    const { name, description, permissions } = req.body;
    if (!name || !name.trim()) {
        res.status(400);
        throw new Error('Role name is required');
    }

    const roleExists = await Role.findOne({ name: name.trim() });
    if (roleExists) {
        res.status(400);
        throw new Error('Role with this name already exists');
    }

    const role = await Role.create({
        name: name.trim(),
        description: description || '',
        permissions: permissions || {},
        isSystemRole: false,
        isRequired: false
    });

    res.status(201).json(role);
});

// @desc    Update existing role
// @route   PUT /api/roles/:id
// @access  Private
const updateRole = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);

    if (role) {
        if (role.name === 'Super Admin' || role.name === 'Owner') {
            role.permissions = { '*': true };
        } else {
            role.permissions = req.body.permissions !== undefined ? req.body.permissions : role.permissions;
        }

        if (req.body.name) {
            role.name = req.body.name.trim();
        }
        if (req.body.description !== undefined) {
            role.description = req.body.description;
        }

        const updatedRole = await role.save();
        res.json(updatedRole);
    } else {
        res.status(404);
        throw new Error('Role not found');
    }
});

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private
const deleteRole = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);

    if (!role) {
        res.status(404);
        throw new Error('Role not found');
    }

    if (role.isRequired || role.name === 'Super Admin' || role.name === 'Owner') {
        res.status(400);
        throw new Error('System required roles cannot be deleted');
    }

    await role.deleteOne();
    res.json({ message: 'Role deleted successfully' });
});

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
};
