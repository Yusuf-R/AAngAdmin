'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignUp from "@/components/Entry/Auth/SignUp";
import { useSystemStore } from "@/store/useSystemStore";

function SignUpPage() {
    const { role } = useSystemStore();
    const router = useRouter();

    useEffect(() => {
        // If no role is selected, redirect back to role selection
        if (!role) {
            router.replace('/auth/role-select');
        }
    }, [role, router]);

    // Show loading or nothing while redirecting
    if (!role) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Redirecting to role selection...</p>
                </div>
            </div>
        );
    }

    return <SignUp />;
}

export default SignUpPage;