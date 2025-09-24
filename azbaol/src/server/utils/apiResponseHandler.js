// server/utils/apiResponseHandler.js
import { NextResponse } from "next/server";

export class ApiResponseHandler {
    static handle(error) {
        console.error("API Error:", error.message);

        if (error.message.includes("Unauthorized")) {
            return NextResponse.json(
                { error: "Unauthorized: Please log in." },
                { status: 401 }
            );
        }

        if (error.message.includes("Forbidden")) {
            return NextResponse.json(
                { error: "Forbidden: You don't have permission to access this resource." },
                { status: 403 }
            );
        }

        if (error.message.includes("Missing required fields")) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (error.message.includes("User already exists")) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 409 }
            );
        }

        // Generic server error
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }

    static success(data, status = 200) {
        return NextResponse.json(data, { status });
    }
}