// /api/admin/notifications/get/route.js
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";

export async function GET(request) {
    try {
        await requireRole(["admin"]);
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '5');

        // Fetch top unread notifications
        const result = await AdminController.getTopUnreadNotifications({ limit });
        return ApiResponseHandler.success(result);
    } catch (error) {
        return ApiResponseHandler.handle(error)
    }
}