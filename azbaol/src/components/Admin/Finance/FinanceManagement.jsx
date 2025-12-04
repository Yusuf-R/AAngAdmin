'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    DollarSign, TrendingUp, TrendingDown, ArrowUpDown, Search, RefreshCw,
    XCircle, Download, Filter, Calendar, Wallet, CreditCard, Users,
    Package, ChevronDown, Eye, AlertCircle, CheckCircle2, Clock,
    ArrowRight, MoreVertical, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRouter } from 'next/navigation';
import AdminUtils from "@/utils/AdminUtils";

const transactionTypeMeta = {
    client_payment: {
        label: 'Client Payment',
        icon: CreditCard,
        color: 'text-blue-600',
        bg: 'bg-blue-100 dark:bg-blue-500/20',
        chip: 'bg-blue-500/10 text-blue-600'
    },
    wallet_deposit: {
        label: 'Wallet Deposit',
        icon: Wallet,
        color: 'text-purple-600',
        bg: 'bg-purple-100 dark:bg-purple-500/20',
        chip: 'bg-purple-500/10 text-purple-600'
    },
    driver_earning: {
        label: 'Driver Earning',
        icon: Users,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100 dark:bg-emerald-500/20',
        chip: 'bg-emerald-500/10 text-emerald-600'
    },
    driver_payout: {
        label: 'Driver Payout',
        icon: ArrowRight,
        color: 'text-amber-600',
        bg: 'bg-amber-100 dark:bg-amber-500/20',
        chip: 'bg-amber-500/10 text-amber-600'
    },
    platform_revenue: {
        label: 'Platform Revenue',
        icon: TrendingUp,
        color: 'text-green-600',
        bg: 'bg-green-100 dark:bg-green-500/20',
        chip: 'bg-green-500/10 text-green-600'
    },
    refund: {
        label: 'Refund',
        icon: TrendingDown,
        color: 'text-red-600',
        bg: 'bg-red-100 dark:bg-red-500/20',
        chip: 'bg-red-500/10 text-red-600'
    }
};

const statusMeta = {
    completed: { label: 'Completed', icon: CheckCircle2, chip: 'bg-emerald-500/10 text-emerald-600' },
    pending: { label: 'Pending', icon: Clock, chip: 'bg-blue-500/10 text-blue-600' },
    processing: { label: 'Processing', icon: RefreshCw, chip: 'bg-purple-500/10 text-purple-600' },
    failed: { label: 'Failed', icon: XCircle, chip: 'bg-red-500/10 text-red-600' },
    reversed: { label: 'Reversed', icon: AlertCircle, chip: 'bg-amber-500/10 text-amber-600' }
};

function formatCurrency(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0
    }).format(amount);
}

function timeAgo(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMin = Math.floor((now - d) / (1000 * 60));
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
}

function FinancialStats({ stats }) {
    const StatCard = ({ icon: Icon, label, value, trend, chipClass, subtitle }) => (
        <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${chipClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">{trend}</span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-3xl font-bold mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={DollarSign}
                label="Total Volume"
                value={formatCurrency(stats.overview?.totalVolume || 0)}
                subtitle={`${stats.overview?.totalTransactions || 0} transactions`}
                chipClass="bg-blue-100 dark:bg-blue-500/20 text-blue-600"
            />
            <StatCard
                icon={TrendingUp}
                label="Platform Revenue"
                value={formatCurrency(stats.platformRevenue || 0)}
                chipClass="bg-green-100 dark:bg-green-500/20 text-green-600"
            />
            <StatCard
                icon={CreditCard}
                label="Client Payments"
                value={formatCurrency(stats.clientPayments?.total || 0)}
                subtitle={`${stats.clientPayments?.count || 0} payments`}
                chipClass="bg-purple-100 dark:bg-purple-500/20 text-purple-600"
            />
            {/*<StatCard*/}
            {/*    icon={Users}*/}
            {/*    label="Driver Earnings"*/}
            {/*    value={formatCurrency(stats.driverEarnings?.total || 0)}*/}
            {/*    subtitle={`${stats.driverPayout?.count || 0} payouts`}*/}
            {/*    chipClass="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"*/}
            {/*/>*/}
            <StatCard
                icon={Users}
                label="Driver Payout"
                value={formatCurrency(stats.driverPayout?.total || 0)}
                subtitle={`${stats.driverPayout?.count || 0} payouts`}
                chipClass="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"
            />
        </div>
    );
}

function FinancialCharts({ data, stats }) {
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Process data for charts
    const typeData = Object.entries(stats.byType || {}).map(([type, data]) => ({
        name: transactionTypeMeta[type]?.label || type,
        value: data.amount,
        count: data.count
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-4">Transaction Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={typeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {typeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-4">Transaction Volume by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typeData} margin={{ left: 20, }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function TransactionActions({ transaction, onAction }) {
    const router = useRouter();
    const meta = transactionTypeMeta[transaction.transactionType] || {};
    const Icon = meta.icon || FileText;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => router.push(`/admin/finance/view/${transaction._id}`)}
                    className="gap-2"
                >
                    <Eye className="w-4 h-4" />
                    View Details
                </DropdownMenuItem>
                {transaction.orderId && (
                    <DropdownMenuItem
                        onClick={() => router.push(`/admin/orders/view/${transaction.orderId}`)}
                        className="gap-2"
                    >
                        <Package className="w-4 h-4" />
                        View Order
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Receipt
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function createColumns(onAction) {
    return [
        {
            id: 'transaction',
            header: 'Transaction',
            cell: ({ row }) => {
                const tx = row.original;
                const meta = transactionTypeMeta[tx.transactionType] || {};
                const Icon = meta.icon || FileText;

                return (
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${meta.bg}`}>
                            <Icon className={`w-5 h-5 ${meta.color}`} />
                        </div>
                        <div>
                            <p className="font-medium">{meta.label}</p>
                            <p className="text-sm text-muted-foreground">
                                {tx.gateway?.reference || tx._id.slice(-8)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {tx.metadata?.description || 'No description'}
                            </p>
                        </div>
                    </div>
                );
            }
        },
        {
            id: 'parties',
            header: 'Parties',
            cell: ({ row }) => {
                const tx = row.original;
                return (
                    <div className="text-sm space-y-1">
                        {tx.clientInfo && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Client</Badge>
                                <span>{tx.clientInfo.name || 'Unknown'}</span>
                            </div>
                        )}
                        {tx.driverInfo && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Driver</Badge>
                                <span>{tx.driverInfo.name || 'Unknown'}</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'amount',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="h-8 px-2"
                >
                    Amount <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const tx = row.original;
                return (
                    <div className="text-right">
                        <p className="font-semibold">
                            {formatCurrency(tx.amount.gross, tx.amount.currency)}
                        </p>
                        {tx.amount.fees > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Fee: {formatCurrency(tx.amount.fees)}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Net: {formatCurrency(tx.amount.net)}
                        </p>
                    </div>
                );
            }
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const tx = row.original;
                const meta = statusMeta[tx.status] || statusMeta.pending;
                const Icon = meta.icon;

                return (
                    <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <Badge className={meta.chip}>{meta.label}</Badge>
                    </div>
                );
            }
        },
        {
            id: 'date',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="h-8 px-2"
                >
                    Date <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const tx = row.original;
                return (
                    <div className="text-sm">
                        <p>{timeAgo(tx.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <TransactionActions transaction={row.original} onAction={onAction} />
            )
        }
    ];
}

export default function FinanceManagement({ initialTransactionData, totalStatistics, pagination: initialPagination }) {
    const [data, setData] = useState(initialTransactionData || []);
    const [stats, setStats] = useState(totalStatistics || {});
    const [pagination, setPagination] = useState(initialPagination || {});
    const [isLoading, setIsLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [serverFilters, setServerFilters] = useState({
        search: '',
        transactionType: '',
        status: '',
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const handleAction = useCallback((txId, action) => {
        console.log('Action:', action, 'TX:', txId);
    }, []);

    const columns = useMemo(() => createColumns(handleAction), [handleAction]);

    const fetchTransactions = useCallback(async (filters) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const result = await AdminUtils.getFinancialTransactions(params);

            if (result.success) {
                setData(result.data.initialTransactionData);
                setStats(result.data.totalStatistics);
                setPagination(result.data.pagination);
            }
        } catch (error) {
            console.log('Failed to fetch transactions:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions(serverFilters);
    }, [fetchTransactions, serverFilters]);

    const handleSearch = () => {
        setActiveSearch(searchInput);
        setServerFilters(prev => ({ ...prev, search: searchInput.trim(), page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setActiveSearch('');
        setServerFilters(prev => ({ ...prev, search: '', page: 1 }));
    };

    const table = useReactTable({
        data,
        columns,
        manualPagination: true,
        manualSorting: true,
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

    return (
        <div className="p-2 space-y-6">
            {/* Header */}
            <div className="bg-card rounded-2xl border p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold">Financial Management</h1>
                                <p className="text-lg text-muted-foreground mt-1">
                                    Comprehensive financial tracking and analytics
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" /> Export
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                    </div>
                </div>

                <FinancialStats stats={stats} />
            </div>

            {/* Charts */}
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Financial Analytics</h2>
                <FinancialCharts data={data} stats={stats} />
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search transactions..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10 max-w-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={isLoading}>
                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                            {activeSearch && (
                                <Button onClick={handleClearSearch} variant="outline" size="sm">
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Select
                            value={serverFilters.transactionType}
                            onValueChange={(value) => setServerFilters(prev => ({ ...prev, transactionType: value, page: 1 }))}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Transaction Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>All Types</SelectItem>
                                {Object.entries(transactionTypeMeta).map(([key, meta]) => (
                                    <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={serverFilters.status}
                            onValueChange={(value) => setServerFilters(prev => ({ ...prev, status: value, page: 1 }))}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>All Status</SelectItem>
                                {Object.entries(statusMeta).map(([key, meta]) => (
                                    <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border shadow-sm">
                <div className="rounded-md border relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    )}
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="px-6 py-4">
                                            {header.isPlaceholder ? null : flexRender(
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
                                    <TableRow key={row.id} className="hover:bg-muted/50">
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="px-6 py-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Showing {pagination.totalResults || 0} results
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage() || isLoading}
                        >
                            Previous
                        </Button>
                        <div className="text-sm">
                            Page {serverFilters.page} of {pagination.totalPages || 1}
                        </div>
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
    );
}