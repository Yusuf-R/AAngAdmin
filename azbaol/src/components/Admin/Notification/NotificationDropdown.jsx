'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { socketClient } from '@/lib/SocketClient';

export default function NotificationDropdown() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasUnread, setHasUnread] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Fetch top notifications
    const fetchTopNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await AdminUtils.getTopUnreadNotifications();
            if (result.success) {
                setNotifications(result.notifications);
                setUnreadCount(result.unreadCount);
                setHasUnread(result.hasUnread);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchTopNotifications();
    }, [fetchTopNotifications]);

    // Socket connection and real-time updates
    useEffect(() => {
        const connectSocket = async () => {
            try {
                if (!socketClient.isConnected) {
                    await socketClient.connect();
                }

                // Listen for new notifications
                socketClient.on('notification', (data) => {
                    console.log('New notification received:', data);
                    // Refresh the notification list
                    fetchTopNotifications();
                    // Show toast for new notification
                    toast.info(data.content?.title || 'New notification', {
                        description: data.content?.body,
                    });
                });
            } catch (error) {
                console.error('Socket connection error:', error);
            }
        };

        connectSocket();

        return () => {
            socketClient.off('notification');
        };
    }, [fetchTopNotifications]);

    // Mark notification as read
    const handleMarkAsRead = async (notificationId, e) => {
        e.stopPropagation();
        try {
            const result = await AdminUtils.markAsRead(notificationId);
            if (result.success) {
                await fetchTopNotifications();
            }
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            const result = await AdminUtils.markAllAsRead();
            if (result.success) {
                toast.success('All notifications marked as read');
                await fetchTopNotifications();
            }
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    // Delete notification
    const handleDelete = async (notificationId, e) => {
        e.stopPropagation();
        try {
            const result = await AdminUtils.deleteNotification(notificationId);
            if (result.success) {
                toast.success('Notification deleted');
                await fetchTopNotifications();
            }
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    // Navigate to notification detail or related page
    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (!notification.read?.status) {
            await handleMarkAsRead(notification._id, { stopPropagation: () => {} });
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
                    {hasUnread ? (
                        <BellDot className="h-5 w-5" />
                    ) : (
                        <Bell className="h-5 w-5" />
                    )}

                    {/* Indicator dot */}
                    <span
                        className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full ${
                            hasUnread
                                ? 'bg-red-500 animate-pulse'
                                : 'bg-green-500'
                        }`}
                    />

                    {/* Badge count */}
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BellRing className="h-4 w-4" />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
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
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground/40 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">
                            No notifications
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            You're all caught up!
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-96">
                        <div className="space-y-1 p-2">
                            {notifications.map((notification) => {
                                const meta = getNotificationMeta(notification);
                                const isUnread = !notification.read?.status;

                                return (
                                    <div
                                        key={notification._id}
                                        className={`
                                            relative rounded-lg p-3 cursor-pointer transition-all
                                            hover:bg-muted/50
                                            ${isUnread ? 'bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20' : ''}
                                        `}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {/* Unread indicator */}
                                        {isUnread && (
                                            <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
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
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${meta.color} flex-shrink-0`}
                                                    >
                                                        {notification.priority}
                                                    </Badge>
                                                </div>

                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                    {notification.content?.body}
                                                </p>

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