import { NextResponse } from "next/server";
import ChatController from "@/server/controllers/ChatController";
import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";

export async function POST(request) {
    await requireRole(["admin"]);
    try {
        // Get user data (adjust based on how your guard returns user)
        const user = await AuthController.apiGuardWithPermission("admin", "chat", "manage");
        const body = await request.json();
        const { targetUserId, targetRole, orderId } = body;

        if (!targetUserId || !targetRole) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await ChatController.createConversation({
            initiatorId: user.id,
            initiatorRole: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            targetUserId,
            targetRole,
            orderId
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