import ViewOrderDetails from "@/components/Admin/Order/ViewOrderDetails";
import {requireRole} from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";

export default async function ViewOrderDetailsPage ({params}) {
    const { orderId } = await params;
    await requireRole(["admin"]);
    const orderData = await AdminController.getOrderDataById(orderId);

    if (!orderData) {
        return (
            <div className="p-6">
                <h1>Order data not found</h1>
            </div>
        )
    }
    return (
        <>
            <ViewOrderDetails orderData={orderData}/>
        </>
    )
}