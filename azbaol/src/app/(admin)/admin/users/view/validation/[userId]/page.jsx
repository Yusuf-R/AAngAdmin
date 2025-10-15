import { requireRole } from "@/server/auth/guard";
import DriverValidationReview from "@/components/Admin/User/DriverValidationReview"
import AdminController from "@/server/controllers/AdminController";

export default async function ViewValidationPage({ params }) {
    const { userId } = await params; // No need for await on params
    await requireRole(["admin"]);
    // get all the data for the userId
    const userData = await AdminController.getDataById(userId);
    return (
        <>
            <DriverValidationReview driver={userData} />
        </>
    );
}