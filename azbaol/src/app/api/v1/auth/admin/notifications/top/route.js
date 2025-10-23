// /api/admin/notifications/top/route.js
// fetches only the top most notification base on the admin-required actions as priority
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";

export async function GET(request) {
    try {
        await requireRole(["admin"]);
        const limit = 10;
        const adminActionOnly = true

        // Fetch top unread notifications
        const result = await AdminController.getTopUnreadNotifications({ limit, adminActionOnly });
        return ApiResponseHandler.success(result);
    } catch (error) {
        return ApiResponseHandler.handle(error)
    }
}