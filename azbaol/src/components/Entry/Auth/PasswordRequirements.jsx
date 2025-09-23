"use client";
import { CheckCircle } from "lucide-react";

export default function PasswordRequirements({ password = "", confirmPassword = "" }) {
    const requirements = [
        { label: "5+ characters", test: password.length >= 5 },
        { label: "1 uppercase", test: /[A-Z]/.test(password) },
        { label: "1 lowercase", test: /[a-z]/.test(password) },
        { label: "1 number", test: /\d/.test(password) },
        { label: "1 special char", test: /[!@#$%^&*(),.?\":{}|<>]/.test(password) },
        {
            label: "Passwords match",
            test: password && confirmPassword && password === confirmPassword
        },
    ];

    return (
        <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                {requirements.map((req) => {
                    // Don't show "Passwords match" if confirmPassword is empty
                    if (req.label === "Passwords match" && !confirmPassword) {
                        return null;
                    }

                    return (
                        <div key={req.label} className="flex items-center space-x-1.5">
                            <CheckCircle
                                size={12}
                                className={req.test ? "text-green-500" : "text-gray-400"}
                            />
                            <span className={req.test ? "text-green-600 font-medium" : ""}>
                                {req.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}