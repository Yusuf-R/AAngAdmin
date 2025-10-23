import { NextResponse } from "next/server";
import ChatController from "@/server/controllers/ChatController";
import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";

export async function GET(request) {
    await requireRole(["admin"]);
    try {
        // Get user data (adjust based on how your guard returns user)
        const user = await AuthController.apiGuardWithPermission("admin", "chat", "manage");


        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 150;
        const type = searchParams.get('type') || 'all';
        const search = searchParams.get('search') || '';

        const result = await ChatController.getInitialChatData({
            userId: user.id,
            userRole: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            page,
            limit,
            type,
            search
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}