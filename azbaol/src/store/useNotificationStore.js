// stores/useNotificationStore.js
import { create } from 'zustand';
import { socketClient } from '@/lib/SocketClient';
import AdminUtils from '@/utils/AdminUtils';
import { toast } from 'sonner';

export const useNotificationStore = create((set, get) => ({
    unreadCount: 0,
    adminActionCount: 0,
    hasUnread: false,
    hasAdminActions: false,
    topNotifications: [],
    isConnected: false,
    isLoading: false,

    // Actions (replace your useCallbacks)
    fetchNotificationData: async (showLoading = false, adminActionOnly = true) => {
        const state = get();

        if (state.isLoading) return;

        if (showLoading) {
            set({ isLoading: true });
        }

        try {
            const result = await AdminUtils.getTopUnreadNotifications({
                adminActionOnly
            });

            if (result.success) {
                set({
                    unreadCount: result.unreadCount,
                    adminActionCount: result.adminActionCount,
                    hasUnread: result.hasUnread,
                    hasAdminActions: result.hasAdminActions,
                    topNotifications: result.notifications || [],
                    isLoading: false
                });
            }
        } catch (error) {
            console.error('Failed to fetch notification data:', error);
            set({ isLoading: false });
        }
    },

    handleNewNotification: (data) => {
        const state = get();

        console.log('📬 New notification received:', data);

        // Only process if it requires admin action (for our indicators)
        if (data.adminAction?.required) {
            set({
                adminActionCount: state.adminActionCount + 1,
                hasAdminActions: true
            });

            // Show toast for admin actions
            const toastConfig = {
                description: data.content?.body,
                duration: 5000,
            };

            switch (data.priority) {
                case 'CRITICAL':
                    toast.error(data.content?.title || 'Critical Action Required', {
                        ...toastConfig,
                        duration: 10000,
                    });
                    get().playNotificationSound();
                    break;
                case 'URGENT':
                    toast.warning(data.content?.title || 'Urgent Action Required', toastConfig);
                    get().playNotificationSound();
                    break;
                case 'HIGH':
                    toast.info(data.content?.title || 'Action Required', toastConfig);
                    break;
                default:
                    toast(data.content?.title || 'Admin Action Required', toastConfig);
            }
        }

        // Refresh to get updated counts and notifications
        state.fetchNotificationData();
    },

    markAsRead: async (notificationId) => {
        try {
            const result = await AdminUtils.markAsRead(notificationId);
            if (result.success) {
                // Refresh all data to get updated counts
                get().fetchNotificationData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to mark as read:', error);
            toast.error('Failed to mark notification as read');
            return false;
        }
    },

    markAllAsRead: async () => {
        try {
            const result = await AdminUtils.markAllAsRead();
            if (result.success) {
                get().fetchNotificationData();
                toast.success('All notifications marked as read');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Failed to mark all as read');
            return false;
        }
    },

    deleteNotification: async (notificationId) => {
        try {
            const result = await AdminUtils.deleteNotification(notificationId);
            if (result.success) {
                await get().fetchNotificationData();
                toast.success('Notification deleted');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification');
            return false;
        }
    },

    playNotificationSound: () => {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(err => {
                console.debug('Audio play failed:', err);
            });
        } catch (error) {
            // Silently fail
        }
    },

    refresh: () => {
        get().fetchNotificationData(true);
    },

    // Socket connection management (same as before)
    setupSocketListeners: () => {
        const { handleNewNotification, fetchNotificationData } = get();

        socketClient.on('notification', handleNewNotification);
        socketClient.on('notification:updated', () => {
            fetchNotificationData();
        });
        socketClient.on('notification:bulk-update', () => {
            fetchNotificationData();
        });

        socketClient.on('disconnected', () => {
            set({ isConnected: false });
        });

        socketClient.on('error', (error) => {
            console.error('Socket error:', error);
            set({ isConnected: false });
        });
    },

    initializeSocket: async () => {
        try {
            if (!socketClient.isConnected) {
                await socketClient.connect();
            }

            set({ isConnected: true });
            get().setupSocketListeners();

        } catch (error) {
            console.error('Failed to setup socket:', error);
            set({ isConnected: false });
        }
    }
}));