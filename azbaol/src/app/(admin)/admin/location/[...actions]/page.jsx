// pages/admin/location/[...params]/page.js
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import LocationManager from "@/components/Admin/Location/LocationManager";

export default async function LocationPage({ params, searchParams }) {
    const paramsArray = await params || [];
    await requireRole(["admin"]);

    const mode = paramsArray.actions[0]; // 'new' or 'edit'
    const userId = paramsArray.actions[1]; // user ID
    const locationId = paramsArray.actions[2]; // location ID (for edit mode)

    let userData = null;
    let locationData = null;

    if (userId) {
        userData = await AdminController.getDataById(userId);

        if (mode === 'edit' && locationId && userData?.savedLocations) {
            locationData = userData.savedLocations.find(loc => loc._id.toString() === locationId);
        }
    }

    return (
        <LocationManager
            mode={mode}
            userId={userId}
            userData={userData}
            locationData={locationData}
        />
    );
}