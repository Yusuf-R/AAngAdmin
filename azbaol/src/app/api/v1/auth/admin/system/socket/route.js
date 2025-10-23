// app/api/v1/auth/admin/socket/route.js
import jwt from "jsonwebtoken";
import { requireRole } from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";

export async function GET(request) {
    try {
        // This should validate the session and ensure admin role
        await requireRole(["admin"]);


        // Get user data (adjust based on how your guard returns user)
        const user = await AuthController.apiGuardWithPermission("admin", "socket", "manage");

        // ✅ Use jsonwebtoken directly
        const token = jwt.sign(
            {
                sub: user.id,
                id: user.id,
                role: user.role,
                adminRole: user?.adminRole || null,
            },
            process.env.SOCKET_SECRET,
            {
                expiresIn: "5m",
                issuer: "AAngLogistics-Web",
            }
        );

        return Response.json({ token });
    } catch (error) {
        console.error("Token generation failed:", error);
        return Response.json({ error: "Failed to generate token" }, { status: 500 });
    }
}