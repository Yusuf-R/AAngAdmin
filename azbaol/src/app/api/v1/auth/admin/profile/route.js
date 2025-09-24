import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";
import { ApiResponseHandler } from "@/server/utils/apiResponseHandler";

export const dynamic = 'force-dynamic';


/**
 * Handles the retrieval of an admin's profile.
 *
 * Permissions: Requires the caller to pass 'admin' role with 'profile' and 'read' permission.
 *
 * Responses:
 *   200 OK: Returns the admin's profile data wrapped in a standardized API response.
 *   4xx/5xx: Returns an error response if permissions fail or profile retrieval encounters an error.
 */
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