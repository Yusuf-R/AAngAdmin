// src/app/admin/dashboard/page.jsx
import { requireRole } from "@/server/auth/guard";
import UserManagement from "@/components/Admin/User/UserManagement";
import AdminController from "@/server/controllers/AdminController";

export default async function UserManagementSystem() {
    // Only Admins (Admins can already access all in requireRole, but we still express intent)
    await requireRole(["admin"]);
    const allUsersData = await AdminController.allUser({ page: 1, limit: 100 });
    return (
        <>
            <UserManagement allUsersData={allUsersData} />
        </>
    )

}
