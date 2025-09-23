"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import AuthContainer from "./AuthContainer";
import InputField from "./InputField";
import PasswordRequirements from "./PasswordRequirements";
import { Button } from "@/components/ui/button";

export default function SetPassword({ email = "admin@aanglogistics.com" }) {
    const [formData, setFormData] = useState({ token: "", newPassword: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const onSubmit = (e) => {
        e.preventDefault();
        // TODO: reset password
        console.log("Reset password:", { email, ...formData });
    };

    return (
        <AuthContainer title="Reset Password" subtitle="Create your new password">
            <form className="space-y-5" onSubmit={onSubmit}>
                <InputField label="Email Address" type="email" value={email} disabled icon={Mail} />
                <InputField label="Reset Token" placeholder="12345" maxLength={5}
                            className="text-center text-2xl font-mono tracking-widest"
                            value={formData.token} onChange={(e) => setFormData((p) => ({ ...p, token: e.target.value.replace(/\D/g, "") }))} />
                <InputField label="New Password" placeholder="Create a new password" icon={Lock} hasToggle
                            showPassword={showPassword} onTogglePassword={() => setShowPassword((v) => !v)}
                            value={formData.newPassword} onChange={(e) => setFormData((p) => ({ ...p, newPassword: e.target.value }))} />
                <InputField label="Confirm Password" placeholder="Confirm your new password" icon={Lock} hasToggle
                            showPassword={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword((v) => !v)}
                            value={formData.confirmPassword} onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))} />

                <PasswordRequirements password={formData.newPassword} />

                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                    Update Password <ArrowRight size={18} className="ml-2" />
                </Button>

                <div className="text-center text-sm text-gray-600">
                    Remember your password?{" "}
                    <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
                </div>
            </form>
        </AuthContainer>
    );
}
