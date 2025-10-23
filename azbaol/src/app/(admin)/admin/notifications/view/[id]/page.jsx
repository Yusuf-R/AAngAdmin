import {requireRole} from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import ViewNotification from "@/components/Admin/Notification/ViewNotification";

export default async function ViewNotificationDetailsPage ({params}) {
    const { id } = await params;
    await requireRole(["admin"]);
    const notificationData = await AdminController.getNotificationData(id);

    if (!notificationData) {
        return (
            <div className="p-6">
                <h1>Notification data data not found</h1>
            </div>
        )
    }
    console.log({
        notificationData
    })
    return (
        <>
            <ViewNotification notificationData={notificationData}/>
        </>
    )
}