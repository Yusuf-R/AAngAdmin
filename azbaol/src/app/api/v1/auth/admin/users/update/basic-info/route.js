// src/app/api/admin/users/basic-info/route.js
import { NextResponse } from 'next/server';
import AdminController from '@/server/controllers/AdminController';
import AuthController from "@/server/controllers/AuthController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";

export async function PATCH(request) {
    const { userId, data } = await request.json();
    if (!userId || !data ) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    try {

        await AuthController.apiGuardWithPermission("admin", "users", "update");

        const updatedUser = await AdminController.updateUserBasicInfo(userId, data);

        return NextResponse.json({
            success: true,
            data: updatedUser
        }, {status: 201});
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}