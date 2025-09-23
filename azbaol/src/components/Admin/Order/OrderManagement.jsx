// =============================================
// Orders Management — Next.js + Tailwind + shadcn/ui
// Theme-aware (no darkMode prop), token-driven styles
// Copy the two blocks into:
// 1) app/admin/orders/page.jsx
// 2) components/Admin/Orders/OrderManagement.jsx
// ---------------------------------------------
// Requires shadcn/ui installed (button, badge, dropdown-menu, input)
// and lucide-react. Tailwind tokens from your globals.css.
// =============================================


/* =============================================
 * File: components/Admin/Orders/OrderManagement.jsx
 * =========================================== */

"use client";

import {
    Package, MapPin, Clock, Truck, CheckCircle2, XCircle, AlertTriangle,
    MoreVertical, Search, Download, Filter, RefreshCw, CalendarDays,
    ChevronDown, CreditCard, Wallet, Smartphone
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

// ---------------------------------------------
// Mock orders (shape aligned to your schema fields used in UI)
// Swap with data from API later
// ---------------------------------------------
const mockOrders = [
    {
        _id: "68cc1555fd42d4f34835f7ae",
        orderRef: "ORD-MFPI0S7A-QEQW",
        status: "draft",
        orderType: "instant",
        priority: "normal",
        pricing: { totalAmount: 0, currency: "NGN" },
        payment: { method: "PayStack", status: "pending" },
        location: {
            pickUp: { address: "TBD", coordinates: { type: "Point", coordinates: [0, 0] } },
            dropOff: { address: "TBD", coordinates: { type: "Point", coordinates: [0, 0] } },
        },
        package: { category: "others", description: "Draft package" },
        metadata: { draftProgress: { step: 1 } },
        createdAt: "2025-09-18T14:21:09.201Z",
        updatedAt: "2025-09-18T14:21:09.201Z",
    },
    {
        _id: "68d12335e6fe2e33bbbb7d90",
        orderRef: "ORD-MK2Q8P1K-7YTR",
        status: "pending",
        orderType: "instant",
        priority: "high",
        pricing: { totalAmount: 3500, currency: "NGN" },
        payment: { method: "PayStack", status: "processing" },
        location: {
            pickUp: { address: "Lekki Phase 1, Lagos" },
            dropOff: { address: "Yaba, Lagos" },
        },
        package: { category: "parcel", description: "Clothing parcel" },
        metadata: {},
        createdAt: "2025-09-22T10:10:09.201Z",
        updatedAt: "2025-09-23T12:00:00.000Z",
    },
    {
        _id: "68d12335e6fe2e33bbbb7d91",
        orderRef: "ORD-PL90ASQ1-9ZQW",
        status: "assigned",
        orderType: "instant",
        priority: "urgent",
        pricing: { totalAmount: 5500, currency: "NGN" },
        payment: { method: "Wallet", status: "paid" },
        location: {
            pickUp: { address: "Ikeja City Mall" },
            dropOff: { address: "Unilag Akoka" },
        },
        package: { category: "fragile", description: "Laptop delivery" },
        metadata: {},
        createdAt: "2025-09-23T07:30:00.000Z",
        updatedAt: "2025-09-23T13:10:00.000Z",
    },
    {
        _id: "68d12335e6fe2e33bbbb7d92",
        orderRef: "ORD-A12B34C5-6D7E",
        status: "in_transit",
        orderType: "scheduled",
        priority: "normal",
        pricing: { totalAmount: 4200, currency: "NGN" },
        payment: { method: "BankTransfer", status: "paid" },
        location: {
            pickUp: { address: "Victoria Island" },
            dropOff: { address: "Surulere" },
        },
        package: { category: "document", description: "Legal documents" },
        metadata: {},
        createdAt: "2025-09-21T16:00:00.000Z",
        updatedAt: "2025-09-23T12:40:00.000Z",
    },
    {
        _id: "68d12335e6fe2e33bbbb7d93",
        orderRef: "ORD-QWERTY12-ABCD",
        status: "delivered",
        orderType: "instant",
        priority: "low",
        pricing: { totalAmount: 2700, currency: "NGN" },
        payment: { method: "PayStack", status: "paid" },
        location: {
            pickUp: { address: "Yaba Tech" },
            dropOff: { address: "Ogudu GRA" },
        },
        package: { category: "food", description: "Party trays" },
        metadata: {},
        createdAt: "2025-09-20T09:00:00.000Z",
        updatedAt: "2025-09-20T11:45:00.000Z",
    },
];

const statusMeta = {
    draft: { label: "Draft", icon: Package, chip: "bg-gray-500/10 text-gray-600 dark:text-gray-300" },
    submitted: { label: "Submitted", icon: Package, chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    admin_review: { label: "Admin Review", icon: AlertTriangle, chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    pending: { label: "Pending", icon: Clock, chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    broadcast: { label: "Broadcast", icon: Truck, chip: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    assigned: { label: "Assigned", icon: Truck, chip: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    confirmed: { label: "Confirmed", icon: CheckCircle2, chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    en_route_pickup: { label: "En Route Pickup", icon: Truck, chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    arrived_pickup: { label: "Arrived Pickup", icon: MapPin, chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    picked_up: { label: "Picked Up", icon: Package, chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    in_transit: { label: "In Transit", icon: Truck, chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
    arrived_dropoff: { label: "Arrived Dropoff", icon: MapPin, chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    delivered: { label: "Delivered", icon: CheckCircle2, chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    failed: { label: "Failed", icon: XCircle, chip: "bg-red-500/10 text-red-600 dark:text-red-400" },
    cancelled: { label: "Cancelled", icon: XCircle, chip: "bg-red-500/10 text-red-600 dark:text-red-400" },
    returned: { label: "Returned", icon: AlertTriangle, chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

const paymentIcon = (method) => {
    switch ((method || "").toLowerCase()) {
        case "wallet": return Wallet;
        case "banktransfer": return CreditCard;
        case "paystack": return Smartphone;
        default: return CreditCard;
    }
};

function timeAgo(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMin = Math.floor((now - d) / (1000 * 60));
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
}

export default function OrderManagement() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [priority, setPriority] = useState("all");
    const [type, setType] = useState("all");
    const [sort, setSort] = useState("createdAt-desc");
    const [page, setPage] = useState(1);
    const perPage = 10;

    useEffect(() => {
        const t = setTimeout(() => {
            setOrders(mockOrders);
            setIsLoading(false);
        }, 600);
        return () => clearTimeout(t);
    }, []);

    const filtered = useMemo(() => {
        const s = q.toLowerCase();
        const [sortKey, sortDir] = sort.split("-");
        return orders
            .filter(o => {
                const hit = (
                    o.orderRef.toLowerCase().includes(s) ||
                    o.package?.description?.toLowerCase().includes(s) ||
                    o.location?.pickUp?.address?.toLowerCase().includes(s) ||
                    o.location?.dropOff?.address?.toLowerCase().includes(s)
                );
                const sOk = status === "all" || o.status === status;
                const pOk = priority === "all" || o.priority === priority;
                const tOk = type === "all" || o.orderType === type;
                return hit && sOk && pOk && tOk;
            })
            .sort((a, b) => {
                let A = a[sortKey];
                let B = b[sortKey];
                if (sortKey === "createdAt" || sortKey === "updatedAt") {
                    A = new Date(A); B = new Date(B);
                }
                return sortDir === "asc" ? (A > B ? 1 : -1) : (A < B ? 1 : -1);
            });
    }, [orders, q, status, priority, type, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const pageData = filtered.slice((page - 1) * perPage, page * perPage);

    const StatCard = ({ icon: Icon, label, value, chipClass }) => (
        <div className="p-4 rounded-xl border border-border bg-muted/40">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${chipClass}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-border p-8 bg-card">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-8 w-56 rounded animate-pulse bg-muted/40 dark:bg-muted/20" />
                            <div className="h-5 w-80 rounded animate-pulse bg-muted/40 dark:bg-muted/20" />
                        </div>
                        <div className="flex gap-3">
                            <div className="h-10 w-32 rounded-lg animate-pulse bg-muted/40 dark:bg-muted/20" />
                            <div className="h-10 w-24 rounded-lg animate-pulse bg-muted/40 dark:bg-muted/20" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-xl animate-pulse bg-muted/30 dark:bg-muted/10" />
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

    const total = orders.length;
    const active = orders.filter(o => ["pending","broadcast","assigned","confirmed","picked_up","in_transit"].includes(o.status)).length;
    const completed = orders.filter(o => o.status === "delivered").length;
    const failed = orders.filter(o => ["failed","cancelled","returned"].includes(o.status)).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-border p-8 bg-card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
                        </div>
                        <p className="text-lg text-muted-foreground">Track, filter, and act on your delivery orders in one place</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="secondary" className="gap-2">
                            <Download className="w-4 h-4" /> Export
                        </Button>
                        <Button variant="secondary" className="gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard icon={Package} label="Total Orders" value={total} chipClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" />
                    <StatCard icon={Truck} label="Active" value={active} chipClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" />
                    <StatCard icon={CheckCircle2} label="Delivered" value={completed} chipClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" />
                    <StatCard icon={XCircle} label="Failed/Cancelled" value={failed} chipClass="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" />
                </div>
            </div>

            {/* Controls */}
            <div className="rounded-2xl border border-border p-4 bg-card">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={q}
                            onChange={(e) => { setQ(e.target.value); setPage(1); }}
                            placeholder="Search by ref, addresses, or description"
                            className="pl-9"
                        />
                    </div>

                    <div className="flex gap-2">
                        {/* Status filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Filter className="w-4 h-4" /> Status <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {['all','draft','pending','assigned','in_transit','delivered','failed','cancelled','returned'].map(s => (
                                    <DropdownMenuItem key={s} onClick={() => { setStatus(s); setPage(1); }}>
                                        {s.replace(/_/g, ' ')}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Priority */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Priority <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {['all','low','normal','high','urgent'].map(p => (
                                    <DropdownMenuItem key={p} onClick={() => { setPriority(p); setPage(1); }}>{p}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Type */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <CalendarDays className="w-4 h-4" /> Type <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Order Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {['all','instant','scheduled','recurring'].map(t => (
                                    <DropdownMenuItem key={t} onClick={() => { setType(t); setPage(1); }}>{t}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    Sort <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {[
                                    {k:"createdAt-desc", label:"Newest"},
                                    {k:"createdAt-asc", label:"Oldest"},
                                    {k:"updatedAt-desc", label:"Recently Updated"},
                                    {k:"updatedAt-asc", label:"Least Recently Updated"},
                                    {k:"orderRef-asc", label:"Ref A–Z"},
                                    {k:"orderRef-desc", label:"Ref Z–A"},
                                ].map(opt => (
                                    <DropdownMenuItem key={opt.k} onClick={() => setSort(opt.k)}>
                                        {opt.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {['Order','Route','Priority','Payment','Amount','Updated','Actions'].map(h => (
                                <th key={h} className="text-left px-6 py-3 font-semibold text-foreground">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {pageData.map((o) => {
                            const meta = statusMeta[o.status] || { label: o.status, icon: Package, chip: "bg-muted text-muted-foreground" };
                            const StatusIcon = meta.icon;
                            const PayIcon = paymentIcon(o.payment?.method);
                            return (
                                <tr key={o._id} className="border-b border-border hover:bg-muted/40 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${meta.chip}`}>
                                                <StatusIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-foreground">{o.orderRef}</p>
                                                    <Badge variant="secondary" className="capitalize">{o.orderType}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{o.package?.description || '—'}</p>
                                                <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.chip}`}>
                              {meta.label}
                            </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-muted-foreground">{o.location?.pickUp?.address || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-muted-foreground">{o.location?.dropOff?.address || '—'}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <Badge className={
                                            o.priority === 'urgent' ? 'bg-red-600 hover:bg-red-700' :
                                                o.priority === 'high'   ? 'bg-amber-600 hover:bg-amber-700' :
                                                    o.priority === 'low'    ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                        }>
                                            {o.priority}
                                        </Badge>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-2 text-sm">
                                            <PayIcon className="w-4 h-4 text-muted-foreground" />
                                            <span className="capitalize text-muted-foreground">{o.payment?.method}</span>
                                        </div>
                                        <div className="text-xs mt-1">
                        <span className={
                            o.payment?.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' :
                                o.payment?.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                        }>
                          {o.payment?.status}
                        </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-top whitespace-nowrap">
                                        <p className="text-foreground font-medium">₦{Number(o.pricing?.totalAmount || 0).toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">{o.pricing?.currency || 'NGN'}</p>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <div className="text-sm text-foreground">{timeAgo(o.updatedAt)}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(o.updatedAt).toLocaleString()}</div>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => console.log('View', o._id)}>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => console.log('Timeline', o._id)}>View Timeline</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => console.log('Assign', o._id)}>Assign Driver</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => console.log('Cancel', o._id)} className="text-red-600 focus:text-red-600">Cancel Order</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                        Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                        <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>
                        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
