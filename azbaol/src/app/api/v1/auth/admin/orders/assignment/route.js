import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import AuthController from "@/server/controllers/AuthController";
import {requireRole} from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";


export async function POST(request) {
    try {
        await requireRole('admin');
        await AuthController.apiGuardWithPermission("admin", "orders", "update");
        const payload = await request.json();
        const result = await AdminController.orderAssignment(payload);
        return ApiResponseHandler.success(result);
    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}