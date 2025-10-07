// components/ClientOrders.jsx
'use client';
import React, {useState, useMemo} from 'react';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Package, MapPin, Clock, Truck, CheckCircle2, XCircle, AlertTriangle,
    MoreVertical, Search, RefreshCw,
    ChevronDown, CreditCard, Wallet, Smartphone, Eye,
    UserCheck, FileText, Star, Navigation,
    TrendingUp, Activity, ArrowUpDown, Users, DollarSign, ArrowLeft
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Input} from '@/components/ui/input';
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
import AdminUtils from "@/utils/AdminUtils";
import {useQuery} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

// Reuse your existing statusMeta and other configurations
const statusMeta = {
    draft: {
        label: "Draft",
        icon: Package,
        chip: "bg-gray-500/10 text-gray-600 dark:text-gray-300",
        description: "Order is being created",
        actions: ["delete", "resume"]
    },
    submitted: {
        label: "Submitted",
        icon: Package,
        chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        description: "Awaiting payment",
        actions: ["view", "cancel"]
    },
    admin_review: {
        label: "Admin Review",
        icon: AlertTriangle,
        chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        description: "Under admin review",
        actions: ["approve", "reject", "view", "contact"]
    },
    admin_approved: {
        label: "Approved",
        icon: CheckCircle2,
        chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        description: "Approved by admin",
        actions: ["assign", "view", "track"]
    },
    pending: {
        label: "Pending",
        icon: Clock,
        chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        description: "Awaiting driver assignment",
        actions: ["assign", "broadcast", "view", "cancel"]
    },
    broadcast: {
        label: "Broadcasting",
        icon: Truck,
        chip: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        description: "Finding available drivers",
        actions: ["view", "cancel_broadcast", "manual_assign"]
    },
    assigned: {
        label: "Assigned",
        icon: UserCheck,
        chip: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        description: "Driver assigned",
        actions: ["view", "track", "contact_driver", "reassign"]
    },
    confirmed: {
        label: "Confirmed",
        icon: CheckCircle2,
        chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        description: "Driver confirmed pickup",
        actions: ["view", "track", "contact_driver"]
    },
    en_route_pickup: {
        label: "En Route Pickup",
        icon: Navigation,
        chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        description: "Driver heading to pickup",
        actions: ["view", "track", "contact_driver"]
    },
    arrived_pickup: {
        label: "Arrived Pickup",
        icon: MapPin,
        chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        description: "Driver at pickup location",
        actions: ["view", "track", "contact_driver"]
    },
    picked_up: {
        label: "Picked Up",
        icon: Package,
        chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        description: "Package collected",
        actions: ["view", "track", "contact_driver"]
    },
    in_transit: {
        label: "In Transit",
        icon: Truck,
        chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        description: "On the way to delivery",
        actions: ["view", "track", "contact_driver", "eta_update"]
    },
    arrived_dropoff: {
        label: "Arrived Dropoff",
        icon: MapPin,
        chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        description: "Driver at delivery location",
        actions: ["view", "track", "contact_driver", "verify_delivery"]
    },
    delivered: {
        label: "Delivered",
        icon: CheckCircle2,
        chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        description: "Successfully delivered",
        actions: ["view", "feedback", "invoice", "archive"]
    },
    failed: {
        label: "Failed",
        icon: XCircle,
        chip: "bg-red-500/10 text-red-600 dark:text-red-400",
        description: "Delivery failed",
        actions: ["view", "retry", "refund", "contact"]
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        chip: "bg-red-500/10 text-red-600 dark:text-red-400",
        description: "Order cancelled",
        actions: ["view", "refund", "archive"]
    },
    returned: {
        label: "Returned",
        icon: AlertTriangle,
        chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        description: "Returned to sender",
        actions: ["view", "retry", "refund"]
    }
};

const paymentMethods = {
    wallet: {label: "Wallet", icon: Wallet, color: "text-purple-600"},
    paystack: {label: "PayStack", icon: Smartphone, color: "text-blue-600"},
    banktransfer: {label: "Bank Transfer", icon: CreditCard, color: "text-green-600"}
};

function timeAgo(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMin = Math.floor((now - d) / (1000 * 60));
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
}

function formatCurrency(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount);
}

// Order Actions Component for Client View
function OrderActions({order, clientId}) {
    const meta = statusMeta[order.status] || statusMeta.draft;
    const StatusIcon = meta.icon;

    const handleNavigation = (tab, newTab = false) => {
        const orderId = order._id;
        const url = `/admin/users/view/orders/${clientId}/order-details/${orderId}?tab=${tab}`;
        window.open(url, '_blank');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <StatusIcon className="w-4 h-4"/>
                    {order.orderRef}
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>

                <DropdownMenuItem
                    onClick={(e) => handleNavigation('details', e.ctrlKey || e.metaKey)}
                    className="gap-2 font-medium"
                >
                    <Eye className="w-4 h-4"/>
                    View Full Details
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleNavigation('tracking')}
                    className="gap-2"
                >
                    <Navigation className="w-4 h-4"/>
                    Real-Time Tracking
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleNavigation('history')}
                    className="gap-2"
                >
                    <Activity className="w-4 h-4"/>
                    Order History
                </DropdownMenuItem>

                {order.payment?.status === 'paid' && (
                    <DropdownMenuItem
                        onClick={() => handleNavigation('invoice')}
                        className="gap-2"
                    >
                        <FileText className="w-4 h-4"/>
                        View Invoice
                    </DropdownMenuItem>
                )}

                {['delivered', 'completed'].includes(order.status) && (
                    <DropdownMenuItem
                        onClick={() => handleNavigation('feedback')}
                        className="gap-2"
                    >
                        <Star className="w-4 h-4"/>
                        Rate Service
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Create columns for client view
function createColumns(clientName, clientId) {
    return [
        {
            id: "orderDetails",
            header: "Order Details",
            enableSorting: false,
            cell: ({row}) => {
                const order = row.original;
                const meta = statusMeta[order.status] || statusMeta.draft;
                const StatusIcon = meta.icon;

                return (
                    <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg ${meta.chip} flex-shrink-0`}>
                            <StatusIcon className="w-5 h-5"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground text-sm">{order.orderRef}</p>
                                <Badge variant="outline" className="text-xs capitalize">
                                    {order.orderType}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {order.package?.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`text-xs ${meta.chip}`}>
                                    {meta.label}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {order.priority}
                                </Badge>
                                {order.package?.isFragile && (
                                    <Badge variant="outline" className="text-xs text-amber-600">
                                        Fragile
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "route",
            header: "Delivery Route",
            enableSorting: false,
            cell: ({row}) => {
                const order = row.original;
                return (
                    <div className="space-y-2 text-sm max-w-xs">
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-xs truncate">
                                    From: {order.location?.pickUp?.landmark || order.location?.pickUp?.address || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-xs truncate">
                                    To: {order.location?.dropOff?.landmark || order.location?.dropOff?.address || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({row}) => {
                const order = row.original;
                const meta = statusMeta[order.status] || statusMeta.draft;
                const StatusIcon = meta.icon;

                return (
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${meta.chip}`}>
                            <StatusIcon className="w-4 h-4"/>
                        </div>
                        <div className="min-w-0">
                            <Badge className={`text-xs ${meta.chip} font-medium`}>
                                {meta.label}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                {meta.description}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "payment",
            header: "Payment",
            enableSorting: false,
            cell: ({row}) => {
                const order = row.original;
                const paymentMethod = paymentMethods[order.payment?.method?.toLowerCase()] || paymentMethods.paystack;
                const PaymentIcon = paymentMethod.icon;

                return (
                    <div className="flex items-center gap-2 text-sm">
                        <PaymentIcon className={`w-4 h-4 ${paymentMethod.color}`}/>
                        <div>
                            <p className="text-foreground text-sm">{paymentMethod.label}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    order.payment?.status === 'paid' ? 'bg-green-500' :
                                        order.payment?.status === 'failed' ? 'bg-red-500' :
                                            'bg-gray-500'
                                }`}></div>
                                <span className={`text-xs capitalize ${
                                    order.payment?.status === 'paid' ? 'text-green-600' :
                                        order.payment?.status === 'failed' ? 'text-red-600' :
                                            'text-gray-600'
                                }`}>
                                    {order.payment?.status || 'pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "pricing.totalAmount",
            header: ({column}) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 lg:px-3"
                    >
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({row}) => {
                const order = row.original;
                return (
                    <div className="text-right">
                        <p className="font-medium text-foreground text-sm">
                            {formatCurrency(order.pricing?.totalAmount || 0, order.pricing?.currency)}
                        </p>
                    </div>
                );
            },
        },
        {
            accessorKey: "updatedAt",
            header: ({column}) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 lg:px-3"
                    >
                        Last Updated
                        <ArrowUpDown className="ml-2 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({row}) => {
                const order = row.original;
                return (
                    <div className="text-sm">
                        <p className="text-foreground text-sm">{timeAgo(order.updatedAt)}</p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(order.updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            enableHiding: false,
            cell: ({row}) => {
                const order = row.original;
                return <OrderActions order={order} clientId={clientId}/>;
            },
        },
    ];
}

const StatCard = ({icon: Icon, label, value, description, trend, chipClass}) => (
    <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-xl ${chipClass}`}>
                <Icon className="w-6 h-6"/>
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-500"/>
                    <span className="text-emerald-600 font-medium">{trend}</span>
                </div>
            )}
        </div>
        <div>
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {description && (
                <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
            )}
        </div>
    </div>
);

export default function ClientOrders({clientId, initialClientOrderData, clientData}) {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [serverFilters, setServerFilters] = useState({
        search: '',
        status: '',
        priority: '',
        orderType: '',
        page: 1,
        limit: 100,
        sortBy: 'finalScore',
        sortOrder: 'desc'
    });

    const {data, isLoading, error, refetch} = useQuery({
        queryKey: ['clientOrders', clientId, serverFilters],
        queryFn: () => AdminUtils.getClientOrders(serverFilters, clientId),
        enabled: !!clientId,
    });

    const orders = data?.initialClientOrderData || [];
    const stats = data?.totalStatistics || {};
    const pagination = data?.pagination || {};

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
        setServerFilters(prev => ({
            ...prev,
            search: '',
            page: 1
        }));
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    // FIXED: Pass clientId to createColumns
    const columns = useMemo(() =>
            createColumns(clientData?.fullName || 'Client', clientId),
        [clientData?.fullName, clientId]
    );

    const table = useReactTable({
        data: orders,
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
            sorting: [{
                id: serverFilters.sortBy,
                desc: serverFilters.sortOrder === 'desc'
            }],
        },
        onPaginationChange: (updater) => {
            const newPagination = typeof updater === 'function'
                ? updater({pageIndex: serverFilters.page - 1, pageSize: serverFilters.limit})
                : updater;

            setServerFilters(prev => ({
                ...prev,
                page: newPagination.pageIndex + 1,
                limit: newPagination.pageSize
            }));
        },
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function'
                ? updater([{id: serverFilters.sortBy, desc: serverFilters.sortOrder === 'desc'}])
                : updater;

            if (newSorting.length > 0) {
                setServerFilters(prev => ({
                    ...prev,
                    sortBy: newSorting[0].id,
                    sortOrder: newSorting[0].desc ? 'desc' : 'asc',
                    page: 1
                }));
            }
        },
        getCoreRowModel: getCoreRowModel(),
    });

    if (error) {
        return (
            <div className="p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    Failed to load orders
                </h3>
                <p className="text-muted-foreground mb-4">
                    {error.message || 'An error occurred while loading orders'}
                </p>
                <Button onClick={() => refetch()} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2"/>
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="p-2 space-y-6">
            {/* Header Section */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="gap-2 mb-4"
                >
                    <ArrowLeft className="w-4 h-4"/>
                    Back
                </Button>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div className="mb-6 lg:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <Users className="w-8 h-8"/>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-foreground">
                                    {clientData?.fullName || 'Client'}'s Orders
                                </h1>
                                <p className="text-lg text-muted-foreground mt-1">
                                    Complete order history and analytics
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => refetch()}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/>
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        icon={Package}
                        label="Total Orders"
                        value={stats.total || 0}
                        description="All time orders"
                        chipClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                    />
                    <StatCard
                        icon={Clock}
                        label="Draft Orders"
                        value={stats.draft || 0}
                        description="Incomplete orders"
                        chipClass="bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
                    />
                    <StatCard
                        icon={Activity}
                        label="Ongoing Orders"
                        value={stats.ongoing || 0}
                        description="Active deliveries"
                        chipClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Completed"
                        value={stats.completed || 0}
                        description="Successful deliveries"
                        chipClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={DollarSign}
                        label="Total Spent"
                        value={formatCurrency(stats.revenue || 0)}
                        description={`Across ${stats.paidOrders || 0} paid orders`}
                        chipClass="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                    />
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                                <Input
                                    placeholder="Search orders..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    className="pl-10 pr-4 max-w-sm"
                                    disabled={isLoading}
                                />
                            </div>

                            <Button
                                onClick={handleSearch}
                                variant="default"
                                className="px-4"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin"/>
                                ) : (
                                    <Search className="h-4 w-4"/>
                                )}
                            </Button>

                            {activeSearch && (
                                <Button
                                    onClick={handleClearSearch}
                                    variant="outline"
                                    size="sm"
                                    className="px-3"
                                    disabled={isLoading}
                                >
                                    <XCircle className="h-4 w-4"/>
                                </Button>
                            )}
                        </div>

                        {activeSearch && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>Searching for:</span>
                                <Badge variant="secondary" className="px-2 py-1">
                                    "{activeSearch}"
                                </Badge>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Select
                            value={serverFilters.status}
                            onValueChange={(value) => setServerFilters(prev => ({
                                ...prev,
                                status: value,
                                page: 1
                            }))}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="ongoing">Ongoing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div
                    className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                    <div>
                        Showing {pagination.totalResults || 0} orders for {clientData?.fullName || 'client'}
                        {activeSearch && ` matching "${activeSearch}"`}
                    </div>

                    {activeSearch && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSearch}
                            disabled={isLoading}
                        >
                            Clear search
                        </Button>
                    )}
                </div>
            </div>

            {/* Orders Table */}
            <div
                className={`bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {isLoading && (
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
                        <div className="flex flex-col items-center space-y-3 p-6 bg-card rounded-lg border shadow-lg">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600"/>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                    {activeSearch ? 'Searching orders...' : 'Loading orders...'}
                                </p>
                            </div>
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
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="hover:bg-muted/50 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="px-6 py-4">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <Package className="w-16 h-16 text-muted-foreground/40 mb-4"/>
                                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                                {activeSearch ? `No orders found for "${activeSearch}"` : "No orders found"}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {activeSearch
                                                    ? "Try a different search term or clear the search"
                                                    : `${clientData?.fullName || 'This client'} hasn't placed any orders yet`
                                                }
                                            </p>
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
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize}/>
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage() || isLoading}
                            >
                                <ChevronDown className="h-4 w-4 rotate-90"/>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage() || isLoading}
                            >
                                <ChevronDown className="h-4 w-4 -rotate-90"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}