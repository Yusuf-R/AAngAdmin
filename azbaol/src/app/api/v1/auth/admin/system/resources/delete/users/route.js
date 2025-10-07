import { NextResponse } from 'next/server';
import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";
import AdminController from "@/server/controllers/AdminController";

export async function DELETE(request) {
    try {
        // Check authentication
        await requireRole(["admin"]);
        await AuthController.apiGuardWithPermission("admin", "users", "delete");

        // Parse request body
        const  userIds  = await request.json();

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid user IDs - must be non-empty array' },
                { status: 400 }
            );
        }

        // Prevent deleting more than 100 users at once (safety measure)
        if (userIds.length > 100) {
            return NextResponse.json(
                { error: 'Cannot delete more than 100 users at once' },
                { status: 400 }
            );
        }
        await AdminController.systemDeleteUser(userIds)

        return NextResponse.json({
            success: true,
        });

    } catch (error) {
        console.error('User deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete users', details: error.message },
            { status: 500 }
        );
    }
}