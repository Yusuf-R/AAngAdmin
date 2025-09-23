// src/app/admin/dashboard/page.jsx
import { requireRole } from "@/server/auth/guard";
import AdminDashboard from "@/components/Admin/Dashboard/Dashboard";

export default async function AdminDashboardPage() {
    // Only Admins (Admins can already access all in requireRole, but we still express intent)
    await requireRole(["admin"]);

    // If we get here, the user is allowed
    return <AdminDashboard />;
}
