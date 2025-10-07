/*
 * File: app/admin/orders/page.jsx
 *
 */

import {requireRole} from "@/server/auth/guard";
import OrderManagement from "@/components/Admin/Order/OrderManagement";
import AdminController from "@/server/controllers/AdminController";

export default async function OrderManagementSystem() {
    await requireRole(["admin"]);
    const {initialOrderData, totalStatistics, pagination} = await AdminController.initialOrderData({
        page: 1,
        limit: 100
    });
    return (
        <>
            <OrderManagement
                initialOrderData={initialOrderData}
                totalStatistics={totalStatistics}
                pagination={pagination}
            />
        </>
    )
}