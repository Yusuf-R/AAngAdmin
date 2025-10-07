import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import EditUserData from "@/components/Admin/User/EditUserData";

export default async function EditUserDataPage({ params }) {
    const { userId } = await params;
    await requireRole(["admin"]);
    const userData = await AdminController.getDataById(userId);

    if (!userData) {
        return (
            <div className="p-6">
                <h1>User not found</h1>
            </div>
        );
    }

    // Pass the server-fetched data to the client component
    return (
        <>
            <EditUserData userData={userData}/>

        </>
    );
}