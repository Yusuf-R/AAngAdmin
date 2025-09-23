import { NextResponse } from 'next/server';
import dbClient from '@/server/db/mongoDb';
import AuthController from "@/server/controllers/AuthController";

export const dynamic = 'force-dynamic';

export async function POST(request) {
    const obj = await request.json();

    try {
        await dbClient.connect();
        const result = await AuthController.googleLogin(obj);

        // ✅ Handle different error types with appropriate HTTP statuses
        if (result.error) {
            if (result.error === "OAuthAccountNotLinked") {
                // 👉 This is NOT an auth failure — it's a sign-up required signal
                return NextResponse.json(
                    { error: "Sign up required", suggestion: "Please complete registration first" },
                    { status: 403 } // Forbidden — not Unauthorized
                );
            }

            if (result.error.includes("already linked to another user")) {
                return NextResponse.json(
                    { error: result.error, suggestion: result.suggestion },
                    { status: 409 } // Conflict
                );
            }

            if (result.error.includes("Missing required Google profile fields")) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 400 } // Bad Request
                );
            }

            // Generic auth failure
            return NextResponse.json(
                { error: result.error },
                { status: 401 } // Unauthorized
            );
        }

        // ✅ Success
        return NextResponse.json({
            userId: result.userId,
            userRole: result.userRole.toLocaleLowerCase(),
            adminRole: result.adminRole,
        }, { status: 201 });

    } catch (error) {
        console.error("Google login API error:", error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    } finally {
        await dbClient.close();
    }
}