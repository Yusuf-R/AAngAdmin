import AdminController from "@/server/controllers/AdminController";
import { requireRole } from "@/server/auth/guard";

export async function GET(request) {
    try {
        await requireRole(["admin"]);
        const { searchParams } = new URL(request.url);

        const params = {
            page: parseInt(searchParams.get('page')) || 1,
            limit: parseInt(searchParams.get('limit')) || 10,
            sortBy: searchParams.get('sortBy') || 'finalScore',
            sortOrder: searchParams.get('sortOrder') || 'desc',
            search: searchParams.get('search') || '',
            status: searchParams.get('status') || '',
            priority: searchParams.get('priority') || '',
            orderType: searchParams.get('orderType') || ''
        };

        const result = await AdminController.initialOrderData(params);

        return Response.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Orders API error:', error);
        return Response.json(
            { success: false, error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}