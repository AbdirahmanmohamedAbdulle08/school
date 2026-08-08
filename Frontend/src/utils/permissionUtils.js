export const PERMISSION_ACTIONS = ['Read', 'Add', 'Edit', 'Delete', 'Export'];

const ACTION_ALIASES = {
  view: 'Read',
  read: 'Read',
  list: 'Read',
  create: 'Add',
  add: 'Add',
  write: 'Add',
  edit: 'Edit',
  update: 'Edit',
  delete: 'Delete',
  remove: 'Delete',
  export: 'Export'
};

export const normalizeAction = (action) => ACTION_ALIASES[String(action || '').trim().toLowerCase()] || null;

const permissionObjectHasAction = (permissions, action) => {
  const normalizedAction = normalizeAction(action);
  if (!permissions || !normalizedAction || typeof permissions !== 'object') return false;

  return Object.entries(permissions).some(([storedAction, value]) =>
    value === true && normalizeAction(storedAction) === normalizedAction
  );
};

export const normalizePermissions = (permissions, template = null) => {
  const normalized = template ? JSON.parse(JSON.stringify(template)) : {};
  if (!permissions || typeof permissions !== 'object') return normalized;

  if (permissions['*'] === true) {
    Object.keys(normalized).forEach(moduleName => {
      Object.keys(normalized[moduleName]).forEach(subName => {
        Object.keys(normalized[moduleName][subName]).forEach(action => {
          normalized[moduleName][subName][action] = true;
        });
      });
    });
    return normalized;
  }

  Object.entries(permissions).forEach(([moduleName, modulePerms]) => {
    if (!modulePerms || typeof modulePerms !== 'object') return;
    if (!normalized[moduleName]) normalized[moduleName] = {};

    Object.entries(modulePerms).forEach(([subName, subPerms]) => {
      if (!subPerms || typeof subPerms !== 'object') return;
      if (!normalized[moduleName][subName]) {
        normalized[moduleName][subName] = PERMISSION_ACTIONS.reduce((acc, action) => {
          acc[action] = false;
          return acc;
        }, {});
      }

      Object.entries(subPerms).forEach(([actionName, value]) => {
        const normalizedAction = normalizeAction(actionName);
        if (normalizedAction && normalized[moduleName][subName].hasOwnProperty(normalizedAction)) {
          normalized[moduleName][subName][normalizedAction] = normalized[moduleName][subName][normalizedAction] || value === true;
        }
      });
    });
  });

  return normalized;
};

export const roleHasPermission = (role, moduleName, action = 'Read', subModuleName = null) => {
  if (!role?.permissions) return false;
  if (role.permissions['*'] === true) return true;

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

export const userHasPermission = (user, moduleName, action = 'Read', subModuleName = null) => {
  if (!user?.roles || user.roles.length === 0) return false;
  return user.roles.some(role => roleHasPermission(role, moduleName, action, subModuleName));
};
