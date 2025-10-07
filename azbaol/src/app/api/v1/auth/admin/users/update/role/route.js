// src/app/api/admin/users/basic-info/route.js
import { NextResponse } from 'next/server';
import AdminController from '@/server/controllers/AdminController';
import AuthController from "@/server/controllers/AuthController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";

export async function PATCH(request) {
    const payload = await request.json();
    console.log({
        payload,
    })
    if (!payload || !payload.userId || !payload.adminRole ) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    try {
        await AuthController.apiGuardWithPermission("admin", "roles", "manage");
        const updatedUser = await AdminController.updateAdminRole(payload);
        return ApiResponseHandler.success(updatedUser);
    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}