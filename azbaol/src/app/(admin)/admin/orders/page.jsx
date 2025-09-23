
/* =============================================
 * File: app/admin/orders/page.jsx
 * =========================================== */

import { requireRole } from "@/server/auth/guard";
import OrderManagement from "@/components/Admin/Order/OrderManagement";

export default async function OrderManagementSystem() {
    await requireRole(["admin"]);
    return <OrderManagement />; // no darkMode prop – theme auto by next-themes
}