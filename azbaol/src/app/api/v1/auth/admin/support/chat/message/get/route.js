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
        const conversationId = searchParams.get('id') || '';

        if (!conversationId) {
            return NextResponse.json(
                { success: false, error: 'conversationId is required' },
                { status: 400 }
            );
        }

        const result = await ChatController.getConversationMessages({
            conversationId,
            userId: user.id,
            page: 1,
            limit: 50
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