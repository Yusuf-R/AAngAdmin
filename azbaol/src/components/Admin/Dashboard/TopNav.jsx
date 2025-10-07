import { Menu, Bell, Search, User, ChevronDown, Sun, Moon, Settings, LogOut, UserCircle, Wrench } from "lucide-react";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/ModeToggle";

function TopNav({ onToggleSideNav, adminData }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Get username from adminData
    const getUserName = () => {
        return adminData?.name ||
            adminData?.googleCredentials?.name ||
            adminData?.fullName ||
            "Admin";
    };

    // Format date
    const formatDate = () => {
        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        };
        return currentTime.toLocaleDateString('en-GB', options);
    };

    // Check if it's day or night (6 AM to 6 PM is day)
    const isDayTime = () => {
        const hour = currentTime.getHours();
        return hour >= 6 && hour < 18;
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.user-dropdown')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isDropdownOpen]);

    return (
        <div className="bg-background border-b border-border px-4 py-2 shadow-sm transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="flex items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={onToggleSideNav}
                        className="p-2 rounded-lg hover:bg-accent transition-colors duration-200 text-foreground"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Dashboard Title & Greeting */}
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Hi {getUserName()}</span>
                                <span className="text-border">•</span>
                                <span>{formatDate()}</span>
                                <div className="ml-1">
                                    {isDayTime() ? (
                                        <Sun className="w-4 h-4 text-yellow-500" />
                                    ) : (
                                        <Moon className="w-4 h-4 text-blue-400" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Section - Search */}
                {/*<div className="flex-1 max-w-md mx-8 hidden lg:block">*/}
                {/*    <div className="relative">*/}
                {/*        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />*/}
                {/*        <input*/}
                {/*            type="text"*/}
                {/*            placeholder="Search anything..."*/}
                {/*            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card hover:bg-accent transition-colors duration-200 text-foreground placeholder-muted-foreground"*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*</div>*/}

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {/* Mobile Search Button */}
                    <button className="p-2 rounded-lg hover:bg-accent transition-colors duration-200 lg:hidden text-foreground">
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Light/Dark Mode Toggle */}
                    <ModeToggle/>

                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-accent transition-colors duration-200 text-foreground">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative user-dropdown">
                        <button
                            onClick={toggleDropdown}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        >
                            {adminData?.avatar ? (
                                <img
                                    src={adminData.avatar}
                                    alt={getUserName()}
                                    className="w-9 h-9 rounded-full object-cover shadow-md"
                                />
                            ) : (
                                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md">
                                    <User className="w-4 h-4 text-primary-foreground" />
                                </div>
                            )}
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-foreground">
                                    {getUserName()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {adminData?.adminRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Administrator'}
                                </p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl shadow-lg border border-border py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-border">
                                    <p className="text-sm font-medium text-foreground">{getUserName()}</p>
                                    <p className="text-xs text-muted-foreground">{adminData?.email || "admin@example.com"}</p>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            {adminData?.status || 'Active'}
                                        </span>
                                    </div>
                                </div>

                                <div className="py-1">
                                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors duration-150">
                                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                                        Profile
                                    </button>
                                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors duration-150">
                                        <Settings className="w-4 h-4 text-muted-foreground" />
                                        Settings
                                    </button>
                                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors duration-150">
                                        <Wrench className="w-4 h-4 text-muted-foreground" />
                                        Utilities
                                    </button>
                                </div>

                                <div className="border-t border-border py-1">
                                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-150">
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TopNav;