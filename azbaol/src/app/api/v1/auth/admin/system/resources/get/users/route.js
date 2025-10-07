import { NextResponse } from 'next/server';
import AdminController from '@/server/controllers/AdminController';
import AuthController from "@/server/controllers/AuthController";
import {requireRole} from "@/server/auth/guard";

export async function GET(request) {
    try {
        // Check authentication
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "users", "read");

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');
        const search = searchParams.get('search') || '';

        // Fetch data from controller
        const result = await AdminController.getUsersForDeletion({
            page,
            limit,
            search
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Users deletion list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users for deletion' },
            { status: 500 }
        );
    }
}