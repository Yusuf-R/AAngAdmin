import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";
import { ApiResponseHandler } from "@/server/utils/apiResponseHandler";

export const dynamic = 'force-dynamic';


/**
 * Handles the creation of a new user instance (admin context).
 *
 * Expects a POST request with a JSON body containing user data fields required by AdminController.createUser.
 *
 * Permissions: Requires the caller to pass 'admin' role with 'profile' and 'create' permission.
 *
 * Request body example:
 *   {
 *     "username": "string",
 *     "email": "string",
 *     ...other fields required by AdminController.createUser
 *   }
 *
 * Responses:
 *   200 OK: Returns the created user data wrapped in a standardized API response.
 *   4xx/5xx: Returns an error response if permissions fail or user creation encounters an error.
 */
export async function POST(request) {
    const body = await request.json();
    try {
        await AuthController.apiGuardWithPermission("admin", "users", "create");
        const adminData = await AdminController.createUser(body);
        return ApiResponseHandler.success(adminData);
    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}