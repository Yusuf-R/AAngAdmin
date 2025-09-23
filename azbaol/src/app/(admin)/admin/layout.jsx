'use client';
import { useState, useEffect } from "react";
import TopNav from "@/components/Admin/Dashboard/TopNav";
import SideNav from "@/components/Admin/Dashboard/SideNav";
import LazyLoading from "@/components/Admin/Dashboard/LazyLoading";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query"
import AdminUtils from "@/utils/AdminUtils";
import { useRouter } from "next/navigation";

function AdminLayout({ children }) {
    const router = useRouter();
    const [navState, setNavState] = useState("full");
    const [shouldRedirect, setShouldRedirect] = useState(false);

    // REMOVED: All darkMode state and effects

    const { data: cachedData } = queryClient.getQueryData(["AdminData"]) || {};

    const { data, isLoading, isError } = useQuery({
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
        return <LazyLoading />;
    }
    if (shouldRedirect) {
        return <LazyLoading />;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            {/* Side Navigation - Use CSS variables */}
            <div
                className="transition-all duration-300 ease-in-out overflow-hidden relative bg-sidebar"
                style={{ width: sideNavWidth }}
            >
                <SideNav
                    navState={navState}
                    activeRoute="/"
                    adminData={adminData}
                />
            </div>

            {/* Main Wrapper */}
            <div className="flex flex-col flex-1 overflow-auto">
                <div className="flex-shrink-0">
                    <TopNav
                        onToggleSideNav={handleToggleNavState}
                        adminData={adminData}
                    />
                </div>

                {/* Main Content Area - Use CSS variables */}
                <div className="flex-1 p-0 bg-background">
                    {children || (
                        <div className="p-6">
                            <div className="rounded-lg shadow-sm p-6 bg-card text-card-foreground border border-border">
                                <h1 className="text-2xl font-bold mb-4">
                                    Welcome to Admin Dashboard
                                </h1>
                                <p className="text-muted-foreground">
                                    This is your main content area.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="p-6 rounded-lg text-card-foreground bg-gradient-to-r from-primary to-primary/80">
                                            <h3 className="text-lg font-semibold">Card {i}</h3>
                                            <p className="mt-2 text-primary-foreground/80">Sample content</p>
                                            <div className="text-2xl font-bold mt-4">{i * 25}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;