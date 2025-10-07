// /admin/users/view/orders/[clientId]/page.js
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import ClientOrders from "@/components/Admin/User/ClientOrders";

export default async function ViewUserOrderDataPage({ params }) {
    const { clientId } = await params;
    await requireRole(["admin"]);

    const result = await AdminController.clientOrderData({
        page: 1,
        limit: 100
    }, clientId);

    return (
        <ClientOrders
            clientId={clientId}
            initialClientOrderData={result.initialClientOrderData}
            clientData={result.clientData}
        />
    );
}