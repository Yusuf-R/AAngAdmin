'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketClient } from '@/lib/SocketClient';
import AdminUtils from '@/utils/AdminUtils';
import { toast } from 'sonner';

/**
 * Notification Context for managing real-time notifications across the admin panel
 * Provides centralized state management and socket connection
 */

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasUnread, setHasUnread] = useState(false);
    const [topNotifications, setTopNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Use refs to prevent stale closure issues
    const socketInitialized = useRef(false);
    const fetchInProgress = useRef(false);

    /**
     * Fetch unread count and top notifications
     */
    const fetchNotificationData = useCallback(async (showLoading = false) => {
        // Prevent concurrent fetches
        if (fetchInProgress.current) return;

        fetchInProgress.current = true;

        if (showLoading) {
            setIsLoading(true);
        }

        try {
            const result = await AdminUtils.getTopUnreadNotifications();

            if (result.success) {
                setUnreadCount(result.unreadCount || 0);
                setHasUnread(result.hasUnread || false);
                setTopNotifications(result.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notification data:', error);
        } finally {
            setIsLoading(false);
            fetchInProgress.current = false;
        }
    }, []);

    /**
     * Handle incoming notification from socket
     */
    const handleNewNotification = useCallback((data) => {
        console.log('📬 New notification received:', data);
        toast.success("New Notification received")

        // Increment unread count
        setUnreadCount(prev => prev + 1);
        setHasUnread(true);

        // Refresh notification data
        fetchNotificationData();

        // Show toast notification with priority-based styling
        const toastConfig = {
            description: data.content?.body,
            duration: 5000,
        };

        switch (data.priority) {
            case 'CRITICAL':
                toast.error(data.content?.title || 'Critical Notification', {
                    ...toastConfig,
                    duration: 10000, // Show critical longer
                });
                // Play sound for critical notifications
                playNotificationSound();
                break;
            case 'URGENT':
                toast.warning(data.content?.title || 'Urgent Notification', toastConfig);
                playNotificationSound();
                break;
            case 'HIGH':
                toast.info(data.content?.title || 'New Notification', toastConfig);
                break;
            default:
                toast(data.content?.title || 'New Notification', toastConfig);
        }
    }, [fetchNotificationData]);

    /**
     * Setup socket connection and listeners
     */
    useEffect(() => {
        // Prevent duplicate initialization
        if (socketInitialized.current) return;

        const setupSocket = async () => {
            try {
                // Connect to socket if not already connected
                if (!socketClient.isConnected) {
                    await socketClient.connect();
                    console.log('✅ Socket connected in NotificationProvider');
                }

                setIsConnected(true);

                // Listen for new notifications
                socketClient.on('notification', handleNewNotification);

                // Listen for notification updates (mark as read, delete, etc.)
                socketClient.on('notification:updated', () => {
                    fetchNotificationData();
                });

                // Listen for bulk updates (mark all as read)
                socketClient.on('notification:bulk-update', () => {
                    fetchNotificationData();
                });

                // Connection status listeners
                socketClient.on('disconnected', () => {
                    setIsConnected(false);
                    console.warn('⚠️ Socket disconnected');
                });

                socketClient.on('error', (error) => {
                    console.error('Socket error:', error);
                    setIsConnected(false);
                });

                socketInitialized.current = true;

            } catch (error) {
                console.error('Failed to setup socket:', error);
                setIsConnected(false);
            }
        };

        setupSocket();

        // Cleanup function
        return () => {
            if (socketInitialized.current) {
                socketClient.off('notification');
                socketClient.off('notification:updated');
                socketClient.off('notification:bulk-update');
                socketClient.off('disconnected');
                socketClient.off('error');
                socketInitialized.current = false;
            }
        };
    }, [handleNewNotification, fetchNotificationData]);

    /**
     * Initial data fetch
     */
    useEffect(() => {
        fetchNotificationData(true);
    }, [fetchNotificationData]);

    /**
     * Mark notification as read
     */
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const result = await AdminUtils.markAsRead(notificationId);
            if (result.success) {
                // Optimistic update
                setUnreadCount(prev => Math.max(0, prev - 1));
                setTopNotifications(prev =>
                    prev.map(n =>
                        n._id === notificationId
                            ? { ...n, read: { status: true, readAt: new Date() } }
                            : n
                    )
                );
                // Fetch fresh data
                fetchNotificationData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to mark as read:', error);
            toast.error('Failed to mark notification as read');
            return false;
        }
    }, [fetchNotificationData]);

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = useCallback(async () => {
        try {
            const result = await AdminUtils.markAllAsRead();
            if (result.success) {
                // Optimistic update
                setUnreadCount(0);
                setHasUnread(false);
                setTopNotifications(prev =>
                    prev.map(n => ({ ...n, read: { status: true, readAt: new Date() } }))
                );
                // Fetch fresh data
                fetchNotificationData();
                toast.success('All notifications marked as read');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Failed to mark all as read');
            return false;
        }
    }, [fetchNotificationData]);

    /**
     * Delete notification
     */
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            const result = await AdminUtils.deleteNotification(notificationId);
            if (result.success) {
                // Remove from local state
                setTopNotifications(prev => prev.filter(n => n._id !== notificationId));
                // Fetch fresh data to update count
                await fetchNotificationData();
                toast.success('Notification deleted');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification');
            return false;
        }
    }, [fetchNotificationData]);

    /**
     * Play notification sound (optional)
     */
    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(err => {
                // Silently fail if audio can't play (browser restrictions)
                console.debug('Audio play failed:', err);
            });
        } catch (error) {
            // Silently fail
        }
    }, []);

    /**
     * Force refresh notification data
     */
    const refresh = useCallback(() => {
        fetchNotificationData(true);
    }, [fetchNotificationData]);

    const value = {
        // State
        unreadCount,
        hasUnread,
        topNotifications,
        isConnected,
        isLoading,

        // Actions
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
        fetchNotificationData,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

/**
 * Hook to use notification context
 */
export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }

    return context;
}

export default NotificationContext;