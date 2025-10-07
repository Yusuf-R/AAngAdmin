// /admin/users/orders/[clientId]/route.js
import { requireRole } from "@/server/auth/guard";
import AdminController from "@/server/controllers/AdminController";
import { ApiResponseHandler } from "@/server/utils/apiResponseHandler";

export async function GET(request, { params }) {
    const { clientId } = await params;

    try {
        await requireRole(["admin"]);

        const { searchParams } = new URL(request.url);
        const queryParams = {
            page: parseInt(searchParams.get('page')) || 1,
            limit: parseInt(searchParams.get('limit')) || 100,
            sortBy: searchParams.get('sortBy') || 'finalScore',
            sortOrder: searchParams.get('sortOrder') || 'desc',
            search: searchParams.get('search') || '',
            status: searchParams.get('status') || '',
            priority: searchParams.get('priority') || '',
            orderType: searchParams.get('orderType') || ''
        };
        console.log({
            queryParams,
        })

        const result = await AdminController.clientOrderData(queryParams, clientId);
        return ApiResponseHandler.success(result);

    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}