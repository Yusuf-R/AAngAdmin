// src/components/Admin/User/UserManagement.jsx
'use client';

import {
    Users, Truck, Building, Shield, Search, MoreVertical, Edit, Trash2, Eye,
    UserCheck, Download, Plus, MapPin, Clock, DollarSign, Phone, Star, Activity, CheckCircle2, Pause, Package
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { mockUsers } from "@/lib/data";

// --- mock data (unchanged) ---


function UserManagementSystem() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => {
        const t = setTimeout(() => {
            setUsers(mockUsers);
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(t);
    }, []);

    const filteredUsers = useMemo(() => {
        return users
            .filter(user => {
                const s = searchTerm.toLowerCase();
                const matchesSearch =
                    user.fullName.toLowerCase().includes(s) ||
                    user.email.toLowerCase().includes(s) ||
                    user.phoneNumber?.includes(searchTerm);
                const matchesRole = selectedRole === "all" || user.role.toLowerCase() === selectedRole;
                const matchesStatus = selectedStatus === "all" || user.status.toLowerCase() === selectedStatus;
                return matchesSearch && matchesRole && matchesStatus;
            })
            .sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];
                if (sortBy === 'createdAt' || sortBy === 'lastActive') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }
                return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
            });
    }, [users, searchTerm, selectedRole, selectedStatus, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleUserAction = (userId, action) => {
        console.log(`${action} user:`, userId);
    };

    const getRoleIcon = (role) => {
        if (role === "Admin") return Shield;
        if (role === "Driver") return Truck;
        return Building;
    };

    // Use stable classes with dark: overrides (no JS dark branching)
    const getStatusClasses = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'active':
                return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
            case 'inactive':
                return 'text-gray-600 dark:text-gray-400 bg-gray-500/10';
            case 'suspended':
                return 'text-amber-600 dark:text-amber-400 bg-amber-500/10';
            case 'banned':
                return 'text-red-600 dark:text-red-400 bg-red-500/10';
            case 'pending':
                return 'text-blue-600 dark:text-blue-400 bg-blue-500/10';
            default:
                return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
        }
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatTimeAgo = (d) => {
        const now = new Date();
        const date = new Date(d);
        const diffMin = Math.floor((now - date) / (1000 * 60));
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
        return `${Math.floor(diffMin / 1440)}d ago`;
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-border p-8 bg-card">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-8 w-48 rounded animate-pulse bg-muted/40 dark:bg-muted/20" />
                            <div className="h-5 w-72 rounded animate-pulse bg-muted/40 dark:bg-muted/20" />
                        </div>
                        <div className="flex gap-3">
                            <div className="h-10 w-32 rounded-lg animate-pulse bg-muted/40 dark:bg-muted/20" />
                            <div className="h-10 w-24 rounded-lg animate-pulse bg-muted/40 dark:bg-muted/20" />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 w-32 rounded-lg animate-pulse bg-muted/40 dark:bg-muted/20" />
                        ))}
                    </div>

                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-16 rounded-lg animate-pulse bg-muted/30 dark:bg-muted/10" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header card */}
            <div className="rounded-2xl border border-border p-8 bg-card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                        </div>
                        <p className="text-lg text-muted-foreground">
                            Manage all platform users — Admins, Clients, and Drivers
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/60 hover:bg-accent transition-colors text-foreground">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add User
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-4 py-3 rounded-xl bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="client">Client</option>
                            <option value="driver">Driver</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-3 rounded-xl bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending">Pending</option>
                        </select>

                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                            className="px-4 py-3 rounded-xl bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        >
                            <option value="createdAt-desc">Newest First</option>
                            <option value="createdAt-asc">Oldest First</option>
                            <option value="fullName-asc">Name A-Z</option>
                            <option value="fullName-desc">Name Z-A</option>
                            <option value="lastActive-desc">Recently Active</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Users', value: users.length, icon: Users, color: 'blue' },
                        { label: 'Active Users', value: users.filter(u => u.status === 'Active').length, icon: UserCheck, color: 'emerald' },
                        { label: 'Drivers', value: users.filter(u => u.role === 'Driver').length, icon: Truck, color: 'purple' },
                        { label: 'Clients', value: users.filter(u => u.role === 'Client').length, icon: Building, color: 'orange' }
                    ].map((stat, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border bg-muted/40">
                            <div className="flex items-center gap-3">
                                <div
                                    className={
                                        "p-2 rounded-lg " +
                                        (stat.color === 'blue'
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                            : stat.color === 'emerald'
                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                : stat.color === 'purple'
                                                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                                                    : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400')
                                    }
                                >
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {['User','Role','Status','Contact','Stats','Last Active','Actions'].map(h => (
                                <th key={h} className="text-left px-6 py-4 font-semibold text-foreground">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedUsers.map((user) => {
                            const RoleIcon = getRoleIcon(user.role, user.adminRole);
                            return (
                                <tr key={user._id} className="border-b border-border hover:bg-muted/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-muted text-muted-foreground">
                                                        {user.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                {user.role === 'Driver' && user.availabilityStatus === 'online' && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{user.fullName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                                {user.emailVerified && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-xs text-emerald-500">Verified</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <RoleIcon className={
                                                "w-4 h-4 " +
                                                (user.role === 'Admin'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : user.role === 'Driver'
                                                        ? 'text-purple-600 dark:text-purple-400'
                                                        : 'text-blue-600 dark:text-blue-400')
                                            }/>
                                            <div>
                                                <span className="font-medium text-foreground">{user.role}</span>
                                                {user.adminRole && (
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {user.adminRole.replace('_', ' ')}
                                                    </p>
                                                )}
                                                {user.vehicleType && (
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {user.vehicleType}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(user.status)}`}>
                        {user.status}
                      </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">{user.phoneNumber}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {user.role === 'Admin' && (
                                                <>
                                                    <p className="text-sm text-foreground">Actions: {user.stats.totalActions}</p>
                                                    <p className="text-xs text-muted-foreground">Avg Response: {user.stats.resolutionTime}min</p>
                                                </>
                                            )}
                                            {user.role === 'Client' && (
                                                <>
                                                    <p className="text-sm text-foreground">Orders: {user.stats.totalOrders}</p>
                                                    <p className="text-xs text-muted-foreground">Spent: ₦{user.stats.totalSpent?.toLocaleString()}</p>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-yellow-500" />
                                                        <span className="text-xs text-muted-foreground">Trust: {user.stats.trustScore}%</span>
                                                    </div>
                                                </>
                                            )}
                                            {user.role === 'Driver' && (
                                                <>
                                                    <p className="text-sm text-foreground">Deliveries: {user.stats.totalDeliveries}</p>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                        <span className="text-xs text-muted-foreground">{user.stats.averageRating}/5</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Success: {user.stats.completionRate}%</p>
                                                </>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm text-foreground">{formatTimeAgo(user.lastActive)}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(user.lastActive)}</p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUserAction(user._id, 'view')}
                                                className="p-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                                                title="View User"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleUserAction(user._id, 'edit')}
                                                className="p-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <div className="relative group">
                                                <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                                    <div className="py-1">
                                                        {user.status === 'Active' ? (
                                                            <button
                                                                onClick={() => handleUserAction(user._id, 'suspend')}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                                            >
                                                                <Pause className="w-4 h-4" />
                                                                Suspend User
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUserAction(user._id, 'activate')}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                Activate User
                                                            </button>
                                                        )}

                                                        {user.role === 'Driver' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUserAction(user._id, 'viewPerformance')}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                                                >
                                                                    <Activity className="w-4 h-4" />
                                                                    View Performance
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUserAction(user._id, 'viewLocation')}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                                                >
                                                                    <MapPin className="w-4 h-4" />
                                                                    View Location
                                                                </button>
                                                            </>
                                                        )}

                                                        {user.role === 'Client' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUserAction(user._id, 'viewOrders')}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                                                >
                                                                    <Package className="w-4 h-4" />
                                                                    View Orders
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUserAction(user._id, 'viewWallet')}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                                                >
                                                                    <DollarSign className="w-4 h-4" />
                                                                    View Wallet
                                                                </button>
                                                            </>
                                                        )}

                                                        {user.role === 'Admin' && (
                                                            <button
                                                                onClick={() => handleUserAction(user._id, 'viewAuditTrail')}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                                            >
                                                                <Clock className="w-4 h-4" />
                                                                View Audit Trail
                                                            </button>
                                                        )}

                                                        <hr className="my-1 border-border" />

                                                        <button
                                                            onClick={() => handleUserAction(user._id, 'impersonate')}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-600 hover:bg-muted/40 transition-colors"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                            Impersonate
                                                        </button>

                                                        <button
                                                            onClick={() => handleUserAction(user._id, 'delete')}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-muted/40 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete User
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-card">
                    <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                const isActive = currentPage === pageNum;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={
                                            "px-3 py-2 rounded-lg border transition-colors " +
                                            (isActive
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                                                : "border-border text-muted-foreground hover:bg-muted/40")
                                        }
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-2xl font-bold text-foreground mb-2">Create New User</h2>
                            <p className="text-muted-foreground">Add a new user to the platform</p>
                        </div>

                        <div className="p-6">
                            <form className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">User Type</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { type: 'Admin', icon: Shield, color: 'red' },
                                            { type: 'Client', icon: Building, color: 'blue' },
                                            { type: 'Driver', icon: Truck, color: 'purple' }
                                        ].map((ut) => (
                                            <div key={ut.type} className="p-4 rounded-xl border-2 border-dashed border-border hover:border-emerald-500/50 cursor-pointer transition-colors group bg-background">
                                                <div className="text-center">
                                                    <ut.icon
                                                        className={
                                                            "w-8 h-8 mx-auto mb-2 transition-transform group-hover:scale-110 " +
                                                            (ut.color === 'red'
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : ut.color === 'blue'
                                                                    ? 'text-blue-600 dark:text-blue-400'
                                                                    : 'text-purple-600 dark:text-purple-400')
                                                        }
                                                    />
                                                    <p className="font-medium text-foreground">{ut.type}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="+234 xxx xxx xxxx"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Initial Status</label>
                                        <select className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                            <option value="Active">Active</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-border flex justify-end gap-3 bg-card">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors"
                            >
                                Cancel
                            </button>
                            <button className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                                Create User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManagementSystem;
