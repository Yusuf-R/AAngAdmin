// src/app/api/admin/users/basic-info/route.js
import { NextResponse } from 'next/server';
import AdminController from '@/server/controllers/AdminController';
import AuthController from "@/server/controllers/AuthController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";

export async function POST(request) {
    const payload = await request.json();
    if (!payload || !payload.userId || !payload.locationData ) {
        return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
    }
    try {
        await AuthController.apiGuardWithPermission("admin", "location", "create");
        const updatedUser = await AdminController.createLocation(payload);
        return ApiResponseHandler.success(updatedUser);
    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}