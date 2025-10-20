import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import { requireRole } from "@/server/auth/guard";

/**
 *  setting all the notification for a particular userId as delete all but not permanent
 *
 */
export async function DELETE(request) {
    const payload = await request.json();
    if (!payload || !payload?.category || !payload.userId) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    try {
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "notifications", "delete");
        const data = await AdminController.permanentlyDeleteNotifications(payload);
        return ApiResponseHandler.success(data);
    } catch (error) {
        console.error('Users API Error:', error);
        return ApiResponseHandler.handle(error);
    }
}