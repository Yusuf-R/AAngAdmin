// =======================================
// ORDER DELETION MANAGER - COMPLETE
// components/Admin/System/OrderDeletionManager.jsx
// =======================================

'use client';

import React, {useState, useMemo, useEffect} from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import {Search, Trash2, AlertTriangle, Loader2, X, Package} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {Badge} from '@/components/ui/badge';
import {toast} from 'sonner';
import {socketClient} from '@/lib/SocketClient';
import AdminUtils from "@/utils/AdminUtils";

export default function OrderDeletionManager({initialOrders = [], onRefresh}) {
    const [orders, setOrders] = useState(initialOrders);
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletionTarget, setDeletionTarget] = useState(null);

    // Real-time updates listener
    useEffect(() => {
        const handleResourceDeleted = (data) => {
            if (data.type === 'orders') {
                setOrders(prev => prev.filter(o => !data.deletedIds.includes(o._id)));
                toast.info(`${data.deletedCount} order(s) deleted by ${data.deletedBy}`);
            }
        };

        socketClient.on('resource:deleted', handleResourceDeleted);

        return () => {
            socketClient.off('resource:deleted', handleResourceDeleted);
        };
    }, []);

    // Search across multiple fields
    const globalFilterFn = (row, columnId, filterValue) => {
        const search = filterValue.toLowerCase();
        const order = row.original;

        return (
            order.orderRef?.toLowerCase().includes(search) ||
            order._id?.toString().toLowerCase().includes(search) ||
            order.clientId?.toString().toLowerCase().includes(search) ||
            order.clientEmail?.toLowerCase().includes(search)
        );
    };

    const getStatusColor = (status) => {
        const colors = {
            delivered: 'bg-green-100 text-green-700 border-green-300',
            broadcast: 'bg-blue-100 text-blue-700 border-blue-300',
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            cancelled: 'bg-red-100 text-red-700 border-red-300',
            draft: 'bg-gray-100 text-gray-700 border-gray-300',
            assigned: 'bg-purple-100 text-purple-700 border-purple-300',
            confirmed: 'bg-indigo-100 text-indigo-700 border-indigo-300',
            picked_up: 'bg-cyan-100 text-cyan-700 border-cyan-300',
            in_transit: 'bg-teal-100 text-teal-700 border-teal-300',
            admin_review: 'bg-orange-100 text-orange-700 border-orange-300',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    const columns = useMemo(
        () => [
            {
                id: 'select',
                header: ({table}) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({row}) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableGlobalFilter: false,
            },
            {
                accessorKey: '_id',
                header: 'Order ID',
                cell: ({row}) => (
                    <span className="font-mono text-xs text-gray-600">
            {row.original._id?.toString().slice(-8)}
          </span>
                ),
            },
            {
                accessorKey: 'orderRef',
                header: 'Order Ref',
                cell: ({row}) => (
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400"/>
                        <span className="font-medium text-sm">{row.original.orderRef}</span>
                    </div>
                ),
            },
            {
                accessorKey: 'clientId',
                header: 'Client Info',
                cell: ({row}) => (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500 font-mono">
                            ID: {row.original.clientId}
                        </span>
                        {row.original.clientEmail && (
                            <span className="text-xs text-gray-700 font-medium">
                                {row.original.clientEmail}
                            </span>
                        )}
                    </div>
                )
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({row}) => {
                    const status = row.original.status;
                    return (
                        <Badge
                            variant="outline"
                            className={`capitalize text-xs ${getStatusColor(status)}`}
                        >
                            {status?.replace(/_/g, ' ')}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'pricing.totalAmount',
                header: 'Amount',
                cell: ({row}) => {
                    const amount = row.original.pricing?.totalAmount;
                    return amount ? (
                        <span className="font-medium text-sm">
              ₦{amount.toLocaleString()}
            </span>
                    ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                    );
                },
            },
            {
                accessorKey: 'createdAt',
                header: 'Created',
                cell: ({row}) => {
                    const date = row.original.createdAt;
                    if (!date) return <span className="text-gray-400 text-sm">N/A</span>;

                    const dateObj = new Date(date);
                    return (
                        <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium">
                {dateObj.toLocaleDateString()}
              </span>
                            <span className="text-xs text-gray-500">
                {dateObj.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </span>
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({row}) => (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSingle(row.original)}
                        className="gap-2 h-8 text-xs"
                    >
                        <Trash2 className="w-3 h-3"/>
                        Delete
                    </Button>
                ),
                enableSorting: false,
                enableGlobalFilter: false,
            },
        ],
        []
    );

    const table = useReactTable({
        data: orders,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        state: {
            rowSelection,
            sorting,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 100,
            },
        },
    });

    const selectedOrders = table.getFilteredSelectedRowModel().rows.map(row => row.original);

    const handleDeleteSingle = (order) => {
        setDeletionTarget({type: 'single', orders: [order]});
        setDeleteModalOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedOrders.length === 0) {
            toast.error('No orders selected');
            return;
        }
        setDeletionTarget({type: 'selected', orders: selectedOrders});
        setDeleteModalOpen(true);
    };

    const handleDeleteAll = () => {
        const allFiltered = table.getFilteredRowModel().rows.map(row => row.original);
        if (allFiltered.length === 0) {
            toast.error('No orders to delete');
            return;
        }
        setDeletionTarget({type: 'all', orders: allFiltered});
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deletionTarget) return;

        setIsDeleting(true);
        try {
            const orderIds = deletionTarget.orders.map(o => o._id);

            const response = await AdminUtils.systemDeleteOrder(orderIds);

            console.log({
                dt: "client orders",
                response
            })

            toast.success(`Successfully deleted`);

            // Optimistic update
            setOrders(prev => prev.filter(o => !orderIds.includes(o._id)));
            setRowSelection({});
            setDeleteModalOpen(false);
            setDeletionTarget(null);

            // Refresh from server
            if (onRefresh) {
                setTimeout(() => onRefresh(), 500);
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Failed to delete orders');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                    <Input
                        placeholder="Search by Order Ref, ID, Client ID, or Email..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {globalFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setGlobalFilter('')}
                        >
                            <X className="w-3 h-3"/>
                        </Button>
                    )}
                </div>

                <div className="flex gap-2 flex-wrap">
                    {selectedOrders.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            className="gap-2"
                        >
                            <Trash2 className="w-4 h-4"/>
                            Delete Selected ({selectedOrders.length})
                        </Button>
                    )}

                    {table.getFilteredRowModel().rows.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAll}
                            className="gap-2"
                        >
                            <AlertTriangle className="w-4 h-4"/>
                            Delete All Filtered
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-gray-600">
                <span>Total: <strong>{table.getFilteredRowModel().rows.length}</strong></span>
                <span>•</span>
                <span>Selected: <strong>{selectedOrders.length}</strong></span>
                <span>•</span>
                <span>Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of <strong>{table.getPageCount()}</strong></span>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={`transition-colors ${
                                        row.getIsSelected()
                                            ? 'bg-blue-50 hover:bg-blue-100'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3 text-sm">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="h-32 text-center text-gray-500"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Package className="w-12 h-12 text-gray-300"/>
                                        <p className="font-medium">No orders found</p>
                                        {globalFilter && (
                                            <p className="text-sm">Try adjusting your search</p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-gray-500">
                    Showing <strong>{table.getRowModel().rows.length}</strong> of{' '}
                    <strong>{table.getFilteredRowModel().rows.length}</strong> order(s)
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5"/>
                            Confirm Irreversible Deletion
                        </DialogTitle>
                        <div className="space-y-3 pt-4 text-sm text-muted-foreground">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="font-semibold text-red-900">
                                    You are about to permanently delete{' '}
                                    <span
                                        className="text-red-700"> {deletionTarget?.orders.length || 0} order(s)
                                    </span>
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-2">
                                    This action is <strong className="text-red-600">IRREVERSIBLE</strong>.
                                    All associated data will be permanently erased:
                                </p>
                                <ul className="text-sm list-disc list-inside space-y-1.5 ml-2 text-gray-700">
                                    <li>Order details and tracking history</li>
                                    <li>Package images and videos from S3</li>
                                    <li>Payment and transaction records</li>
                                    <li>Driver assignment and delivery data</li>
                                    <li>Delivery confirmations and tokens</li>
                                    <li>Customer communication logs</li>
                                </ul>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-yellow-900">
                                    ⚠️ This data cannot be recovered. Consider exporting or archiving before deletion.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setDeletionTarget(null);
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={executeDelete}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin"/>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4"/>
                                    Yes, Delete Permanently
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}