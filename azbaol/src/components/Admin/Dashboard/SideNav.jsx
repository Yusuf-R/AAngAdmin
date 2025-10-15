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
    ChevronUp,
    Loader2
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
    const [loadingRoute, setLoadingRoute] = useState(null);

    const menuItems = [
        {icon: Home, label: "Dashboard", path: "/admin/dashboard"},
        {icon: Users, label: "Users", path: "/admin/users"},
        {icon: Box, label: "Orders", path: "/admin/orders"},
        {icon: HandCoins, label: "Payments", path: "/admin/payment"},
        {icon: UserRoundPen, label: "Profile", path: "/admin/profile"},
        {icon: Bell, label: "Notifications", path: "/admin/notifications"},
        {icon: Settings, label: "Settings", path: "/admin/settings"},
        {icon: DatabaseZap, label: "System", path: "/admin/system"},
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

    // Handle navigation with loading state
    const handleNavigation = async (path) => {
        // If already on the current page, don't navigate
        if (activeRoute === path) {
            toast.info("You're already on this page");
            return;
        }

        try {
            setLoadingRoute(path);

            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 200));

            // Navigate to the new route
            router.push(path);

            // Show success toast
            const menuItem = menuItems.find(item => item.path === path);
            if (menuItem) {
                // toast.success(`Navigating to ${menuItem.label}`);
            }

        } catch (error) {
            console.error('Navigation error:', error);
            toast.error("Failed to navigate");
        } finally {
            // Clear loading state after a short delay to allow route change
            setTimeout(() => {
                setLoadingRoute(null);
            }, 500);
        }
    };

    const handleSignOut = () => {
        setShowSignOutConfirm(true);
        setShowUserMenu(false);
    };

    const confirmSignOut = async () => {
        try {
            await signOut({ redirect: false });

            if (typeof window !== 'undefined') {
                queryClient.clear();
                localStorage.removeItem('admin-storage');
            }
            toast.success("Signing out")
            router.push('/auth/login');

        } catch (error) {
            console.error('Sign out error:', error);
            router.push('/auth/login');
        } finally {
            setShowSignOutConfirm(false);
        }
    };

    const cancelSignOut = () => {
        setShowSignOutConfirm(false);
    };

    // Check if a route is active (handles nested routes too)
    const isRouteActive = (path) => {
        return activeRoute === path || activeRoute.startsWith(path + '/');
    };

    return (
        <>
            <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground relative transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Logo Section */}
                <div className="p-4 border-b border-sidebar-border">
                    {isIconOnly ? (
                        <div className="flex justify-center">
                            <CompanyLogo logoSrc="/azbaol.svg" brand="AAngLogistics"/>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <CompanyLogo logoSrc="/azbaol.svg" brand="AAngLogistics"/>
                            <div>
                                <h2 className="text-lg font-bold text-sidebar-foreground">AAngLogistics</h2>
                                <p className="text-xs text-sidebar-foreground/70 mt-1">Admin Panel</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-4">
                    <ul className="space-y-2 px-2">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = isRouteActive(item.path);
                            const isLoading = loadingRoute === item.path;

                            return (
                                <li key={index}>
                                    <button
                                        onClick={() => handleNavigation(item.path)}
                                        disabled={isLoading}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative group ${
                                            isActive
                                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary/20"
                                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm"
                                        } ${isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
                                        title={isIconOnly ? item.label : ""}
                                    >
                                        {/* Active indicator for icon-only mode */}
                                        {isActive && isIconOnly && (
                                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full"></div>
                                        )}

                                        {/* Icon with loading state */}
                                        <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Icon className="w-5 h-5" />
                                            )}
                                        </div>

                                        {/* Label with loading text */}
                                        {!isIconOnly && (
                                            <span className="truncate flex-1 text-left">
                                                {isLoading ? `Loading ${item.label}...` : item.label}
                                            </span>
                                        )}

                                        {/* Subtle loading indicator for expanded mode */}
                                        {isLoading && !isIconOnly && (
                                            <div className="w-2 h-2 bg-current rounded-full opacity-50 animate-pulse"></div>
                                        )}

                                        {/* Hover tooltip for icon-only mode */}
                                        {isIconOnly && !isLoading && (
                                            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                                {item.label}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover"></div>
                                            </div>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Profile Section */}
                <div className="border-t border-sidebar-border p-4">
                    {isIconOnly ? (
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="relative group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center hover:shadow-md transition-shadow duration-200">
                                    <span className="text-primary-foreground text-xs font-semibold">
                                        {adminData?.name?.charAt(0) || adminData?.googleCredentials?.name?.charAt(0) || adminData?.fullName?.charAt(0) || "X"}
                                    </span>
                                </div>

                                {/* Tooltip for icon-only user menu */}
                                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                    {adminData?.name || adminData?.googleCredentials?.name || adminData?.fullName || "Admin"}
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover"></div>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-all duration-200 hover:shadow-sm"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary-foreground text-sm font-semibold">
                                    {adminData?.name?.charAt(0) || adminData?.googleCredentials?.name?.charAt(0) || adminData?.fullName?.charAt(0) || "A"}
                                </span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {adminData?.name || adminData?.googleCredentials?.name || adminData?.fullName || "Admin"}
                                </p>
                                <p className="text-xs text-sidebar-foreground/70 truncate">
                                    {adminData?.role || 'Administrator'}
                                </p>
                            </div>
                            {showUserMenu ? (
                                <ChevronUp className="w-4 h-4 text-sidebar-foreground/70"/>
                            ) : (
                                <ChevronDown className="w-4 h-4 text-sidebar-foreground/70"/>
                            )}
                        </button>
                    )}

                    {/* User Menu Dropdown */}
                    {showUserMenu && (
                        <div
                            className={`mt-2 bg-sidebar-accent rounded-lg shadow-lg border border-sidebar-border animate-in slide-in-from-bottom-2 duration-200 ${isIconOnly ? 'absolute bottom-16 left-2 w-auto' : 'w-full'}`}
                        >
                            <button
                                onClick={handleSignOut}
                                className={`flex items-center ${isIconOnly ? 'p-2 justify-center' : 'gap-2 px-3 py-2 w-full text-left'} text-sm text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground rounded-lg transition-colors group`}
                                title={isIconOnly ? "Sign Out" : ""}
                            >
                                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                {!isIconOnly && "Sign Out"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-card text-card-foreground rounded-lg p-6 w-80 mx-4 border border-border shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold mb-2">Confirm Sign Out</h3>
                        <p className="text-muted-foreground mb-6">Are you sure you want to sign out? You'll need to log in again to access the admin panel.</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelSignOut}
                                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSignOut}
                                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors shadow-sm"
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