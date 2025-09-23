import { PERMISSION_MATRIX, PERMISSION_ACTIONS } from '@/server/config/permissionMatrix';

// Permission checking utility
export const hasPermission = (adminRole, resource, action) => {
    if (!adminRole || !PERMISSION_MATRIX[adminRole]) {
        return false;
    }

    const rolePermissions = PERMISSION_MATRIX[adminRole];
    return rolePermissions[action]?.includes(resource) || false;
};

// Get all permissions for a role (for UI display)
export const getRolePermissions = (adminRole) => {
    return PERMISSION_MATRIX[adminRole] || {};
};

// Check multiple permissions at once
export const hasPermissions = (adminRole, requiredPermissions) => {
    return requiredPermissions.every(([resource, action]) =>
        hasPermission(adminRole, resource, action)
    );
};

// Get all roles that have a specific permission
export const getRolesWithPermission = (resource, action) => {
    return Object.entries(PERMISSION_MATRIX)
        .filter(([_, permissions]) => permissions[action]?.includes(resource))
        .map(([role]) => role);
};
