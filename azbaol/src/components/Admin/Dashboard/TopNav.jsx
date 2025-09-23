import { Menu, Bell, Search, User, ChevronDown, Sun, Moon, Settings, LogOut, UserCircle, Wrench } from "lucide-react";
import { useState, useEffect } from "react";

function TopNav({ onToggleSideNav, adminData, darkMode, setDarkMode }) {
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

    // Get greeting based on time
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
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
        <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
            <div className="flex items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={onToggleSideNav}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Dashboard Title & Greeting */}
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Hi {getUserName()}</span>
                                <span className="text-gray-300">•</span>
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
                <div className="flex-1 max-w-md mx-8 hidden lg:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {/* Mobile Search Button */}
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden">
                        <Search className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Light/Dark Mode Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                    >
                        {darkMode ? (
                            <Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-gray-600" />
                        )}
                    </button>

                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative user-dropdown">
                        <button
                            onClick={toggleDropdown}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {adminData?.avatar ? (
                                <img
                                    src={adminData.avatar}
                                    alt={getUserName()}
                                    className="w-9 h-9 rounded-full object-cover shadow-md"
                                />
                            ) : (
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900">
                                    {getUserName()}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {adminData?.adminRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Administrator'}
                                </p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
                                    <p className="text-xs text-gray-500">{adminData?.email || "admin@example.com"}</p>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {adminData?.status || 'Active'}
                                        </span>
                                    </div>
                                </div>

                                <div className="py-1">
                                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
                                        <UserCircle className="w-4 h-4 text-gray-400" />
                                        Profile
                                    </button>
                                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
                                        <Settings className="w-4 h-4 text-gray-400" />
                                        Settings
                                    </button>
                                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
                                        <Wrench className="w-4 h-4 text-gray-400" />
                                        Utilities
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 py-1">
                                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150">
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