// /api/admin/notifications/route.js
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import AuthController from "@/server/controllers/AuthController";

export async function GET(request) {
    const params = await request.json();
    if (!params ) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    try {
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "notifications", "read");
        const result = await AdminController.initialNotificationData(params);
        return ApiResponseHandler.success(result);
    } catch (error) {
        return ApiResponseHandler.handle(error)
    }
}