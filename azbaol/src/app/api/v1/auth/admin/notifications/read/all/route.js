import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import { requireRole } from "@/server/auth/guard";

export async function PATCH(request) {
    const payload = await request.json();
    if (!payload || !payload?.id) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    try {
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "notifications", "read");
        const data = await AdminController.markAllAsRead(payload);
        return ApiResponseHandler.success(data);
    } catch (error) {
        console.error('Users API Error:', error);
        return ApiResponseHandler.handle(error);
    }
}