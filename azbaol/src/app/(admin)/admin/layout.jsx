'use client';
import { useState, useEffect, useCallback } from "react";
import TopNav from "@/components/Admin/Dashboard/TopNav";
import SideNav from "@/components/Admin/Dashboard/SideNav";
import LazyLoading from "@/components/Admin/Dashboard/LazyLoading";
import {queryClient} from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query"
import AdminUtils from "@/utils/AdminUtils";
import {useRouter} from "next/navigation";

function AdminLayout({ children }) {
    const router = useRouter();
    const [navState, setNavState] = useState("full");
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Initialize dark mode from localStorage or system preference
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('adminDarkMode');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedDarkMode !== null) {
            setDarkMode(JSON.parse(savedDarkMode));
        } else {
            setDarkMode(systemPrefersDark);
        }
    }, []);

    // Apply dark mode class to document root
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

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
        <>
            <div className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 ${
                darkMode ? "dark bg-gray-900" : "bg-gray-100"
            }`}>
                {/* Side Navigation */}
                <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden relative ${
                        darkMode ? "bg-gray-800" : "bg-gray-800"
                    }`}
                    style={{width: sideNavWidth}}
                >
                    <SideNav navState={navState} activeRoute="/" adminData={adminData} darkMode={darkMode}/>
                </div>

                {/* Main Wrapper */}
                <div className="flex flex-col flex-1 overflow-auto">
                    {/* Top Navigation */}
                    <div className="flex-shrink-0">
                        <TopNav
                            onToggleSideNav={handleToggleNavState}
                            adminData={adminData}
                            darkMode={darkMode}
                            setDarkMode={setDarkMode}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className={`flex-1 p-0 transition-colors duration-300 ${
                        darkMode ? "bg-gray-900" : "bg-gray-100"
                    }`}>
                        {children || (
                            <div className="p-6">
                                <div className={`rounded-lg shadow-sm p-6 transition-colors duration-300 ${
                                    darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
                                }`}>
                                    <h1 className={`text-2xl font-bold mb-4 ${
                                        darkMode ? "text-white" : "text-gray-900"
                                    }`}>
                                        Welcome to Admin Dashboard
                                    </h1>
                                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                                        This is your main content area. The layout is ready for your components!
                                    </p>

                                    {/* Demo Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i}
                                                 className={`p-6 rounded-lg text-white ${
                                                     darkMode
                                                         ? "bg-gradient-to-r from-gray-700 to-gray-600"
                                                         : "bg-gradient-to-r from-blue-500 to-purple-600"
                                                 }`}>
                                                <h3 className="text-lg font-semibold">Card {i}</h3>
                                                <p className={`mt-2 ${
                                                    darkMode ? "text-gray-300" : "text-blue-100"
                                                }`}>Sample content here</p>
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
        </>
    );
}

export default AdminLayout;