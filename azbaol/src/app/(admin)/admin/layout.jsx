'use client';
import {useState, useEffect} from "react";
import TopNav from "@/components/Admin/Dashboard/TopNav";
import SideNav from "@/components/Admin/Dashboard/SideNav";
import LazyLoading from "@/components/Admin/Dashboard/LazyLoading";
import {queryClient} from "@/lib/queryClient";
import {NotificationProvider} from '@/contexts/NotificationContext';
import {useQuery} from "@tanstack/react-query"
import AdminUtils from "@/utils/AdminUtils";
import {useRouter} from "next/navigation";

function AdminLayout({children}) {
    const router = useRouter();
    const [navState, setNavState] = useState("full");
    const [shouldRedirect, setShouldRedirect] = useState(false);

    const {data: cachedData} = queryClient.getQueryData(["AdminData"]) || {};

    const {data, isLoading, isError} = useQuery({
        queryKey: ["AdminData"],
        queryFn: AdminUtils.adminData,
        staleTime: Infinity,
        enabled: !cachedData,
    });

    const adminData = cachedData || data;

    useEffect(() => {
        if (isError || (!isLoading && !adminData)) {
            setShouldRedirect(true);
        }
    }, [isError, isLoading, adminData]);

    useEffect(() => {
        if (shouldRedirect) {
            router.push("/auth/login");
        }
    }, [shouldRedirect, router]);

    const handleToggleNavState = () => {
        setNavState((prevState) => {
            if (prevState === "full") return "icon";
            if (prevState === "icon") return "hidden";
            return "full";
        });
    };

    const sideNavWidth = navState === "full" ? "w-56" : navState === "icon" ? "w-20" : "w-0";

    if (isLoading) {
        return <LazyLoading/>;
    }
    if (shouldRedirect) {
        return <LazyLoading/>;
    }

    return (
        <>
            <NotificationProvider>
                <div className="flex h-screen">
                    {/* Side Navigation - Full screen height, no scroll */}
                    <div
                        className={`${sideNavWidth} transition-all duration-300 ease-in-out h-screen flex-shrink-0 bg-sidebar border-r border-border`}>
                        <SideNav
                            navState={navState}
                            activeRoute="/"
                            adminData={adminData}
                        />
                    </div>

                    {/* Main Area - Takes remaining space */}
                    <div className="flex-1 flex flex-col h-screen">
                        {/* TopNav - Fixed at top, never scrolls */}
                        <div className="flex-shrink-0 bg-background border-b border-border">
                            <TopNav
                                onToggleSideNav={handleToggleNavState}
                                adminData={adminData}
                            />
                        </div>

                        {/* Main Content - Scrollable area with same background as root */}
                        <div
                            className="flex-1 overflow-y-auto bg-background text-foreground bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                            {children || (
                                <div className="p-6">
                                    <div
                                        className="rounded-lg shadow-sm p-6 bg-card text-card-foreground border border-border max-w-4xl mx-auto">
                                        <h1 className="text-2xl font-bold mb-4">
                                            Welcome to Admin Dashboard
                                        </h1>
                                        <p className="text-muted-foreground">
                                            This is your main content area.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </NotificationProvider>
        </>
    );
}

export default AdminLayout;