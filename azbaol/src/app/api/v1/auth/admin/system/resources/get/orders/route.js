// =======================================
// API ROUTE - FETCH ORDERS FOR DELETION
// app/api/admin/orders/deletion-list/route.js
// =======================================
import { NextResponse } from 'next/server';
import AdminController from '@/server/controllers/AdminController';
import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";

export async function GET(request) {
    try {
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "orders", "read");
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');
        const search = searchParams.get('search') || '';

        // Fetch data from controller
        const result = await AdminController.getOrdersForDeletion({
            page,
            limit,
            search
        });

        return NextResponse.json(result);

    } catch (error) {
        console.log('Orders deletion list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders for deletion' },
            { status: 500 }
        );
    }
}