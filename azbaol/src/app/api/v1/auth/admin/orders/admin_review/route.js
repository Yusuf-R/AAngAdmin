// src/app/api/admin/users/basic-info/route.js
import { requireRole } from "@/server/auth/guard";
import AdminController from '@/server/controllers/AdminController';
import AuthController from "@/server/controllers/AuthController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";

export async function PATCH(request) {
    const payload = await request.json();
    if (!payload || !payload._id || !payload.status ) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    if (payload.status !== 'approved' && payload.status !== 'rejected') {
        return ApiResponseHandler.handle({message: "Invalid status value", status: 400});
    }
    try {
        await requireRole('admin');
        await AuthController.apiGuardWithPermission("admin", "orders", "update");
        const updateOrder = await AdminController.adminReviewUpdate(payload);
        return ApiResponseHandler.success(updateOrder);
    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}