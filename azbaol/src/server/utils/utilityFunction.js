import { PERMISSION_MATRIX, PERMISSION_ACTIONS } from '@/server/config/permissionMatrix';

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
};

export const ORDER_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    PAID: 'paid',
    ADMIN_REVIEW:'admin_review',
    ADMIN_APPROVED:'admin_approved',
    ADMIN_REJECTED:'admin_rejected',
    PENDING:'pending',
    BROADCAST:'broadcast',
    ASSIGNED:'assigned',
    CONFIRMED:'confirmed',
    DRIVER_EN_ROUTE_PICKUP:'en_route_pickup',
    DRIVER_ARRIVED_PICKUP:'arrived_pickup',  // Driver at pickup location
    DRIVER_PICKED_UP:'picked_up',
    DRIVER_IN_TRANSIT:'in_transit',
    DRIVER_ARRIVED_DROPOFF:'arrived_dropoff',
    DRIVER_DELIVERED:'delivered',
    DELIVERY_FAILED:'failed',
    DELIVERY_CANCELLED:'cancelled',
    DELIVERY_RETURNED:'returned',
    CANCELLED: 'cancelled',
};

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
