import { NextResponse } from "next/server";
import ChatController from "@/server/controllers/ChatController";
import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";

export async function DELETE(request) {
    await requireRole(["admin"]);
    try {
        // Get user data (adjust based on how your guard returns user)
        const user = await AuthController.apiGuardWithPermission("admin", "chat", "delete");
        const body = await request.json();
        const { conversationId } = body;

        if (!conversationId) {
            return NextResponse.json(
                { success: false, error: 'conversationId is required' },
                { status: 400 }
            );
        }

        const result = await ChatController.deleteConversation({
            conversationId,
            userId: user.id,
            userRole: user.role.charAt(0).toUpperCase() + user.role.slice(1),
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