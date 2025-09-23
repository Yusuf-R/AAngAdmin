import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";
import { ApiResponseHandler } from "@/server/utils/apiResponseHandler";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        // SINGLE CALL - does both authentication AND authorization
        const user = await AuthController.apiGuardWithPermission("admin", "profile", "read");

        // Execute business logic
        const adminData = await AdminController.adminProfile(user.id);

        return ApiResponseHandler.success(adminData);

    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}