// src/server/auth/guards.ts
import { auth } from "@/server/auth/auth";
import { redirect } from "next/navigation";

export const ROLE_PREFIX = {
    admin: "/admin",
    client: "/client",
    driver: "/driver",
};

export async function requireRole(allowed) {
    const session = await auth(); // server-side session
    if (!session?.user) redirect("/auth/login");

    const role = session.user.role;
    if (!role) redirect("/auth/login");

    // Admin can access everything by policy; change if you don't want that
    if (role === "Admin") return { session, role };

    if (!allowed.includes(role)) {
        // send them to their home segment
        const home = ROLE_PREFIX[role] ?? "/";
        redirect(`${home}/dashboard`);
    }
    return { session, role };
}
