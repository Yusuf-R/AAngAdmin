'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Threads from "@/components/ReactBits/Threads";
import { Users, Truck, Shield, ArrowRight, Check, Sparkles } from "lucide-react";
import { useSystemStore } from "@/store/useSystemStore";

const roles = [
    {
        id: "client",
        title: "Client",
        description: "Book and manage your logistics needs",
        icon: Users,
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200 hover:border-blue-400",
        features: ["Track shipments", "Manage bookings", "Real-time updates"]
    },
    {
        id: "driver",
        title: "Driver",
        description: "Deliver packages and earn rewards",
        icon: Truck,
        color: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200 hover:border-green-400",
        features: ["Accept deliveries", "Navigation support", "Earnings tracker"]
    },
    {
        id: "admin",
        title: "Admin",
        description: "Manage operations and oversee platform",
        icon: Shield,
        color: "from-purple-500 to-violet-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
        borderColor: "border-purple-200 hover:border-purple-400",
        features: ["User management", "Analytics dashboard", "System controls"]
    }
];

function RoleSelection() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const { setRole } = useSystemStore();
    const router = useRouter();

    const handleRoleSelect = (roleId) => {
        setSelectedRole(roleId);
    };

    const handleConfirm = async () => {
        if (!selectedRole) return;

        setIsConfirming(true);

        // Simulate a brief loading state for better UX
        setTimeout(() => {
            setRole(selectedRole);
            router.push('/auth/signup');
        }, 800);
    };

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
                    <Threads />
                </div>

                {/* Background with animated elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Animated background orbs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>

                    {/* Floating particles */}
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white/20 rounded-full animate-ping"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${2 + Math.random() * 3}s`
                            }}
                        ></div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">
                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-2xl">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-4 leading-tight">
                            Choose Your Role
                        </h1>

                        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Select your role to unlock a personalized experience tailored just for you
                        </p>
                    </div>

                    {/* Role Cards */}
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {roles.map((role) => {
                            const Icon = role.icon;
                            const isSelected = selectedRole === role.id;

                            return (
                                <div
                                    key={role.id}
                                    className={`relative group cursor-pointer transition-all duration-500 ${
                                        isSelected ? 'scale-105' : 'hover:scale-102'
                                    }`}
                                    onClick={() => handleRoleSelect(role.id)}
                                >
                                    {/* Animated border */}
                                    <div className={`absolute -inset-1 rounded-2xl transition-all duration-500 ${
                                        isSelected
                                            ? `bg-gradient-to-r ${role.color} opacity-100 blur-sm`
                                            : 'bg-gradient-to-r from-gray-600 to-gray-400 opacity-0 group-hover:opacity-50 blur-sm'
                                    }`}></div>

                                    {/* Card content */}
                                    <div className={`relative rounded-2xl p-8 transition-all duration-500 ${
                                        isSelected
                                            ? 'bg-white shadow-2xl'
                                            : 'bg-white/95 backdrop-blur-sm shadow-xl hover:shadow-2xl'
                                    }`}>
                                        {/* Selection indicator */}
                                        {isSelected && (
                                            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                                <Check className="w-5 h-5 text-white" />
                                            </div>
                                        )}

                                        {/* Icon */}
                                        <div className={`w-16 h-16 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-r ${role.color} shadow-lg`}>
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                            {role.title}
                                        </h3>

                                        <p className="text-gray-600 mb-6 leading-relaxed">
                                            {role.description}
                                        </p>

                                        {/* Features */}
                                        <ul className="space-y-2">
                                            {role.features.map((feature, index) => (
                                                <li key={index} className="flex items-center text-sm text-gray-700">
                                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${role.color} mr-3`}></div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Confirm Button */}
                    <div className="text-center">
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedRole || isConfirming}
                            className={`inline-flex items-center px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                                selectedRole
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105'
                                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            } ${isConfirming ? 'animate-pulse' : ''}`}
                        >
                            {isConfirming ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                    Setting up your experience...
                                </>
                            ) : (
                                <>
                                    Continue to Sign Up
                                    <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>

                        {selectedRole && !isConfirming && (
                            <p className="mt-4 text-gray-400 animate-fade-in">
                                You selected: <span className="text-white font-medium">
                                    {roles.find(r => r.id === selectedRole)?.title}
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    @keyframes fade-in {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .animate-fade-in {
                        animation: fade-in 0.5s ease-out;
                    }
                    
                    .hover\\:scale-102:hover {
                        transform: scale(1.02);
                    }
                    
                    .shadow-3xl {
                        box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
                    }
                `}</style>
            </div>
        </>
    );
}

export default RoleSelection;