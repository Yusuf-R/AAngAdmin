// app/api/admin/finance/route.js

import AdminController from "@/server/controllers/AdminController";
import { requireRole } from "@/server/auth/guard";

export async function GET(request) {
    try {
        await requireRole(["admin"]);
        const { searchParams } = new URL(request.url);

        const params = {
            page: parseInt(searchParams.get('page')) || 1,
            limit: parseInt(searchParams.get('limit')) || 100,
            sortBy: searchParams.get('sortBy') || 'createdAt',
            sortOrder: searchParams.get('sortOrder') || 'desc',
            search: searchParams.get('search') || '',
            transactionType: searchParams.get('transactionType') || '',
            status: searchParams.get('status') || '',
            startDate: searchParams.get('startDate') || '',
            endDate: searchParams.get('endDate') || ''
        };

        const result = await AdminController.initialFinancialData(params);

        return Response.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Finance API error:', error);
        return Response.json(
            { success: false, error: 'Failed to fetch financial data' },
            { status: 500 }
        );
    }
}