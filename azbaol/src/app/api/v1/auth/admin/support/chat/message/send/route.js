// app/api/chat/send-message/route.js
import { NextResponse } from "next/server";
import ChatController from "@/server/controllers/ChatController";
import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";
import { MessageDelivery } from "@/server/controllers/MessageDelivery";

export async function POST(request) {
    await requireRole(["admin"]);
    try {
        // Get user data
        const user = await AuthController.apiGuardWithPermission("admin", "chat", "manage");
        const body = await request.json();
        const { conversationId, messageData } = body;

        if (!conversationId || !messageData) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. ✅ FIRST: Save to database
        const result = await ChatController.sendMessage({
            conversationId,
            userId: user.id,
            userRole: user.role,
            messageData
        });

        // 2. ❌ If DB save fails, STOP IMMEDIATELY - no delivery!
        if (!result.success) {
            return NextResponse.json(result);
        }

        // 3. ✅ ONLY if DB save succeeds: Attempt real-time delivery
        const savedMessage = result.data;
        const deliveryResult = await MessageDelivery.deliverMessage(conversationId, savedMessage);

        return NextResponse.json({
            ...result,
            realtimeDelivery: deliveryResult.success ? deliveryResult.method : 'failed',
            deliveryDetails: deliveryResult
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}