// src/app/admin/dashboard/page.jsx
import { requireRole } from "@/server/auth/guard";
import UserManagement from "@/components/Admin/User/UserManagement";

export default async function UserManagementSystem() {
    // Only Admins (Admins can already access all in requireRole, but we still express intent)
    await requireRole(["admin"]);

    return (
        <>
            <UserManagement />
        </>
    )

}
