'use client'
import AuthContainer from "./AuthContainer";
import InputField from "./InputField";
import SocialButton from "./SocialButton";
import GoogleIcon from "./GoogleIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import DarkVeil from "@/components/ReactBits/DarkVeil";
import { Mail, Lock, ArrowRight } from "lucide-react";
import {useState} from "react";
import Link from "next/link";

function ForgotPassword () {
    const [email, setEmail] = useState("");

    const onSubmit = (e) => {
        e.preventDefault();
        // TODO: request reset link
        console.log("Forgot password for:", email);
    };
    return (
        <>
            <AuthContainer title="Forgot Password" subtitle="We'll send you a reset token">
                <form className="space-y-6" onSubmit={onSubmit}>
                    <InputField label="Email Address" type="email" placeholder="admin@aanglogistics.com"
                                icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} />

                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                        Send Reset Token <ArrowRight size={18} className="ml-2" />
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                        Remember your password?{" "}
                        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
                    </div>
                </form>
            </AuthContainer>
        </>
    )
}

export default ForgotPassword;