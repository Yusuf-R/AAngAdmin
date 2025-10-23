// Centralized permission configuration
export const PERMISSION_MATRIX = {
    super_admin: {
        create: ["profile", "orders", "chat", "payment", "security", "location", "users",  "admin", "client", "driver", "settings", "socket", "notifications"],
        read: ["profile", "orders",  "chat","payment", "security", "orders", "location", "users",  "admin", "client", "driver", "settings", "analytics", "reports", "socket", "notifications"],
        update: ["profile", "orders", "chat", "payment", "security", "orders",  "location", "users", "admin", "client", "driver", "settings", "socket", "notifications"],
        delete: ["profile", "orders", "chat", "payment", "security", "orders",  "location",  "admin", "client","users", "driver", "socket", "notifications"],
        manage: ["roles", "permissions",  "chat","system_settings", "orders", "socket", "session", "status", "notifications"]
    },

    platform_manager: {
        create: ["orders", "payment",  "chat", "location", "users", "socket", "notifications"],
        read: ["profile", "orders",  "chat", "location", "payment", "users", "driver", "analytics", "socket", "notifications"],
        update: ["orders", "payment", "chat",  "location", "users", "socket", "notifications"],
        delete: ["orders", "payment", "chat",  "location", "socket", "notifications"],
        manage: ["driver_assignments",  "chat", "location", "promotions", "orders", "socket", "session", "status", "notifications"]
    },

    operations_manager: {
        create: ["orders", "socket", "chat", "notifications"],
        read: ["orders", "users",  "chat","driver", "analytics", "socket", "notifications"],
        update: ["orders", "driver", "socket", "chat", "notifications"],
        delete: ["socket", "chat", "notifications"],
        manage: ["order_priority", "chat", "socket", "status", "notifications"]
    },

    customer_support: {
        create: ["socket", "chat", "notifications"],
        read: ["profile", "chat", "orders", "users", "socket", "notifications"],
        update: ["orders", "chat", "profile", "notifications"],
        delete: ["socket", "chat", "notifications"],
        manage: ["socket", "chat", "notifications"]
    },

    finance_manager: {
        create: ["payment", "chat", "socket", "notifications"],
        read: ["payment", "chat", "orders", "reports", "socket", "notifications"],
        update: ["payment", "chat", "notifications"],
        delete: ["socket", "chat", "notifications"],
        manage: ["payouts", "chat", "invoices", "notifications"]
    },

    compliance_officer: {
        create: ["socket", "chat"],
        read: ["security", "chat", "orders", "payment", "users", "reports", "socket", "notifications"],
        update: ["security", "chat", "socket", "notifications"],
        delete: ["socket",  "chat","notifications"],
        manage: ["audit_logs",  "chat","socket", "status", "notifications"]
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
