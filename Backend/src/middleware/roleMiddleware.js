const asyncHandler = require('./asyncHandler');
const { roleHasPermission } = require('../utils/permissionUtils');

const getUserWithRoles = async (req) => {
    if (!req.user) return { roles: [] };

    try {
        if (req.user.populate && typeof req.user.populate === 'function') {
            await req.user.populate('roles');
        }
    } catch (e) {
        console.warn('Role populate notice:', e.message);
    }

    return {
        ...req.user.toObject ? req.user.toObject() : req.user,
        roles: Array.isArray(req.user.roles) ? req.user.roles : []
    };
};

const checkIfAdmin = (req, userWithRoles) => {
    const primaryRole = String(req.user?.role || '').toLowerCase();
    if (primaryRole.includes('admin') || primaryRole.includes('owner') || primaryRole.includes('system') || primaryRole.includes('super')) {
        return true;
    }

    return (userWithRoles.roles || []).some(role => {
        const roleName = String(role?.name || '').toLowerCase();
        return roleName.includes('admin') || roleName.includes('owner') || roleName.includes('system') || roleName.includes('super');
    });
};

// Check if user has specific permission
// Usage: checkPermission('Inventory', 'create')
const checkPermission = (moduleName, action, subModuleName = null) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('User not authenticated');
        }

        const userWithRoles = await getUserWithRoles(req);
        if (checkIfAdmin(req, userWithRoles)) {
            return next();
        }

        // Check if any role has the required permission in the object hierarchy
        const hasPermission = (userWithRoles.roles || []).some(role =>
            roleHasPermission(role, moduleName, action, subModuleName)
        );

        if (!hasPermission) {
            res.status(403);
            throw new Error(`Not authorized. Requires ${action} permission on ${moduleName} module.`);
        }

        next();
    });
};

const checkAnyPermission = (moduleName, actions = [], subModuleName = null) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('User not authenticated');
        }

        const userWithRoles = await getUserWithRoles(req);
        if (checkIfAdmin(req, userWithRoles)) {
            return next();
        }

        const hasPermission = (userWithRoles.roles || []).some(role =>
            actions.some(action => roleHasPermission(role, moduleName, action, subModuleName))
        );

        if (!hasPermission) {
            res.status(403);
            throw new Error(`Not authorized. Requires one of ${actions.join(', ')} permission on ${moduleName} module.`);
        }

        next();
    });
};

const checkAnyPermissionSet = (permissionSets = []) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('User not authenticated');
        }

        const userWithRoles = await getUserWithRoles(req);
        if (checkIfAdmin(req, userWithRoles)) {
            return next();
        }

        const hasPermission = (userWithRoles.roles || []).some(role =>
            permissionSets.some(({ moduleName, actions = [], subModuleName = null }) =>
                actions.some(action => roleHasPermission(role, moduleName, action, subModuleName))
            )
        );

        if (!hasPermission) {
            res.status(403);
            throw new Error('Not authorized. Requires customer permission.');
        }

        next();
    });
};

// Restrict to specific role names
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('User not authenticated');
        }

        const primaryRole = String(req.user.role || '');
        if (allowedRoles.includes(primaryRole)) {
            return next();
        }

        const userRoles = Array.isArray(req.user.roles) ? req.user.roles.map(r => r.name || r) : [];
        const hasRole = allowedRoles.some(r => userRoles.includes(r));
        if (hasRole) {
            return next();
        }

        res.status(403);
        throw new Error('Not authorized for this operation');
    };
};

module.exports = { checkPermission, checkAnyPermission, checkAnyPermissionSet, restrictTo };
