// src/app/(admin)/admin/finance/view/[txId]/page.jsx

import {requireRole} from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import TransactionDetail from "@/components/Admin/Finance/TransactionDetail";


export default async function TransactionDetailPage({ params }) {
    await requireRole(["admin"]);
    const { txId } = await params;
    if (!txId) {
        return (
            <div className="p-24">
                <h1>Transaction data not found</h1>
            </div>
        )
    }

    const transactionData = await AdminController.getFinancialDataById(txId);



    return (
        <div className="p-6">
            <TransactionDetail transactionData={transactionData} />
        </div>
    );
}