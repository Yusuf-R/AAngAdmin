'use client';
import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Package, MapPin, Clock, Truck, CheckCircle2, XCircle, AlertTriangle,
    MoreVertical, Search, Download, Filter, RefreshCw, CalendarDays,
    ChevronDown, CreditCard, Wallet, Smartphone, Eye, Edit3, Trash2,
    UserCheck, Route, FileText, MessageCircle, Star, Phone, Camera,
    Navigation, PlayCircle, AlertCircle, Timer, DollarSign, Shield,
    Settings, Users, TrendingUp, Activity, PlusCircle, ArrowUpDown,
    ArrowUp, ArrowDown,TruckElectric
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
    DropdownMenuCheckboxItem
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
import {queryClient} from "@/lib/queryClient";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import {socketClient} from "@/lib/SocketClient";


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

const priorityStyles = {
    urgent: {bg: "bg-red-600", hover: "hover:bg-red-700", text: "text-white"},
    high: {bg: "bg-amber-600", hover: "hover:bg-amber-700", text: "text-white"},
    normal: {bg: "bg-emerald-600", hover: "hover:bg-emerald-700", text: "text-white"},
    low: {bg: "bg-blue-600", hover: "hover:bg-blue-700", text: "text-white"}
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

// Action buttons component
function OrderActions({ order, onAction }) {
    const router = useRouter();
    const meta = statusMeta[order.status] || statusMeta.draft;
    const StatusIcon = meta.icon;

    const handleNavigation = (type, newTab = false) => {
        const url = `/admin/orders/${type}/${order._id}`;

        if (newTab) {
            window.open(url, '_blank');
        } else {
            router.push(url);
        }
    };

    const handleOrderAssignment = async () => {
        try {
            if (!socketClient.isConnected) {
                await socketClient.connect();
            }
            const response = await AdminUtils.orderAssignment(order);
            const { orderAssignment } = response;
            if (!orderAssignment) {
                toast.error('Failed to assign order');
                return;
            }
            const sent = await socketClient.sendOrderAssignment(orderAssignment);
            if (!sent) {
                toast.error('Failed to assign order');
                return;
            }
            if (sent.success) {
                toast.success('Order assigned successfully');
                router.refresh();
            }  else {
                toast.warning('Order assigned but failed to notify drivers');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to assign order');
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <StatusIcon className="w-4 h-4" />
                    {order.orderRef}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Primary Actions */}
                <DropdownMenuItem
                    onClick={(e) => handleNavigation('view', e.ctrlKey || e.metaKey)}
                    className="gap-2 font-medium"
                >
                    <Eye className="w-4 h-4" />
                    View Details
                    <Badge variant="outline" className="ml-auto text-xs">
                        Full Info
                    </Badge>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleNavigation('tracking')}
                    className="gap-2 font-medium"
                >
                    <Navigation className="w-4 h-4" />
                    Real-time Tracking
                    <Badge variant="outline" className="ml-auto text-xs">
                        Live Updates
                    </Badge>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleNavigation('history')}
                    className="gap-2"
                >
                    <Activity className="w-4 h-4" />
                    Order History
                    <Badge variant="outline" className="ml-auto text-xs">
                        Timeline
                    </Badge>
                </DropdownMenuItem>

                {/* Status-specific actions */}
                {order.status === 'admin_review' && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onAction(order._id, 'approve')}
                            className="gap-2 text-green-600 font-medium"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve Order
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onAction(order._id, 'reject')}
                            className="gap-2 text-red-600 font-medium"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject Order
                        </DropdownMenuItem>
                    </>
                )}

                {/* Rest of your existing actions */}
                {['pending', 'broadcast'].includes(order.status) && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleOrderAssignment()}
                            className="gap-2"
                        >
                            <TruckElectric className="w-4 h-4" />
                            Create Order Assignment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onAction(order._id, 'assign')}
                            className="gap-2"
                        >
                            <UserCheck className="w-4 h-4" />
                            Assign Driver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onAction(order._id, 'broadcast')}
                            className="gap-2"
                        >
                            <Truck className="w-4 h-4" />
                            Broadcast to Drivers
                        </DropdownMenuItem>
                    </>
                )}

                {/* Communication & Management */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onAction(order._id, 'message')}
                    className="gap-2"
                >
                    <MessageCircle className="w-4 h-4" />
                    Send Message
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => onAction(order._id, 'edit')}
                    className="gap-2"
                >
                    <Edit3 className="w-4 h-4" />
                    Edit Order
                </DropdownMenuItem>

                {['draft', 'failed'].includes(order.status) && (
                    <DropdownMenuItem
                        onClick={() => onAction(order._id, 'delete')}
                        className="gap-2 text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Order
                    </DropdownMenuItem>
                )}

                {!['draft', 'delivered', 'cancelled', 'failed'].includes(order.status) && (
                    <DropdownMenuItem
                        onClick={() => onAction(order._id, 'cancel')}
                        className="gap-2 text-red-600 focus:text-red-600"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Column definitions for TanStack Table
function createColumns(onAction) {
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
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground text-sm">{order.orderRef}</p>
                                <Badge variant="outline" className="text-xs capitalize">
                                    {order.orderType}
                                </Badge>
                                {order.insurance?.isInsured && (
                                    <Shield className="w-4 h-4 text-blue-600" title="Insured"/>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {order.package?.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${meta.chip}`}>
                                    {meta.label}
                                </Badge>
                                {order.package?.isFragile && (
                                    <Badge variant="outline" className="text-xs text-amber-600">
                                        Fragile
                                    </Badge>
                                )}
                                {order.package?.requiresSpecialHandling && (
                                    <Badge variant="outline" className="text-xs text-purple-600">
                                        Special
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
            header: "Route",
            enableSorting: false,
            cell: ({row}) => {
                const order = row.original;
                return (
                    <div className="space-y-2 text-sm max-w-xs">
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground truncate">
                                    {order.location?.pickUp?.landmark || order.location?.pickUp?.address || 'TBD'}
                                </p>
                                {order.location?.pickUp?.contactPerson?.name && (
                                    <p className="text-xs text-muted-foreground/70">
                                        {order.location.pickUp.contactPerson.name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground truncate">
                                    {order.location?.dropOff?.landmark || order.location?.dropOff?.address || 'TBD'}
                                </p>
                                {order.location?.dropOff?.contactPerson?.name && (
                                    <p className="text-xs text-muted-foreground/70">
                                        {order.location.dropOff.contactPerson.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const order = row.original;
                const meta = statusMeta[order.status] || statusMeta.draft;
                const StatusIcon = meta.icon;

                // Define glow animations for attention-requiring statuses
                const getStatusAnimation = (status) => {
                    switch(status) {
                        case 'admin_review':
                            return 'animate-pulse bg-amber-500/20 ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/25';
                        case 'broadcast':
                            return 'animate-pulse bg-purple-500/20 ring-2 ring-purple-400/50 shadow-lg shadow-purple-400/25';
                        case 'pending':
                            return 'animate-bounce bg-blue-500/20 ring-2 ring-blue-400/50 shadow-lg shadow-blue-400/25';
                        case 'failed':
                            return 'animate-pulse bg-red-500/20 ring-2 ring-red-400/50 shadow-lg shadow-red-400/25';
                        default:
                            return '';
                    }
                };

                return (
                    <div className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${getStatusAnimation(order.status)}`}>
                        <div className={`p-1.5 rounded-lg ${meta.chip}`}>
                            <StatusIcon className="w-4 h-4" />
                        </div>
                        <Badge className={`text-xs ${meta.chip} font-medium`}>
                            {meta.label}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "priority",
            header: "Priority",
            cell: ({row}) => {
                const priority = row.getValue("priority");
                const priorityStyle = priorityStyles[priority] || priorityStyles.normal;
                return (
                    <Badge className={`${priorityStyle.bg} ${priorityStyle.hover} ${priorityStyle.text} capitalize`}>
                        {priority}
                    </Badge>
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
                            <p className="text-foreground">{paymentMethod.label}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    order.payment?.status === 'paid' ? 'bg-green-500' :
                                        order.payment?.status === 'failed' ? 'bg-red-500' :
                                            order.payment?.status === 'processing' ? 'bg-blue-500' : 'bg-gray-500'
                                }`}></div>
                                <span className={`text-xs capitalize ${
                                    order.payment?.status === 'paid' ? 'text-green-600' :
                                        order.payment?.status === 'failed' ? 'text-red-600' :
                                            order.payment?.status === 'processing' ? 'text-blue-600' : 'text-gray-600'
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
            id: "driver",
            header: "Driver",
            enableSorting: false,
            cell: ({row}) => {
                const order = row.original;
                return order.driverAssignment?.driverInfo ? (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {order.driverAssignment.driverInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                {order.driverAssignment.driverInfo.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="capitalize">{order.driverAssignment.driverInfo.vehicleType}</span>
                                <span>•</span>
                                <span>{order.driverAssignment.driverInfo.vehicleNumber}</span>
                                {order.driverAssignment.driverInfo.rating && (
                                    <>
                                        <span>•</span>
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/>
                                        <span>{order.driverAssignment.driverInfo.rating}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        {['pending', 'broadcast', 'admin_review'].includes(order.status) ?
                            'Awaiting assignment' : 'Not assigned'
                        }
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
                        <p className="font-medium text-foreground">
                            {formatCurrency(order.pricing?.totalAmount || 0, order.pricing?.currency)}
                        </p>
                        {order.status === 'draft' && order.pricing?.totalAmount === 0 && (
                            <p className="text-xs text-muted-foreground">Not calculated</p>
                        )}
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
                        Updated
                        <ArrowUpDown className="ml-2 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({row}) => {
                const order = row.original;
                return (
                    <div className="text-sm">
                        <p className="text-foreground">{timeAgo(order.updatedAt)}</p>
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
                return <OrderActions order={order} onAction={onAction}/>;
            },
        },
    ];
}

export default function AdvancedOrderManagement({initialOrderData, totalStatistics, pagination: initialPagination}) {
    const [data, setData] = useState(initialOrderData || []);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState(totalStatistics || {});
    const [pagination, setPagination] = useState(initialPagination || {});
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
    const [initialLoad, setInitialLoad] = useState(true);

    const handleOrderAction = useCallback((orderId, action) => {
        // Implement actual actions here
        switch (action) {
            case "approve":
                // Update order status to approved
                break;
            case "reject":
                // Update order status to rejected
                break;
            case "assign":
                // Open driver assignment modal
                break;
            case "track":
                // Open tracking view
                break;
            case "contact_driver":
                // Open communication modal
                break;
            // ... other actions
        }
    }, []);

    const columns = useMemo(() => createColumns(handleOrderAction), [handleOrderAction]);

    const fetchOrders = useCallback(async (filters) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const result = await AdminUtils.getOrders(params);

            if (result.success) {
                setData(result.data.initialOrderData);
                setStats(result.data.totalStatistics);
                setPagination(result.data.pagination);
            }

        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
            setInitialLoad(false);
        }
    }, []);

    // Effect to fetch data when filters change
    useEffect(() => {
        fetchOrders(serverFilters);
    }, [fetchOrders, serverFilters]);

    const handleSearch = () => {
        setActiveSearch(searchInput);
        setServerFilters(prev => ({
            ...prev,
            search: searchInput.trim(),
            page: 1
        }));
    };

    // Clear search function
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
            e.preventDefault(); // Prevent any form submission
            handleSearch();
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

    const StatCard = ({icon: Icon, label, value, trend, chipClass}) => (
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
            </div>
        </div>
    );

    if (initialLoad && isLoading) {
        return (
            <div className="p-2 space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-muted/40 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted/30 rounded w-1/2 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-muted/30 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-muted/30 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 space-y-6">
            {/* Header Section */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div className="mb-6 lg:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <Package className="w-8 h-8"/>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-foreground">Order Management</h1>
                                <p className="text-lg text-muted-foreground mt-1">
                                    Comprehensive order tracking and management system
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4"/> Export
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <RefreshCw className="w-4 h-4"/> Refresh
                        </Button>
                        <Button
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            <PlusCircle className="w-4 h-4"/> New Order
                        </Button>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <StatCard
                        icon={Package}
                        label="Total Orders"
                        value={totalStatistics.total}
                        trend="+12%"
                        chipClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                    />
                    <StatCard
                        icon={Activity}
                        label="Active Orders"
                        value={totalStatistics.active}
                        trend="+8%"
                        chipClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Delivered"
                        value={totalStatistics.completed}
                        trend="+15%"
                        chipClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={AlertTriangle}
                        label="Pending Review"
                        value={totalStatistics.pendingApproval}
                        chipClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                    />
                    <StatCard
                        icon={XCircle}
                        label="Issues"
                        value={totalStatistics.failed}
                        chipClass="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                    />
                    <StatCard
                        icon={DollarSign}
                        label="Revenue"
                        value={formatCurrency(totalStatistics.revenue)}
                        trend="+22%"
                        chipClass="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                    />
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Search Input with explicit button */}
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

                            {/* Search Button */}
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

                            {/* Clear Search Button - only show if there's an active search */}
                            {activeSearch && (
                                <Button
                                    onClick={handleClearSearch}
                                    variant="outline"
                                    size="sm"
                                    className="px-3"
                                    disabled={isLoading}
                                >
                                    <XCircle className="h-4 w-4"/>
                                    <span className="sr-only">Clear search</span>
                                </Button>
                            )}
                        </div>

                        {/* Show active search indicator */}
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
                        {/* Column visibility toggle */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    Columns <ChevronDown className="ml-2 h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Results Summary */}
                <div
                    className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                    <div>
                        Showing {pagination.totalResults || 0} results
                        {activeSearch && ` for "${activeSearch}"`}
                        {pagination.totalResults && pagination.totalResults > 0 && (
                            <span className="ml-2"> (Page {pagination.page} of {pagination.totalPages}) </span>
                        )}
                    </div>

                    {/* Clear all filters button */}
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

            {/* TanStack Data Table - same as before */}
            <div
                className={`bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {/* Loading overlay */}
                {isLoading && (
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
                        <div className="flex flex-col items-center space-y-3 p-6 bg-card rounded-lg border shadow-lg">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600"/>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                    {activeSearch ? 'Searching orders...' : 'Loading orders...'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Please wait a moment
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* TanStack Data Table */}
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
                                                    : "No orders have been created yet"
                                                }
                                            </p>
                                            {activeSearch && (
                                                <Button
                                                    variant="outline"
                                                    onClick={handleClearSearch}
                                                    className="mt-4"
                                                >
                                                    Clear search
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>


                {/* Enhanced Pagination */}
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
                                {[5, 10, 20, 30, 40, 50, 100].map((pageSize) => (
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
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage() || isLoading}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronDown className="h-4 w-4 rotate-90"/>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage() || isLoading}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronDown className="h-4 w-4 rotate-90"/>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronDown className="h-4 w-4 -rotate-90"/>
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronDown className="h-4 w-4 -rotate-90"/>
                            </Button>
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length > 0 && (
                            <span>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                {table.getFilteredRowModel().rows.length} row(s) selected
              </span>
                        )}
                        {table.getFilteredSelectedRowModel().rows.length === 0 && (
                            <span>
                Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} orders
              </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
