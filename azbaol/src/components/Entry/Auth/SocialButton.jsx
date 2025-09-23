"use client";
import { Button } from "@/components/ui/button";

export default function SocialButton({ provider, icon: Icon, onClick }) {
    return (
        <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            onClick={onClick}
        >
            <Icon size={20} className="mr-2" />
            Continue with {provider}
        </Button>
    );
}
