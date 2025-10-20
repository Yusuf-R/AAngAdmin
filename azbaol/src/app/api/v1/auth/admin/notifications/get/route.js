// /api/admin/notifications/get/route.js
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";

export async function GET(request) {
    try {
        await requireRole(["admin"]);
        const { searchParams } = new URL(request.url);
        const filters = {
            search: searchParams.get('search') || '',
            category: searchParams.get('category') || '',
            priority: searchParams.get('priority') || '',
            status: searchParams.get('status') || '',
            page: parseInt(searchParams.get('page')) || 1,
            limit: parseInt(searchParams.get('limit')) || 100,
            sortBy: searchParams.get('sortBy') || 'createdAt',
            sortOrder: searchParams.get('sortOrder') || 'desc',
            showDeleted: searchParams.get('showDeleted') || 'false'
        };
        const result = await AdminController.getNotifications(filters);
        return ApiResponseHandler.success(result);
    } catch (error) {
        return ApiResponseHandler.handle(error)
    }
}