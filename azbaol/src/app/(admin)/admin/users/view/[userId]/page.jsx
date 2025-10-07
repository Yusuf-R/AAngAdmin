import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import ViewUserData from "@/components/Admin/User/ViewUserData";

export default async function ViewUserDataPage({ params }) {
    const { userId } = await params; // No need for await on params
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
            <ViewUserData userData={userData}/>

        </>
    );
}