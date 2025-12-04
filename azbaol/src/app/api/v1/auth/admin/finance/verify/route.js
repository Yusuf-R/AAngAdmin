// app/api/v1/auth/admin/finance/verify/route.js

import { requireRole } from "@/server/auth/guard";
import AdminFinancialService from "@/server/services/AdminFinancialService";

export async function POST(request) {
    try {
        await requireRole(["admin"]);

        const body = await request.json();
        const { transactionId, reference } = body;

        if (!transactionId || !reference) {
            return Response.json(
                {
                    success: false,
                    error: 'Transaction ID and reference are required'
                },
                { status: 400 }
            );
        }

        const result = await AdminFinancialService.verifyTransaction(
            transactionId,
            reference
        );

        if (!result.success) {
            return Response.json(result, { status: 400 });
        }

        return Response.json(result);

    } catch (error) {
        console.error('Verify transaction API error:', error);
        return Response.json(
            {
                success: false,
                error: 'Failed to verify transaction',
                message: error.message
            },
            { status: 500 }
        );
    }
}