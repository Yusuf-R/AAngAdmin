import {useState} from "react";
import {
    Menu,
    X,
    Home,
    Users,
    Settings,
    BarChart3,
    FileText,
    Box,
    DatabaseZap,
    Bell,
    HandCoins,
    Search,
    User,
    UserRoundPen,
    ChevronDown,
    LogOut,
    ChevronUp
} from "lucide-react";
import Image from "next/image";
import { signOut } from 'next-auth/react';
import {useRouter} from "next/navigation";
import {queryClient} from "@/lib/queryClient";
import {toast} from "sonner";


function SideNav({navState, activeRoute = "/", adminData}) {
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const menuItems = [
        {icon: Home, label: "Dashboard", path: "/"},
        {icon: Users, label: "Users", path: "/users"},
        {icon: Box, label: "Orders", path: "/order"},
        {icon: HandCoins, label: "Payments", path: "/payment"},
        {icon: UserRoundPen, label: "Profile", path: "/profile"},
        {icon: Settings, label: "Settings", path: "/settings"},
        {icon: DatabaseZap, label: "System", path: "/system"},
    ];

    const isIconOnly = navState === "icon";
    const isHidden = navState === "hidden";

    if (isHidden) return null;

    // Company Logo SVG
    function CompanyLogo({logoSrc, size = 40, alt = 'AAng Logistics'}) {
        return (
            <Image
                src={logoSrc}
                alt={alt}
                width={size}
                height={size}
                priority
                className="inline-block"
            />
        );
    }

    const handleSignOut = () => {
        setShowSignOutConfirm(true);
        setShowUserMenu(false);
    };

    const confirmSignOut = async () => {
        try {
            // Use your auth instance's signOut
            await signOut({ redirect: false }); // Don't redirect immediately

            // Clear any client-side state
            if (typeof window !== 'undefined') {
                // Clear TanStack Query cache
                queryClient.clear();

                // Clear localStorage if needed
                localStorage.removeItem('admin-storage');
            }
            toast.success("Signing out")

            // Redirect to login page
            router.push('/auth/login');

        } catch (error) {
            console.error('Sign out error:', error);
            // Fallback: redirect anyway
            router.push('/auth/login');
        } finally {
            setShowSignOutConfirm(false);
        }
    };

    const cancelSignOut = () => {
        setShowSignOutConfirm(false);
    };

    return (
        <>
            <div className="h-full flex flex-col bg-gray-800 text-white relative">
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-700">
                    {isIconOnly ? (
                        <div className="flex justify-center">
                            <CompanyLogo logoSrc="/azbaol.svg" brand="AAngLogistics"/>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <CompanyLogo logoSrc="/azbaol.svg" brand="AAngLogistics"/>
                            <div>
                                <h2 className="text-lg font-bold text-white">AAngLogistics</h2>
                                <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-4">
                    <ul className="space-y-2 px-2">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = activeRoute === item.path;

                            return (
                                <li key={index}>
                                    <button
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                                            isActive
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                        }`}
                                        title={isIconOnly ? item.label : ""}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0"/>
                                        {!isIconOnly && <span className="truncate">{item.label}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Profile Section */}
                <div className="border-t border-gray-700 p-4">
                    {isIconOnly ? (
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="relative"
                            >
                                <div
                                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                     <span className="text-white text-xs font-semibold">
                                         {adminData?.name?.charAt(0) || adminData?.googleCredentials?.name?.charAt(0) || adminData?.fullName?.charAt(0) || "X"}
                                     </span>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                        >
                            <div
                                className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                 <span className="text-white text-sm font-semibold">
                                     {adminData?.name?.charAt(0) || adminData?.googleCredentials?.name?.charAt(0) || adminData?.fullName?.charAt(0) || "A"}
                                </span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-white truncate">
                                    {adminData?.name?.charAt(0) || adminData?.googleCredentials?.name?.charAt(0) || adminData?.fullName?.charAt(0) || "A"}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {adminData?.role || 'X'}
                                </p>
                            </div>
                            {showUserMenu ? (
                                <ChevronUp className="w-4 h-4 text-gray-400"/>
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400"/>
                            )}
                        </button>
                    )}

                    {/* User Menu Dropdown */}
                    {showUserMenu && (
                        <div
                            className={`mt-2 bg-gray-700 rounded-lg shadow-lg ${isIconOnly ? 'absolute bottom-16 left-2 w-auto' : 'w-full'}`}
                        >
                            <button
                                onClick={handleSignOut}
                                className={`flex items-center ${isIconOnly ? 'p-2 justify-center' : 'gap-2 px-3 py-2 w-full text-left'} text-sm text-gray-300 hover:bg-gray-600 hover:text-white rounded-lg transition-colors`}
                                title={isIconOnly ? "Sign Out" : ""}
                            >
                                <LogOut className="w-4 h-4" />
                                {!isIconOnly && "Sign Out"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80 mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Sign Out</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to sign out?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelSignOut}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                No
                            </button>
                            <button
                                onClick={confirmSignOut}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Yes, Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default SideNav;