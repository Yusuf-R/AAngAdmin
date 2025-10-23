'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Bell, Search, Download, RefreshCw, ChevronDown, XCircle,
    Check, Trash2, Eye, AlertTriangle, CheckCircle2,
    Activity, TrendingUp, Filter, Package, Shield,
    MessageCircle, CreditCard, Users, Settings, BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminUtils from "@/utils/AdminUtils";

const categoryMeta = {
    ORDER: { label: "Order", icon: Package, color: "bg-blue-500/10 text-blue-600" },
    DELIVERY: { label: "Delivery", icon: Users, color: "bg-purple-500/10 text-purple-600" },
    SECURITY: { label: "Security", icon: Shield, color: "bg-red-500/10 text-red-600" },
    IDENTITY: { label: "Identity", icon: Users, color: "bg-indigo-500/10 text-indigo-600" },
    SYSTEM: { label: "System", icon: Settings, color: "bg-gray-500/10 text-gray-600" },
    PAYMENT: { label: "Payment", icon: CreditCard, color: "bg-green-500/10 text-green-600" },
    SOCIAL: { label: "Social", icon: MessageCircle, color: "bg-pink-500/10 text-pink-600" },
    PROMOTION: { label: "Promotion", icon: TrendingUp, color: "bg-amber-500/10 text-amber-600" }
};

const priorityStyles = {
    CRITICAL: { bg: "bg-red-600", text: "text-white" },
    URGENT: { bg: "bg-orange-600", text: "text-white" },
    HIGH: { bg: "bg-yellow-600", text: "text-white" },
    NORMAL: { bg: "bg-blue-600", text: "text-white" },
    LOW: { bg: "bg-gray-600", text: "text-white" }
};

const adminActionMeta = {
    REVIEW: { label: "Review", color: "bg-blue-500/10 text-blue-600" },
    APPROVE: { label: "Approve", color: "bg-green-500/10 text-green-600" },
    ASSIGN: { label: "Assign", color: "bg-purple-500/10 text-purple-600" },
    RESOLVE: { label: "Resolve", color: "bg-orange-500/10 text-orange-600" },
    ACKNOWLEDGE: { label: "Acknowledge", color: "bg-indigo-500/10 text-indigo-600" },
    INVESTIGATE: { label: "Investigate", color: "bg-red-500/10 text-red-600" },
    CONFIGURE: { label: "Configure", color: "bg-yellow-500/10 text-yellow-600" },
    RESPOND: { label: "Respond", color: "bg-pink-500/10 text-pink-600" }
};

const adminActionStatusStyles = {
    PENDING: {
        bg: "bg-amber-100 dark:bg-amber-500/20",
        text: "text-amber-800 dark:text-amber-300",
        border: "border-amber-300",
        animate: true
    },
    IN_PROGRESS: {
        bg: "bg-blue-100 dark:bg-blue-500/20",
        text: "text-blue-800 dark:text-blue-300",
        border: "border-blue-300",
        animate: false
    },
    COMPLETED: {
        bg: "bg-green-100 dark:bg-green-500/20",
        text: "text-green-800 dark:text-green-300",
        border: "border-green-300",
        animate: false
    },
    REJECTED: {
        bg: "bg-red-100 dark:bg-red-500/20",
        text: "text-red-800 dark:text-red-300",
        border: "border-red-300",
        animate: false
    },
    ESCALATED: {
        bg: "bg-purple-100 dark:bg-purple-500/20",
        text: "text-purple-800 dark:text-purple-300",
        border: "border-purple-300",
        animate: true
    }
};

const adminActionUrgencyStyles = {
    IMMEDIATE: { color: "text-red-600", bg: "bg-red-500/10" },
    TODAY: { color: "text-orange-600", bg: "bg-orange-500/10" },
    THIS_WEEK: { color: "text-blue-600", bg: "bg-blue-500/10" },
    WHENEVER: { color: "text-gray-600", bg: "bg-gray-500/10" }
};

function NotificationActions({ notification, onAction }) {
    const router = useRouter();
    const isUnread = !notification.read?.status;
    const isDeleted = notification.deleted?.status;


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {isUnread && !isDeleted && (
                    <DropdownMenuItem
                        onClick={() => onAction(notification._id, 'mark-read')}
                        className="gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Mark as Read
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    onClick={() => onAction(notification._id, 'view')}
                    className="gap-2"
                >
                    <Eye className="w-4 h-4" />
                    View Details
                </DropdownMenuItem>
                {!isDeleted && (
                    <DropdownMenuItem
                        onClick={() => onAction(notification._id, 'delete')}
                        className="gap-2 text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </DropdownMenuItem>
                )}
                {isDeleted && (
                    <DropdownMenuItem
                        onClick={() => onAction(notification._id, 'restore')}
                        className="gap-2 text-green-600 focus:text-green-600"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Restore
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function createColumns(onAction) {
    return [
        {
            id: "status",
            header: "Status",
            enableSorting: false,
            cell: ({ row }) => {
                const notification = row.original;
                const isUnread = !notification.read?.status;
                return (
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-3 h-3 rounded-full ${
                                isUnread ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'
                            }`}
                        />
                    </div>
                );
            },
        },
        {
            id: "deleted",
            header: "Deleted",
            enableSorting: false,
            cell: ({ row }) => {
                const notification = row.original;
                const isDeleted = notification.deleted?.status;
                return (
                    <div className="flex items-center gap-2">
                        {isDeleted ? (
                            <Badge variant="destructive" className="gap-1 text-xs">
                                <Trash2 className="w-3 h-3" />
                                True
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10">
                                <CheckCircle2 className="w-3 h-3" />
                                False
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: "content",
            header: "Notification",
            cell: ({ row }) => {
                const notification = row.original;
                const category = categoryMeta[notification.category] || categoryMeta.SYSTEM;
                const CategoryIcon = category.icon;
                const meta = AdminUtils.getNotificationMeta(notification);

                return (
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${category.color} flex-shrink-0`}>
                            <span className="text-xl">{meta.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm">{notification.content?.title}</p>
                                <Badge variant="outline" className={`text-xs ${category.color}`}>
                                    {category.label}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.content?.body}
                            </p>
                            {notification.content?.orderRef && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Order: {notification.content.orderRef}
                                </p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: "adminAction",
            header: "Admin Action",
            cell: ({ row }) => {
                const notification = row.original;
                const adminAction = notification.adminAction;

                if (!adminAction?.required) {
                    return (
                        <div className="flex flex-col items-center text-center">
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                                Not Required
                            </Badge>
                        </div>
                    );
                }

                const actionMeta = adminActionMeta[adminAction.actionType] || adminActionMeta.REVIEW;
                const statusStyle = adminActionStatusStyles[adminAction.status] || adminActionStatusStyles.PENDING;
                const urgencyStyle = adminActionUrgencyStyles[adminAction.urgency] || adminActionUrgencyStyles.WHENEVER;

                return (
                    <div className="space-y-2 min-w-[200px]">
                        {/* Action Type */}
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`${actionMeta.color} border-current/20 text-xs font-medium`}
                            >
                                {actionMeta.label}
                            </Badge>
                        </div>

                        {/* Status with animation */}
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} text-xs font-medium ${
                                    statusStyle.animate ? 'animate-pulse' : ''
                                }`}
                            >
                                {adminAction.status}
                            </Badge>
                        </div>

                        {/* Urgency */}
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`${urgencyStyle.bg} ${urgencyStyle.color} border-current/20 text-xs`}
                            >
                                {adminAction.urgency}
                            </Badge>
                        </div>

                        {/* Target Role */}
                        {adminAction.targetRole && (
                            <div className="text-xs text-muted-foreground">
                                For: {adminAction.targetRole.replace('_', ' ')}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "priority",
            header: "Priority",
            cell: ({ row }) => {
                const priority = row.getValue("priority");
                const style = priorityStyles[priority] || priorityStyles.NORMAL;
                return (
                    <Badge className={`${style.bg} ${style.text}`}>
                        {priority}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("type");
                return (
                    <span className="text-xs text-muted-foreground font-mono">
                        {type}
                    </span>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Time",
            cell: ({ row }) => {
                const notification = row.original;
                return (
                    <div className="text-sm">
                        <p className="font-medium">
                            {AdminUtils.formatTime(notification.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            enableHiding: false,
            cell: ({ row }) => {
                return <NotificationActions notification={row.original} onAction={onAction} />;
            },
        },
    ];
}

export default function NotificationManagement({
                                                   initialNotificationData,
                                                   totalStatistics,
                                                   pagination: initialPagination
                                               }) {
    const router = useRouter();
    const [data, setData] = useState(initialNotificationData || []);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState(totalStatistics || {});
    const [pagination, setPagination] = useState(initialPagination || {});
    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [serverFilters, setServerFilters] = useState({
        search: '',
        category: '',
        priority: '',
        status: '',
        showDeleted: 'false',
        adminActionRequired: '',
        adminActionStatus: '',
        adminActionUrgency: '',
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const handleNotificationAction = useCallback(async (notificationId, action) => {
        switch (action) {
            case 'mark-read':
                const markResult = await AdminUtils.markAsRead(notificationId);
                if (markResult.success) {
                    toast.success('Marked as read');
                    await fetchNotifications(serverFilters);
                }
                break;
            case 'delete':
                const deleteResult = await AdminUtils.deleteNotification(notificationId);
                if (deleteResult.success) {
                    toast.success('Notification deleted (soft delete)');
                    await fetchNotifications(serverFilters);
                }
                break;
            case 'restore':
                const restoreResult = await AdminUtils.restoreNotification(notificationId);
                if (restoreResult.success) {
                    toast.success('Notification restored');
                    await fetchNotifications(serverFilters);
                }
                break;
            case 'view':
                // Open notification detail modal or page
                router.push(`/admin/notifications/view/${notificationId}`)
                break;
        }
    }, [serverFilters]);

    const columns = useMemo(() => createColumns(handleNotificationAction), [handleNotificationAction]);

    const fetchNotifications = useCallback(async (filters) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const result = await AdminUtils.getNotifications(params);
            if (result.success) {
                setData(result.notifications);
                setStats(result.stats);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications(serverFilters);
    }, [serverFilters]);

    const handleSearch = () => {
        setActiveSearch(searchInput);
        setServerFilters(prev => ({
            ...prev,
            search: searchInput.trim(),
            page: 1
        }));
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setActiveSearch('');
        setServerFilters(prev => ({ ...prev, search: '', page: 1 }));
    };

    const handleMarkAllAsRead = async () => {
        const result = await AdminUtils.markAllAsRead();
        if (result.success) {
            toast.success('All notifications marked as read');
            await fetchNotifications(serverFilters);
        }
    };

    const table = useReactTable({
        data,
        columns,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: pagination.totalPages || 0,
        state: {
            pagination: {
                pageIndex: serverFilters.page - 1,
                pageSize: serverFilters.limit,
            },
        },
        onPaginationChange: (updater) => {
            const newPagination = typeof updater === 'function'
                ? updater({ pageIndex: serverFilters.page - 1, pageSize: serverFilters.limit })
                : updater;

            setServerFilters(prev => ({
                ...prev,
                page: newPagination.pageIndex + 1,
                limit: newPagination.pageSize
            }));
        },
        getCoreRowModel: getCoreRowModel(),
    });

    const StatCard = ({ icon: Icon, label, value, chipClass, subtitle }) => (
        <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${chipClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {subtitle && (
                <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
            )}
        </div>
    );

    return (
        <div className="p-2 space-y-6">
            {/* Header */}
            <div className="bg-card rounded-2xl border p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <BellRing className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold">Notification Center</h1>
                            <p className="text-lg text-muted-foreground mt-1">
                                Manage all system notifications
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {stats.unread > 0 && (
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={handleMarkAllAsRead}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Mark All Read
                            </Button>
                        )}
                        <Button variant="outline" className="gap-2" onClick={() => fetchNotifications(serverFilters)}>
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Enhanced Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                        icon={Bell}
                        label="Total (All)"
                        value={stats.total || 0}
                        subtitle="Including deleted"
                        chipClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20"
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Active"
                        value={stats.totalActive || 0}
                        subtitle="Non-deleted only"
                        chipClass="bg-green-100 text-green-600 dark:bg-green-500/20"
                    />
                    <StatCard
                        icon={Trash2}
                        label="Deleted"
                        value={stats.totalDeleted || 0}
                        subtitle="Soft deleted"
                        chipClass="bg-gray-100 text-gray-600 dark:bg-gray-500/20"
                    />
                    <StatCard
                        icon={AlertTriangle}
                        label="Unread (Active)"
                        value={stats.unread || 0}
                        subtitle={`${stats.unreadAll || 0} total with deleted`}
                        chipClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20"
                    />
                    <StatCard
                        icon={Activity}
                        label="Critical/Urgent"
                        value={(stats.critical || 0) + (stats.urgent || 0)}
                        subtitle="High priority active"
                        chipClass="bg-red-100 text-red-600 dark:bg-red-500/20"
                    />
                    <StatCard
                        icon={AlertTriangle}
                        label="Admin Actions"
                        value={stats.adminAction?.pending || 0}
                        subtitle={`${stats.adminAction?.required || 0} total, ${stats.adminAction?.overdue || 0} overdue`}
                        chipClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20"
                    />
                </div>
            </div>

            {/* Category Breakdown Stats */}
            <div className="bg-muted/30 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Category Distribution
                        <span className="text-sm font-normal text-muted-foreground">
                            {serverFilters.showDeleted === 'false' && '(Active Only)'}
                            {serverFilters.showDeleted === 'only' && '(Deleted Only)'}
                            {serverFilters.showDeleted === 'true' && '(All Including Deleted)'}
                        </span>
                    </h3>
                    {serverFilters.category && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setServerFilters(prev => ({ ...prev, category: '', page: 1 }))}
                            className="gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Clear Category Filter
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {Object.entries(categoryMeta).map(([key, meta]) => {
                        const Icon = meta.icon;
                        // Use appropriate stats based on filter
                        const count = serverFilters.showDeleted === 'false'
                            ? (stats.activeByCategory?.[key] || 0)
                            : (stats.filteredByCategory?.[key] || stats.byCategory?.[key] || 0);
                        const isActive = serverFilters.category === key;

                        return (
                            <div
                                key={key}
                                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                    isActive
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-md'
                                        : 'border-transparent bg-card hover:shadow-md hover:border-gray-200'
                                }`}
                                onClick={() => setServerFilters(prev => ({
                                    ...prev,
                                    category: isActive ? '' : key,
                                    page: 1
                                }))}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${meta.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    {isActive && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    )}
                                </div>
                                <p className="text-2xl font-bold">{count}</p>
                                <p className="text-xs text-muted-foreground">{meta.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8 ">
                    <div className="flex items-center space-x-4 flex-1 flex-wrap gap-y-3">
                        {/* Search */}
                        <div className="flex items-center space-x-2 w-[80%]">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search notifications..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10 w-full"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={isLoading}>
                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                            {activeSearch && (
                                <Button variant="outline" size="sm" onClick={handleClearSearch}>
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1 flex-wrap gap-y-3">
                        {/* Category Filter */}
                        <Select
                            value={serverFilters.category || "all"}
                            onValueChange={(value) => setServerFilters(prev => ({
                                ...prev,
                                category: value === "all" ? '' : value,
                                page: 1
                            }))}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Object.entries(categoryMeta).map(([key, meta]) => (
                                    <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Priority Filter */}
                        <Select
                            value={serverFilters.priority || "all"}
                            onValueChange={(value) => setServerFilters(prev => ({
                                ...prev,
                                priority: value === "all" ? '' : value,
                                page: 1
                            }))}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="NORMAL">Normal</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select
                            value={serverFilters.status || "all"}
                            onValueChange={(value) => setServerFilters(prev => ({
                                ...prev,
                                status: value === "all" ? '' : value,
                                page: 1
                            }))}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="unread">Unread Only</SelectItem>
                                <SelectItem value="read">Read Only</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Deleted Filter */}
                        <Select
                            value={serverFilters.showDeleted}
                            onValueChange={(value) => setServerFilters(prev => ({
                                ...prev,
                                showDeleted: value,
                                page: 1
                            }))}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Deleted Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="false">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        Active Only
                                    </div>
                                </SelectItem>
                                <SelectItem value="true">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-600" />
                                        All (Inc. Deleted)
                                    </div>
                                </SelectItem>
                                <SelectItem value="only">
                                    <div className="flex items-center gap-2">
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                        Deleted Only
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Admin Action Required Filter */}
                        <Select
                            value={serverFilters.adminActionRequired || "all"}
                            onValueChange={(value) => setServerFilters(prev => ({
                                ...prev,
                                adminActionRequired: value === "all" ? '' : value,
                                page: 1
                            }))}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Admin Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="true">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        Requires Admin Action
                                    </div>
                                </SelectItem>
                                <SelectItem value="false">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        No Admin Action
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Admin Action Status Filter - Only show if admin action is required */}
                        {serverFilters.adminActionRequired === 'true' && (
                            <Select
                                value={serverFilters.adminActionStatus || "all"}
                                onValueChange={(value) => setServerFilters(prev => ({
                                    ...prev,
                                    adminActionStatus: value === "all" ? '' : value,
                                    page: 1
                                }))}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Action Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                    <SelectItem value="ESCALATED">Escalated</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {/* Admin Action Urgency Filter - Only show if admin action is required */}
                        {serverFilters.adminActionRequired === 'true' && (
                            <Select
                                value={serverFilters.adminActionUrgency || "all"}
                                onValueChange={(value) => setServerFilters(prev => ({
                                    ...prev,
                                    adminActionUrgency: value === "all" ? '' : value,
                                    page: 1
                                }))}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Action Urgency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Urgencies</SelectItem>
                                    <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                                    <SelectItem value="TODAY">Today</SelectItem>
                                    <SelectItem value="THIS_WEEK">This Week</SelectItem>
                                    <SelectItem value="WHENEVER">Whenever</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {/* Column visibility */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table.getAllColumns().filter(col => col.getCanHide()).map(column => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>Showing {pagination.totalResults || 0} results</span>
                    {activeSearch && (
                        <Badge variant="secondary" className="gap-1">
                            <Search className="w-3 h-3" />
                            "{activeSearch}"
                        </Badge>
                    )}
                    {serverFilters.showDeleted === 'only' && (
                        <Badge variant="destructive" className="gap-1">
                            <Trash2 className="w-3 h-3" />
                            Deleted notifications
                        </Badge>
                    )}
                    {serverFilters.showDeleted === 'true' && (
                        <Badge variant="secondary" className="gap-1">
                            <Activity className="w-3 h-3" />
                            Including deleted
                        </Badge>
                    )}
                    {serverFilters.showDeleted === 'false' && (
                        <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active only
                        </Badge>
                    )}
                    {serverFilters.adminActionRequired === 'true' && (
                        <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Requires Admin Action
                        </Badge>
                    )}
                    {serverFilters.adminActionRequired === 'false' && (
                        <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3" />
                            No Admin Action
                        </Badge>
                    )}
                    {serverFilters.adminActionStatus && (
                        <Badge variant="outline" className="gap-1 capitalize">
                            {serverFilters.adminActionStatus.toLowerCase().replace('_', ' ')}
                        </Badge>
                    )}
                    {serverFilters.adminActionUrgency && serverFilters.adminActionUrgency !== 'all' && (
                        <Badge variant="outline" className="gap-1">
                            {serverFilters.adminActionUrgency.toLowerCase()}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className={`bg-card rounded-2xl border shadow-sm overflow-hidden relative transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {isLoading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="flex flex-col items-center space-y-3 p-6 bg-card rounded-lg border shadow-lg">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm font-medium">Loading notifications...</p>
                        </div>
                    </div>
                )}

                <div className="rounded-md border relative">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="px-6 py-4">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => {
                                    const isDeleted = row.original.deleted?.status;
                                    const isUnread = !row.original.read?.status;

                                    return (
                                        <TableRow
                                            key={row.id}
                                            className={`hover:bg-muted/50 transition-colors ${
                                                isDeleted
                                                    ? 'bg-red-50/30 dark:bg-red-500/5 opacity-70'
                                                    : row.original.adminAction?.required
                                                        ? row.original.adminAction.status === 'PENDING'
                                                            ? 'bg-amber-50/50 dark:bg-amber-500/5 border-l-4 border-amber-400'
                                                            : row.original.adminAction.status === 'ESCALATED'
                                                                ? 'bg-purple-50/50 dark:bg-purple-500/5 border-l-4 border-purple-400'
                                                                : row.original.adminAction.status === 'IN_PROGRESS'
                                                                    ? 'bg-blue-50/50 dark:bg-blue-500/5 border-l-4 border-blue-400'
                                                                    : 'bg-green-50/50 dark:bg-green-500/5'
                                                        : isUnread
                                                            ? 'bg-blue-50/50 dark:bg-blue-500/5'
                                                            : ''
                                            }`}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="px-6 py-4">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <Bell className="w-16 h-16 text-muted-foreground/40 mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
                                            <p className="text-muted-foreground">
                                                {activeSearch ? `No results for "${activeSearch}"` : 'No notifications available'}
                                            </p>
                                            {(serverFilters.category || serverFilters.priority || serverFilters.status || serverFilters.showDeleted !== 'false') && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-4"
                                                    onClick={() => {
                                                        setServerFilters({
                                                            search: '',
                                                            category: '',
                                                            priority: '',
                                                            status: '',
                                                            showDeleted: 'false',
                                                            adminActionRequired: '',
                                                            adminActionStatus: '',
                                                            adminActionUrgency: '',
                                                            page: 1,
                                                            limit: 100,
                                                            sortBy: 'createdAt',
                                                            sortOrder: 'desc'
                                                        });
                                                        setSearchInput('');
                                                        setActiveSearch('');
                                                    }}
                                                >
                                                    Clear All Filters
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4 px-6 border-t">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map(size => (
                                    <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-6">
                        <p className="text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                        </p>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage() || isLoading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage() || isLoading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}