'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, BellDot, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminUtils from '@/utils/AdminUtils';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function NotificationDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Use Zustand store instead of useState and Context
    const {
        topNotifications,
        adminActionCount,
        hasAdminActions,
        isLoading,
        fetchNotificationData,
        markAsRead,
        deleteNotification,
        markAllAsRead
    } = useNotificationStore();

    // Fetch top notifications on mount
    useEffect(() => {
        fetchNotificationData(true); // true = showLoading
    }, [fetchNotificationData]);

    // Mark notification as read
    const handleMarkAsRead = async (notificationId, e) => {
        e?.stopPropagation();
        try {
            await markAsRead(notificationId);
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    // Delete notification
    const handleDelete = async (notificationId, e) => {
        e?.stopPropagation();
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    // Navigate to notification detail or related page
    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (!notification.read?.status) {
            await handleMarkAsRead(notification._id);
        }

        // Navigate based on notification type
        const actionButtons = notification.content?.richContent?.actionButtons || [];
        if (actionButtons.length > 0 && actionButtons[0].deepLink) {
            router.push(actionButtons[0].deepLink);
        } else {
            // Default: go to notifications page
            router.push('/admin/notifications');
        }

        setIsOpen(false);
    };

    // Navigate to full notifications page
    const handleViewAll = () => {
        router.push('/admin/notifications');
        setIsOpen(false);
    };

    const getNotificationMeta = (notification) => {
        return AdminUtils.getNotificationMeta(notification);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                >
                    {hasAdminActions ? (
                        <BellDot className="h-5 w-5" />
                    ) : (
                        <Bell className="h-5 w-5" />
                    )}

                    {/* Indicator dot - shows red only for admin actions */}
                    <span
                        className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full ${
                            hasAdminActions
                                ? 'bg-red-500 animate-pulse'
                                : 'bg-green-500'
                        }`}
                    />

                    {/* Badge count - shows admin action count only */}
                    {adminActionCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {adminActionCount > 99 ? '99+' : adminActionCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BellRing className="h-4 w-4" />
                        <span>Admin Actions</span>
                        {adminActionCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {adminActionCount} pending
                            </Badge>
                        )}
                    </div>
                    {adminActionCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="h-7 text-xs"
                        >
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : topNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground/40 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">
                            No pending actions
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            You're all caught up!
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-96">
                        <div className="space-y-1 p-2">
                            {topNotifications.map((notification) => {
                                const meta = getNotificationMeta(notification);
                                const isUnread = !notification.read?.status;
                                const requiresAdminAction = notification.adminAction?.required;

                                return (
                                    <div
                                        key={notification._id}
                                        className={`
                                            relative rounded-lg p-3 cursor-pointer transition-all
                                            hover:bg-muted/50
                                            ${isUnread ? 'bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20' : ''}
                                            ${requiresAdminAction ? 'border-l-4 border-l-amber-400' : ''}
                                        `}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {/* Unread indicator */}
                                        {isUnread && (
                                            <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                        )}

                                        {/* Admin action indicator */}
                                        {requiresAdminAction && (
                                            <div className="absolute top-3 left-3 h-2 w-2 rounded-full bg-amber-500" />
                                        )}

                                        <div className="flex gap-3">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl ${meta.color}`}>
                                                {meta.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                                                        {notification.content?.title}
                                                    </p>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {requiresAdminAction && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                                                            >
                                                                Action
                                                            </Badge>
                                                        )}
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-xs ${meta.color}`}
                                                        >
                                                            {notification.priority}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                    {notification.content?.body}
                                                </p>

                                                {notification.adminAction && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs capitalize"
                                                        >
                                                            {notification.adminAction.actionType?.toLowerCase()}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {notification.adminAction.status}
                                                        </Badge>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">
                                                        {AdminUtils.formatTime(notification.createdAt)}
                                                    </span>

                                                    {/* Action buttons */}
                                                    <div className="flex items-center gap-1">
                                                        {isUnread && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                            >
                                                                <Check className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                                            onClick={(e) => handleDelete(notification._id, e)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={handleViewAll}
                    className="cursor-pointer justify-center font-medium"
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All Notifications
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}