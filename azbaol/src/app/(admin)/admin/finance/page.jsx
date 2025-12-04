/*
 * File: app/admin/finance/page.jsx
 *
 */

import {requireRole} from "@/server/auth/guard";
import FinanceManagement from "@/components/Admin/Finance/FinanceManagement";
import AdminController from "@/server/controllers/AdminController";

export default async function FinanceManagementSystem() {
    await requireRole(["admin"]);
    const {initialTransactionData, totalStatistics, pagination} = await AdminController.initialFinancialData({
        page: 1,
        limit: 100
    });
    return (
        <>
            <FinanceManagement
                initialTransactionData={initialTransactionData}
                totalStatistics={totalStatistics}
                pagination={pagination}
            />
        </>
    )
}