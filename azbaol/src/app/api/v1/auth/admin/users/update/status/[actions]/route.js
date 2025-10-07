// /api/admin/users/[userId]/locations/all/route.js
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import AuthController from "@/server/controllers/AuthController";

export async function PATCH(request, {params} ) {
    const { actions } = await params;
    const payload = await request.json();
    const userActions = ["Active", "Inactive", "Suspended", "Banned", "Deleted", "Pending", "Blocked"];

    if (!payload || !payload.userId || !actions ) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }

    if (!userActions.includes(actions)) {
        return ApiResponseHandler.handle({message: "Unknown Actions", status: 400});
    }

    try {
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "status", "manage");
        const result = await AdminController.userAccountAction(payload, actions);
        return ApiResponseHandler.success(result);
    } catch (error) {
        return ApiResponseHandler.handle(error)
    }
}