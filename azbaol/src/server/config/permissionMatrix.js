// Centralized permission configuration
export const PERMISSION_MATRIX = {
    super_admin: {
        create: ["profile", "orders", "payment", "security", "user", "client", "driver", "settings"],
        read: ["profile", "orders", "payment", "security", "user", "client", "driver", "settings", "analytics", "reports"],
        update: ["profile", "orders", "payment", "security", "user", "client", "driver", "settings"],
        delete: ["profile", "orders", "payment", "security", "client","user", "driver"],
        manage: ["roles", "permissions", "system_settings"]
    },

    platform_manager: {
        create: ["orders", "payment", "user"],
        read: ["profile", "orders", "payment", "user", "driver", "analytics"],
        update: ["orders", "payment", "user"],
        delete: ["orders", "payment"],
        manage: ["driver_assignments", "promotions"]
    },

    operations_manager: {
        create: ["orders"],
        read: ["orders", "user", "driver", "analytics"],
        update: ["orders", "driver"],
        delete: [],
        manage: ["order_priority"]
    },

    customer_support: {
        create: [],
        read: ["profile", "orders", "user"],
        update: ["orders", "profile"],
        delete: [],
        manage: []
    },

    finance_manager: {
        create: ["payment"],
        read: ["payment", "orders", "reports"],
        update: ["payment"],
        delete: [],
        manage: ["payouts", "invoices"]
    },

    compliance_officer: {
        create: [],
        read: ["security", "orders", "payment", "user", "reports"],
        update: ["security"],
        delete: [],
        manage: ["audit_logs"]
    }
};

// Resource categories for UI organization
export const RESOURCE_CATEGORIES = {
    user_management: ["user", "profile"],
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