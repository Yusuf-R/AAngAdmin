import { requireRole } from "@/server/auth/guard";
import AdminController from '@/server/controllers/AdminController';
import AuthController from "@/server/controllers/AuthController";
import { ApiResponseHandler } from "@/server/utils/apiResponseHandler";

export async function PATCH(request) {
    const payload = await request.json();

    if (!payload?._id || !payload?.reversalReason) {
        return ApiResponseHandler.handle({
            message: "Missing required fields: _id and reversalReason",
            status: 400
        });
    }

    try {
        await requireRole('admin');
        await AuthController.apiGuardWithPermission("admin", "orders", "update");

        const result = await AdminController.reverseAdminDecision(payload);
        return ApiResponseHandler.success(result);
    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}