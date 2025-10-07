import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import { requireRole } from "@/server/auth/guard";

export async function POST(request) {
    const payload = await request.json();
    if (!payload || !payload.userId || !payload.strategy ) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    try {
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "session", "manage");
        const data = await AdminController.cleanupUserSessions(payload);
        return ApiResponseHandler.success(data);
    } catch (error) {
        console.error('Users API Error:', error);
        return ApiResponseHandler.handle(error);
    }
}