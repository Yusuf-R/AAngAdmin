"use client";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthContainer({
                                          children,
                                          title,
                                          subtitle,
                                          background = "gradient",
                                          fullScreen = true,
                                      }) {
    return (
        // <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div
            className={cn(
                fullScreen && "min-h-screen",
                background === "gradient"
                    ? "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
                    : "bg-transparent",
                "flex items-center justify-center p-4"
            )}
        >
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-green-400 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    <p className="text-white mt-8">{subtitle}</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-white rounded-2xl p-6">{children}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} AAngLogistics Admin Portal</p>
                </div>
            </div>
        </div>
    );
}
