const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// Helper: Format user response object
const formatUserResponse = (user, token = null) => {
    const obj = {
        _id: user._id,
        fullName: user.fullName,
        username: user.fullName,
        email: user.email,
        phone: user.phone || '',
        gender: user.gender || 'Male',
        role: user.role || 'Teacher',
        roles: user.roles || [],
        salary: user.salary || 0,
        status: user.status || 'active',
        branchId: user.branchId || null,
        createdAt: user.createdAt
    };
    if (token) obj.token = token;
    return obj;
};

// @desc    Register / Create user
// @route   POST /api/users
// @access  Private
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, phone, email, password, role, roles, salary, status, branchId, gender } = req.body;
    let cleanEmail = email ? String(email).trim().toLowerCase() : '';

    if (!cleanEmail) {
        const namePart = (fullName || username || 'teacher').toLowerCase().replace(/[^a-z0-9]/g, '');
        cleanEmail = `${namePart}_${Date.now().toString().slice(-4)}@teacher.local`;
    } else {
        const userExists = await User.findOne({ email: cleanEmail });
        if (userExists) {
            res.status(400);
            throw new Error('User with this email already exists');
        }
    }

    const nameToUse = fullName || username || cleanEmail.split('@')[0];

    const user = await User.create({
        fullName: nameToUse,
        phone: phone || '',
        email: cleanEmail,
        passwordHash: password || '123456',
        gender: gender || 'Male',
        role: role || 'Teacher',
        roles: Array.isArray(roles) ? roles : [],
        salary: salary || 0,
        status: status || 'active',
        branchId
    });

    const populatedUser = await User.findById(user._id).select('-passwordHash').populate('roles');

    if (user) {
        res.status(201).json(formatUserResponse(populatedUser, generateToken(user._id)));
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
    const { role } = req.query;
    let query = {};
    if (role) {
        query.role = role;
    }
    const users = await User.find(query).select('-passwordHash').populate('roles');
    const formatted = users.map(u => formatUserResponse(u));
    res.json(formatted);
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';

    const user = await User.findOne({ email: cleanEmail }).populate('roles');

    if (user && (await user.matchPassword(password))) {
        if (user.status !== 'active') {
            res.status(401);
            throw new Error('Account inactive. Contact admin.');
        }

        res.json(formatUserResponse(user, generateToken(user._id)));
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-passwordHash').populate('roles');
    if (user) {
        res.json(formatUserResponse(user));
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.fullName = req.body.fullName || req.body.username || user.fullName;
        user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
        user.gender = req.body.gender || user.gender;
        user.email = req.body.email ? String(req.body.email).trim().toLowerCase() : user.email;
        user.role = req.body.role || user.role;
        if (Array.isArray(req.body.roles)) {
            user.roles = req.body.roles;
        }
        user.salary = req.body.salary !== undefined ? req.body.salary : user.salary;
        user.status = req.body.status || user.status;
        user.branchId = req.body.branchId || user.branchId;

        if (req.body.password) {
            user.passwordHash = req.body.password;
        }

        await user.save();
        const updatedUser = await User.findById(user._id).select('-passwordHash').populate('roles');

        res.json(formatUserResponse(updatedUser));
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (req.user && user._id.toString() === req.user._id.toString()) {
            res.status(400);
            throw new Error('You cannot delete your own account');
        }

        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get setup status
// @route   GET /api/users/setup-status
// @access  Public
const getSetupStatus = asyncHandler(async (req, res) => {
    const adminCount = await User.countDocuments({ role: { $in: ['Super Admin', 'Owner'] }, status: 'active' });
    const totalCount = await User.countDocuments();
    res.json({
        hasSuperAdmin: adminCount > 0,
        totalUsers: totalCount,
        seedAdminEmail: process.env.ADMIN_EMAIL || 'abdirahmanmohamedabdulle08@gmail.com'
    });
});

// @desc    Setup initial super admin or add new admin
// @route   POST /api/users/setup-initial-admin
// @access  Public
const setupInitialAdmin = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    
    if (!cleanEmail || !password) {
        res.status(400);
        throw new Error('Email iyo Password ayaa loo baahan yahay');
    }

    const Role = require('../models/Role');
    let ownerRole = await Role.findOne({ name: 'Owner' });
    if (!ownerRole) {
        ownerRole = await Role.create({
            name: 'Owner',
            description: 'Full system access - Business Owner',
            isSystemRole: true
        });
    }

    let user = await User.findOne({ email: cleanEmail });
    if (user) {
        user.fullName = fullName || user.fullName;
        user.role = 'Super Admin';
        user.roles = [ownerRole._id];
        user.passwordHash = password;
        user.status = 'active';
        await user.save();
    } else {
        user = await User.create({
            fullName: fullName || 'System Administrator',
            email: cleanEmail,
            passwordHash: password,
            role: 'Super Admin',
            roles: [ownerRole._id],
            status: 'active'
        });
    }

    const populatedUser = await User.findById(user._id).select('-passwordHash').populate('roles');
    res.status(201).json(formatUserResponse(populatedUser, generateToken(user._id)));
});

module.exports = {
    registerUser,
    authUser,
    getUserProfile,
    getUsers,
    updateUser,
    deleteUser,
    getSetupStatus,
    setupInitialAdmin
};

