const VALID_ACTIONS = ['Read', 'Write', 'Execute', 'Export', 'Refresh'];

const ACTION_ALIASES = {
    view: 'Read',
    read: 'Read',
    create: 'Write',
    edit: 'Write',
    update: 'Write',
    delete: 'Write',
    write: 'Write',
    execute: 'Execute',
    excute: 'Execute',
    run: 'Execute',
    export: 'Export',
    refresh: 'Refresh'
};

const normalizeAction = (action) => ACTION_ALIASES[String(action || '').trim().toLowerCase()] || null;

const permissionObjectHasAction = (permissions, action) => {
    const normalizedAction = normalizeAction(action);
    if (!permissions || !normalizedAction || typeof permissions !== 'object') return false;

    return Object.entries(permissions).some(([storedAction, value]) =>
        value === true && normalizeAction(storedAction) === normalizedAction
    );
};

const normalizePermissions = (permissions) => {
    if (!permissions || typeof permissions !== 'object') return {};
    if (permissions['*'] === true) return { '*': true };

    return Object.entries(permissions).reduce((moduleAcc, [moduleName, modulePerms]) => {
        if (!moduleName || !modulePerms || typeof modulePerms !== 'object') return moduleAcc;

        const normalizedModule = Object.entries(modulePerms).reduce((subAcc, [subName, subPerms]) => {
            if (!subName || !subPerms || typeof subPerms !== 'object') return subAcc;

            const normalizedSub = VALID_ACTIONS.reduce((actionAcc, action) => {
                actionAcc[action] = false;
                return actionAcc;
            }, {});

            Object.entries(subPerms).forEach(([actionName, value]) => {
                const normalizedAction = normalizeAction(actionName);
                if (normalizedAction) {
                    normalizedSub[normalizedAction] = normalizedSub[normalizedAction] || value === true;
                }
            });

            subAcc[subName] = normalizedSub;
            return subAcc;
        }, {});

        moduleAcc[moduleName] = normalizedModule;
        return moduleAcc;
    }, {});
};

const roleHasPermission = (role, moduleName, action, subModuleName = null) => {
    if (!role || !role.permissions) return false;
    if (role.name === 'Super Admin' || role.name === 'Owner' || role.permissions['*'] === true) return true;

    const normalizedAction = normalizeAction(action);
    if (!normalizedAction) return false;

    const modulePerms = role.permissions[moduleName];
    if (!modulePerms || typeof modulePerms !== 'object') return false;

    if (subModuleName) {
        return permissionObjectHasAction(modulePerms[subModuleName], normalizedAction);
    }

    return Object.values(modulePerms).some(subPerms =>
        permissionObjectHasAction(subPerms, normalizedAction)
    );
};

module.exports = {
    VALID_ACTIONS,
    normalizePermissions,
    roleHasPermission
};
