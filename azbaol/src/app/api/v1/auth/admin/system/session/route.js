import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import { requireRole } from "@/server/auth/guard";

export async function GET(request) {
    try {
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "session", "manage");
        const data = await AdminController.getAllUserSession();
        return ApiResponseHandler.success(data);
    } catch (error) {
        console.error('Users API Error:', error);
        return ApiResponseHandler.handle(error);
    }
}