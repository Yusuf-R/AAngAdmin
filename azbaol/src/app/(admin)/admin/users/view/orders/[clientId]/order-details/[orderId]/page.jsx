// app/admin/users/view/orders/[clientId]/order-details/[orderId]/page.js

import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import OrderDetailsUnified from "@/components/Admin/User/OrderDetailsUnified";

export default async function UnifiedOrderDetailsPage({ params, searchParams }) {
    const { clientId, orderId } = await params;
    const { tab } = await searchParams;

    await requireRole(["admin"]);

    // Fetch the specific order data
    const orderData = await AdminController.getOrderById(orderId);

    // Optionally fetch client data if needed
    const clientData = await AdminController.getClientById(clientId);

    return (
        <OrderDetailsUnified
            order={orderData}
            client={clientData}
            clientId={clientId}
            orderId={orderId}
            defaultTab={tab || 'details'}
        />
    );
}