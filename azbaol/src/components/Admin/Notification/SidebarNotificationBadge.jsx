'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import AdminUtils from '@/utils/AdminUtils';
import { socketClient } from '@/lib/SocketClient';

/**
 * Real-time notification badge for sidebar
 * Shows count of unread notifications
 */
export default function SidebarNotificationBadge() {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const result = await AdminUtils.getTopUnreadNotifications();
            if (result.success) {
                setUnreadCount(result.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();

        // Setup socket listener
        const setupSocket = async () => {
            try {
                if (!socketClient.isConnected) {
                    await socketClient.connect();
                }

                socketClient.on('notification', () => {
                    fetchUnreadCount();
                });
            } catch (error) {
                console.error('Socket setup error:', error);
            }
        };

        setupSocket();

        return () => {
            socketClient.off('notification');
        };
    }, [fetchUnreadCount]);

    if (unreadCount === 0) return null;

    return (
        <Badge
            variant="destructive"
            className="ml-auto animate-pulse"
        >
            {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
    );
}