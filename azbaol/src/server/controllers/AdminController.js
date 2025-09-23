// AdminController -- every matter related to admin execution
import getModels from "@/server/models/AAng/AAngLogistics";
import dbClient from "@/server/db/mongoDb";
import mongoose from "mongoose";

const { Admin } = await getModels()
class AdminController {

    static async adminProfile(adminId) {
        try {
            await dbClient.connect();
            const adminData = await Admin.findById(
                mongoose.Types.ObjectId.createFromHexString(adminId)
            ).select('-password -security.backupCodes'); // Exclude sensitive data

            if (!adminData) {
                throw new Error("Admin not found");
            }

            return adminData;
        } catch (err) {
            console.error('Admin profile fetch error:', err);
            throw new Error('Failed to fetch admin profile');
        } finally {
            await dbClient.close();
        }
    }

}

export default AdminController;