// src/app/admin/dashboard/page.jsx
import { requireRole } from "@/server/auth/guard";
import System from "@/components/Admin/System/System";

export default async function SystemManagement() {
    // Only Admins (Admins can already access all in requireRole, but we still express intent)
    await requireRole(["admin"]);

    // If we get here, the user is allowed
    return <System />;
}
