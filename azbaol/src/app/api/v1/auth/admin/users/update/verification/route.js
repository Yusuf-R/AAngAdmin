// src/app/api/admin/users/update/validation/route.js
import { NextResponse } from 'next/server';
import AdminController from '@/server/controllers/AdminController';
import AuthController from "@/server/controllers/AuthController";
import {ApiResponseHandler} from "@/server/utils/apiResponseHandler";
import {requireRole} from "@/server/auth/guard";

export async function PATCH(request) {
    await requireRole(["admin"]);
    try {
        const payload = await request.json();
        if (!payload || !payload.id || !payload.action ) {
            return ApiResponseHandler.handle({message: "Missing required fields", status: 400});
        }
        const admin = await AuthController.apiGuardWithPermission("admin", "roles", "manage");
        payload.adminId = admin.id
        const updatedUser = await AdminController.updateDriverValidation(payload);
        return ApiResponseHandler.success(updatedUser);
    } catch (error) {
        return ApiResponseHandler.handle(error);
    }
}