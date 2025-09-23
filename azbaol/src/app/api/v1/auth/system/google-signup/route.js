
import { NextResponse } from 'next/server';
import dbClient from '@/server/db/mongoDb';
import AuthController from "@/server/controllers/AuthController";

export const dynamic = 'force-dynamic'; // Ensure all routes in /client are dynamic

export async function POST(request) {
    const obj = await request.json();
    try {
        await dbClient.connect();
        const result = await AuthController.googleSignup(obj);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        // Return the expected format
        return NextResponse.json({
            userId: result.userId,
            userRole: result.userRole.toLocaleLowerCase(),
            adminRole: result.adminRole,
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({
            error: 'Registration failed',
            message: error.message
        }, { status: 400 });
    } finally {
        await dbClient.close();
    }
}