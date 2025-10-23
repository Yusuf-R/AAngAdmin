import { NextResponse } from "next/server";
import ChatController from "@/server/controllers/ChatController";
import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";

export async function GET(request) {
    await requireRole(["admin"]);
    try {
        // Get user data (adjust based on how your guard returns user)
        await AuthController.apiGuardWithPermission("admin", "chat", "manage");


        const { searchParams } = new URL(request.url);
        const query = searchParams.get('params') || '';
        const role = 'all';

        if (!query.trim()) {
            return NextResponse.json(
                { success: false, error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        const result = await ChatController.searchUsers({
            query,
            role,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}