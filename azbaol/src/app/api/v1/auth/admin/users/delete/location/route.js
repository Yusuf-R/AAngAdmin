// /api/admin/users/[userId]/locations/all/route.js
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import AuthController from "@/server/controllers/AuthController";

export async function DELETE(request) {
    const payload = await request.json();
    if (!payload || !payload.userId || !payload.locationId ) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    try {
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "location", "delete");
        const result = await AdminController.deleteUserLocation(payload);
        return ApiResponseHandler.success(result);
    } catch (error) {
       return ApiResponseHandler.handle(error)
    }
}