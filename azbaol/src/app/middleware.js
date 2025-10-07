// src/middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PREFIXES = [
    "/api/auth",                 // Auth.js internals
    "/_next",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/images",
    "/public",
];

const PUBLIC_API_V1 = [
    "/api/v1/auth/system/signup",
    "/api/v1/auth/system/forgot-password",
    "/api/v1/auth/system/set-password",
    "/api/v1/auth/db/test",
    "/api/v1/auth/admin",
];

const ROLE_PREFIX = {
    Admin: "/admin",
    Client: "/client",
    Driver: "/driver",
};

export async function middleware(req) {
    const url = new URL(req.url);
    const { pathname } = url;
    const isApi = pathname.startsWith("/api");

    // 1) Allow public assets, Auth.js endpoints, and public v1 routes
    if (
        PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
        PUBLIC_API_V1.some((p) => pathname.startsWith(p))
    ) {
        return NextResponse.next();
    }

    // 2) Get token
    const inProd = process.env.NODE_ENV === "production";
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

    // On Vercel, force-read the secure cookie name you’ve found reliable.
    // In dev, let Auth.js detect the correct cookie.
    const token = await getToken({
        req,
        secret,
        secureCookie: inProd, // ensures __Secure prefix semantics in prod
        ...(inProd
            ? { cookieName: "__Secure-authjs.session-token" }
            : {}), // dev: do not hardcode (Auth.js uses different name)
    });

    // 3) No token → API: 401 JSON, Pages: redirect to login
    if (!token) {
        if (isApi) {
            return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const role = token?.role;

    // 4) Frontend role gating
    if (!isApi) {
        if (role === "Admin") return NextResponse.next(); // admin sees all

        const expected = role ? ROLE_PREFIX[role] : undefined;
        if (expected && pathname.startsWith(expected)) {
            return NextResponse.next();
        }
        // Wrong section → send to their home segment
        if (expected) {
            return NextResponse.redirect(new URL(`${expected}/dashboard`, req.url));
        }
        // No role present → treat as unauthorized
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // 5) API v1 role gates (adjust to your prefixes as needed)
    if (pathname.startsWith("/api/v1/admin")) {
        if (role !== "Admin") {
            return new NextResponse(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }
    } else if (pathname.startsWith("/api/v1/client")) {
        if (role !== "Client" && role !== "Admin") {
            return new NextResponse(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }
    } else if (pathname.startsWith("/api/v1/driver")) {
        if (role !== "Driver" && role !== "Admin") {
            return new NextResponse(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/client/:path*", "/driver/:path*", "/api/v1/:path*"],
};
