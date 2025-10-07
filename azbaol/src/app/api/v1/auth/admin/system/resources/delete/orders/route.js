// =======================================
// API ROUTE - DELETE ORDERS
// app/api/admin/orders/delete/route.js
// =======================================

import { NextResponse } from 'next/server';
import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";

export async function DELETE(request) {
    try {
        // Check authentication
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "orders", "delete");

        // Parse request body
        const orderIds = await request.json();

        // Validate input
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid order IDs - must be non-empty array' },
                { status: 400 }
            );
        }

        // Prevent deleting more than 100 orders at once (safety measure)
        if (orderIds.length > 100) {
            return NextResponse.json(
                { error: 'Cannot delete more than 100 orders at once' },
                { status: 400 }
            );
        }

        await AdminController.systemDeleteOrder(orderIds)

        return NextResponse.json({
            success: true,
        });

    } catch (error) {
        console.error('Order deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete orders', details: error.message },
            { status: 500 }
        );
    }
}
