// src/app/api/admin/users/route.js
import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";
import { ApiResponseHandler } from "@/server/utils/apiResponseHandler";

export const dynamic = 'force-dynamic';

/**
 * Handles the retrieval of users with pagination, search, and filters.
 *
 * Permissions: Requires the caller to pass 'admin' role with 'user' and 'read' permission.
 *
 * Query Parameters:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - search: Search term for name, email, or phone
 *   - role: Filter by role (admin, client, driver, or 'all')
 *   - status: Filter by status (active, inactive, suspended, pending, or 'all')
 *   - sortBy: Field to sort by (default: createdAt)
 *   - sortOrder: Sort order (asc or desc, default: desc)
 *
 * Responses:
 *   200 OK: Returns paginated user data with statistics
 *   4xx/5xx: Returns an error response if permissions fail or data retrieval encounters an error.
 */
export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;

    const params = {
        page: parseInt(searchParams.get("page")) || 10,
        limit: parseInt(searchParams.get("limit")) || 50,
        search: searchParams.get("search") || "",
        role: searchParams.get("role") || "all",
        status: searchParams.get("status") || "all",
        sortBy: searchParams.get("sortBy") || "createdAt",
        sortOrder: searchParams.get("sortOrder") || "desc"
    };

    try {
        // SINGLE CALL - does both authentication AND authorization
        await AuthController.apiGuardWithPermission("admin", "user", "read");

        // Execute business logic
        const userData = await AdminController.allUser(params);

        console.log({
            dt: 'Users API Response',
            params,
            totalUsers: userData.pagination?.totalUsers,
            currentPage: userData.pagination?.currentPage
        });

        return ApiResponseHandler.success(userData);

    } catch (error) {
        console.error('Users API Error:', error);
        return ApiResponseHandler.handle(error);
    }
}