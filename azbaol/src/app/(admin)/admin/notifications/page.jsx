/*
 * File: app/admin/notifications/page.jsx
 * Admin Notification Management Page
 */
import { requireRole } from "@/server/auth/guard";
import NotificationManagement from "@/components/Admin/Notification/NotificationManagement";
import AdminController from "@/server/controllers/AdminController";

export default async function NotificationManagementPage() {
    await requireRole(["admin"]);

    const { initialNotificationData, totalStatistics, pagination } = await AdminController.initialNotificationData({
        page: 1,
        limit: 100,
        showDeleted: 'false'
    });
    return (
        <NotificationManagement
            initialNotificationData={initialNotificationData}
            totalStatistics={totalStatistics}
            pagination={pagination}
        />
    );
}