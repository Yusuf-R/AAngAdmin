// Centralized permission configuration
export const PERMISSION_MATRIX = {
    super_admin: {
        create: ["profile", "orders", "payment", "security", "location", "users",  "admin", "client", "driver", "settings", "socket"],
        read: ["profile", "orders", "payment", "security", "orders", "location", "users",  "admin", "client", "driver", "settings", "analytics", "reports", "socket"],
        update: ["profile", "orders", "payment", "security", "orders",  "location", "users", "admin", "client", "driver", "settings", "socket"],
        delete: ["profile", "orders", "payment", "security", "orders",  "location",  "admin", "client","users", "driver", "socket"],
        manage: ["roles", "permissions", "system_settings", "orders", "socket", "session", "status"]
    },

    platform_manager: {
        create: ["orders", "payment",  "location", "users", "socket"],
        read: ["profile", "orders",  "location", "payment", "users", "driver", "analytics", "socket"],
        update: ["orders", "payment",  "location", "users", "socket"],
        delete: ["orders", "payment",  "location", "socket"],
        manage: ["driver_assignments",  "location", "promotions", "orders", "socket", "session", "status"]
    },

    operations_manager: {
        create: ["orders", "socket"],
        read: ["orders", "users", "driver", "analytics", "socket"],
        update: ["orders", "driver", "socket"],
        delete: ["socket"],
        manage: ["order_priority", "socket", "status"]
    },

    customer_support: {
        create: ["socket"],
        read: ["profile", "orders", "users", "socket"],
        update: ["orders", "profile"],
        delete: ["socket"],
        manage: ["socket"]
    },

    finance_manager: {
        create: ["payment", "socket"],
        read: ["payment", "orders", "reports", "socket"],
        update: ["payment"],
        delete: ["socket"],
        manage: ["payouts", "invoices"]
    },

    compliance_officer: {
        create: ["socket"],
        read: ["security", "orders", "payment", "users", "reports", "socket"],
        update: ["security", "socket"],
        delete: ["socket"],
        manage: ["audit_logs", "socket", "status"]
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
