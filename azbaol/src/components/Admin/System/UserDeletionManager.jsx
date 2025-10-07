import React, {useState, useMemo} from 'react';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Search,
    X,
    Trash2,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
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
import {toast} from 'sonner';
import AdminUtils from "@/utils/AdminUtils";

export default function UserDeletionManager({initialUsers = [], onRefresh}) {
    const [users, setUsers] = useState(initialUsers);
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletionTarget, setDeletionTarget] = useState(null);

    // Search across multiple fields
    const globalFilterFn = (row, columnId, filterValue) => {
        const search = filterValue.toLowerCase();
        const user = row.original;

        return (
            user.email?.toLowerCase().includes(search) ||
            user._id?.toString().toLowerCase().includes(search) ||
            user.fullName?.toLowerCase().includes(search)
        );
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
                header: 'User ID',
                cell: ({row}) => (
                    <span className="font-mono text-xs">{row.original._id}</span>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({row}) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.email}</span>
                        {row.original.fullName && (
                            <span className="text-xs text-gray-500">{row.original.fullName}</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'role',
                header: 'Role',
                cell: ({row}) => (
                    <Badge variant="outline" className="capitalize">
                        {row.original.role}
                    </Badge>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({row}) => {
                    const status = row.original.status;
                    const variant = status === 'Active' ? 'default' : 'secondary';
                    return (
                        <Badge variant={variant} className="capitalize">
                            {status}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'createdAt',
                header: 'Created',
                cell: ({row}) => {
                    const date = row.original.createdAt;
                    return date ? new Date(date).toLocaleDateString() : 'N/A';
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
                        className="gap-2"
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
        data: users,
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

    const selectedUsers = table.getFilteredSelectedRowModel().rows.map(row => row.original);

    const handleDeleteSingle = (user) => {
        setDeletionTarget({type: 'single', users: [user]});
        setDeleteModalOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedUsers.length === 0) {
            toast.error('No users selected');
            return;
        }
        setDeletionTarget({type: 'selected', users: selectedUsers});
        setDeleteModalOpen(true);
    };

    const handleDeleteAll = () => {
        const allFiltered = table.getFilteredRowModel().rows.map(row => row.original);
        if (allFiltered.length === 0) {
            toast.error('No users to delete');
            return;
        }
        setDeletionTarget({type: 'all', users: allFiltered});
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deletionTarget) return;

        setIsDeleting(true);
        try {
            const userIds = deletionTarget.users.map(u => u._id);

            // Call your API endpoint
            await AdminUtils.systemDeleteUser(userIds);

            toast.success(`Successfully deleted`);

            // Remove deleted users from local state
            setUsers(prev => prev.filter(u => !userIds.includes(u._id)));
            setRowSelection({});
            setDeleteModalOpen(false);

            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error(error.message || 'Failed to delete users');
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
                        placeholder="Search by email, ID, or name..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10"
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

                <div className="flex gap-2">
                    {selectedUsers.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            className="gap-2"
                        >
                            <Trash2 className="w-4 h-4"/>
                            Delete Selected ({selectedUsers.length})
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
                <span>Total: {table.getFilteredRowModel().rows.length}</span>
                <span>•</span>
                <span>Selected: {selectedUsers.length}</span>
                <span>•</span>
                <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id}
                                        className="px-4 py-3 text-left text-sm font-medium text-gray-700">
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
                        <tbody className="bg-white divide-y">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={row.getIsSelected() ? 'bg-blue-50' : 'hover:bg-gray-50'}
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
                                    className="h-24 text-center text-gray-500"
                                >
                                    No users found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Showing {table.getRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} user(s)
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5"/>
                            Confirm Irreversible Deletion
                        </DialogTitle>
                        <div className="space-y-3 pt-4 text-sm text-muted-foreground">
                            <p className="font-semibold">
                                You are about to permanently delete{' '}
                                {deletionTarget?.users.length || 0} user(s).
                            </p>
                            <p className="text-sm">
                                This action is <strong>IRREVERSIBLE</strong>. All associated data including:
                            </p>
                            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                                <li>User profile and authentication data</li>
                                <li>Order history and transactions</li>
                                <li>Saved locations and preferences</li>
                                <li>Session tokens and device info</li>
                            </ul>
                            <p className="text-sm font-semibold text-red-600">
                                will be permanently erased and cannot be recovered.
                            </p>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
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