// Centralized permission configuration
export const PERMISSION_MATRIX = {
    super_admin: {
        create: ["profile", "orders", "payment", "security", "location", "users",  "admin", "client", "driver", "settings", "socket", "notifications"],
        read: ["profile", "orders", "payment", "security", "orders", "location", "users",  "admin", "client", "driver", "settings", "analytics", "reports", "socket", "notifications"],
        update: ["profile", "orders", "payment", "security", "orders",  "location", "users", "admin", "client", "driver", "settings", "socket", "notifications"],
        delete: ["profile", "orders", "payment", "security", "orders",  "location",  "admin", "client","users", "driver", "socket", "notifications"],
        manage: ["roles", "permissions", "system_settings", "orders", "socket", "session", "status", "notifications"]
    },

    platform_manager: {
        create: ["orders", "payment",  "location", "users", "socket", "notifications"],
        read: ["profile", "orders",  "location", "payment", "users", "driver", "analytics", "socket", "notifications"],
        update: ["orders", "payment",  "location", "users", "socket", "notifications"],
        delete: ["orders", "payment",  "location", "socket", "notifications"],
        manage: ["driver_assignments",  "location", "promotions", "orders", "socket", "session", "status", "notifications"]
    },

    operations_manager: {
        create: ["orders", "socket", "notifications"],
        read: ["orders", "users", "driver", "analytics", "socket", "notifications"],
        update: ["orders", "driver", "socket", "notifications"],
        delete: ["socket", "notifications"],
        manage: ["order_priority", "socket", "status", "notifications"]
    },

    customer_support: {
        create: ["socket", "notifications"],
        read: ["profile", "orders", "users", "socket", "notifications"],
        update: ["orders", "profile", "notifications"],
        delete: ["socket", "notifications"],
        manage: ["socket", "notifications"]
    },

    finance_manager: {
        create: ["payment", "socket", "notifications"],
        read: ["payment", "orders", "reports", "socket", "notifications"],
        update: ["payment", "notifications"],
        delete: ["socket", "notifications"],
        manage: ["payouts", "invoices", "notifications"]
    },

    compliance_officer: {
        create: ["socket"],
        read: ["security", "orders", "payment", "users", "reports", "socket", "notifications"],
        update: ["security", "socket", "notifications"],
        delete: ["socket", "notifications"],
        manage: ["audit_logs", "socket", "status", "notifications"]
    }
};

// Resource categories for UI organization
export const RESOURCE_CATEGORIES = {
    user_management: ["users", "profile"],
    operations: ["orders", "driver"],
    financial: ["payment", "payouts", "invoices"],
    security: ["security", "audit_logs"],
    system: ["settings", "system_settings"],
    analytics: ["analytics", "reports"]
};

// Action definitions
export const PERMISSION_ACTIONS = {
    create: "create",
    read: "read",
    update: "update",
    delete: "delete",
    manage: "manage"
};
