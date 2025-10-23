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
        const { targetUserId, orderId } = body;

        if (!targetUserId) {
            return NextResponse.json(
                { success: false, error: 'targetUserId is required' },
                { status: 400 }
            );
        }

        if (targetUserId === user.id){
            return NextResponse.json(
                { success: false, error: 'Cyclic Error: User' },
                { status: 400 }
            );
        }

        const result = await ChatController.getOrCreateConversation({
            adminId: user.id,
            targetUserId,
            orderId: orderId || null
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