'use client';
import {axiosPublic, axiosPrivate} from "@/utils/AxiosInstance"

class AdminUtils {
    static async adminData() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/admin/profile',
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async createUser(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/admin/users/create',
                data: obj,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async allUser(params) {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/admin/users/all',
                params: params,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async updateUserBasicInfo(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/admin/users/update/basic-info',
                data: obj,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }
    }

    static async updateUserLocations(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/admin/users/update/location',
                data: obj,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }
    }

    static async deleteUserLocation(obj) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: '/admin/users/delete/location',
                data: obj,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }
    }

    static async deleteAllUserLocation(obj) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: '/admin/users/delete/location/all',
                data: obj,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }
    }

    static async addUserLocation(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/admin/users/update/location/new',
                data: obj,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }
    }

    static async updateAdminRole(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/admin/users/update/role',
                data: obj,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }
    }

    static async getOrders(params) {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/admin/orders',
                params: params,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }

    }

    static async adminReviewOrder(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/admin/orders/admin_review',
                data: obj,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }

    }

    static async reverseAdminDecision(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/admin/orders/admin_reversal',
                data: obj,
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }
    }

    static async orderAssignment(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/admin/orders/assignment',
                data: obj,
            });
            return response.data;
        } catch (e) {

        }
    }

    // Add these methods to your AdminUtils class
    static async getUserSessions() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/admin/system/session',
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }

    }

    /**
     * Cleanup sessions for a specific user
     * @param {string} userId - User ID
     * @param {string} strategy - 'keep-recent-5', 'remove-stale', 'delete-all'
     */
    static async cleanupUserSessions(userId, strategy) {
        const payload = {userId, strategy}
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/admin/system/session/user/cleanup',
                data: payload
            });
            return response.data;
        } catch (err) {
            console.log({err});
            throw new Error(err);
        }
    }

    /**
     * Bulk cleanup sessions for multiple users
     * @param {string} strategy - 'cleanup-all-excess' or 'cleanup-all-stale'
     */
    static async bulkCleanupSessions(strategy) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/admin/system/session/cleanup/bulk',
                data: strategy
            });
            return response.data;
        } catch (error) {
            console.error('Bulk cleanup error:', error);
            throw error;
        }
    }

    /**
     * Delete a specific session token
     * @param {string} userId - User ID
     * @param {string} tokenId - Session token ID
     */
    static async deleteSpecificSession(userId, tokenId) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: '/admin/system/session/user/delete',
                data: {
                    userId,
                    tokenId
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delete session error:', error);
            throw error;
        }
    }

    /**
     * Get session statistics
     */
    static async getSessionStatistics() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/admin/system/session/statistics',
            });
            return response.data;
        } catch (error) {
            console.error('Get statistics error:', error);
            throw error;
        }
    }

    /**
     * Get detailed session info for a user
     * @param {string} userId - User ID
     */
    static async getUserSessionDetails(userId) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/admin/system/session/user/details',
            })
            return response.data;
        } catch (error) {
            console.error('Get session details error:', error);
            throw error;
        }
    }

    // In AdminUtils.js
    static async adminActions(payload) {
        const actions = payload.actions
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: `/admin/users/update/status/${actions}`,
                data: payload,
            })
            return response.data;
        } catch (error) {
            console.error('Admin actions error:', error);
            throw error;
        }
    }


    static async getUsersForDeletion(params) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/admin/system/resources/get/users',
                params: params,
            })
            return response.data;
        } catch (error) {
            console.log('Get session details error:', error);
            throw error;
        }
    }

    static async getOrdersForDeletion(params) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/admin/system/resources/get/orders',
                params: params,
            })
            return response.data;
        } catch (error) {
            console.log('Get session details error:', error);
            throw error;
        }
    }

    static async getClientOrders(params = {}, clientId) {
        try {
            const queryParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });

            const response = await axiosPrivate({
                method: 'GET',
                url: `/admin/users/view/orders/${clientId}?${queryParams.toString()}`
            });

            return response.data;
        } catch (error) {
            console.error('Get client orders error:', error);
            throw error;
        }
    }

    static async systemDeleteUser(payload) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: '/admin/system/resources/delete/users',
                data: payload
            })
            return response.data;
        } catch (error) {
            console.log('Get session details error:', error);
            throw error;
        }
    }

    static async systemDeleteOrder(payload) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: '/admin/system/resources/delete/orders',
                data: payload
            })
            return response.data;
        } catch (error) {
            console.log('Get session details error:', error);
            throw error;
        }

    }

    // Data validation
    static async adminReviewDriverVerification(payload) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/admin/users/update/verification',
                data: payload
            })
            return response.data;
        } catch (error) {
            console.log('Get session details error:', error);
            throw error;
        }
    }

    /**
     * Fetch admin notifications with filters
     */
    static async getNotifications(filters = {}) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/admin/notifications/get',
                params: filters
            });
            return response.data;
        } catch (error) {
            console.error('Get notifications error:', error);
            throw error;
        }
    }

    /**
     * Get top 5 unread notifications for navbar
     */
    static async getTopUnreadNotifications() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/admin/notifications/top`,
            });

            return response.data;
        } catch (error) {
            console.error('Get top unread notifications error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: `/admin/notifications/read`,
                data: notificationId
            });

            return response.data;
        } catch (error) {
            console.error('Read notifications error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(category = null) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: `/admin/notifications/read/all`,
                data: category
            });

            return response.data;
        } catch (error) {
            console.error('Mark all-as read notifications error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Soft delete notification
     */
    static async deleteNotification(notificationId) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: `/admin/notifications/delete`,
                data: notificationId
            });

            return response.data;
        } catch (error) {
            console.error('Delete notifications error:', error);
            return {success: false, error: error.message};
        }
    }

    static async restoreNotification(notificationId) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: `/admin/notifications/restore`,
                data: notificationId
            });

            return response.data;
        } catch (error) {
            console.error('Delete notifications error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Delete all notifications (soft delete)
     */
    static async deleteAllNotifications() {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: `/admin/notifications/delete/all`,
            });

            return response.data;
        } catch (error) {
            console.error('Delete all notifications error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Permanently delete notifications (admin only)
     */
    static async permanentlyDeleteNotifications(notificationIds = [], deleteAll = false) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: `/admin/notifications/delete/permanent`,
                data: {
                    notificationIds, deleteAll
                }
            });

            return response.data;
        } catch (error) {
            console.error('Permanent Delete notifications error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Get notification statistics
     */
    static async getStatistics() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/admin/notifications/statistics`,
            });

            return response.data;
        } catch (error) {
            console.error('Get statistics notifications error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Create notification for a user (admin action)
     */
    static async createNotificationForUser(payload) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/admin/notifications/create`,
                data: payload
            });

            return response.data;
        } catch (error) {
            console.error('Create notifications error:', error);
            return {success: false, error: error.message};
        }

    }

    /**
     * Format notification time for display
     */
    static formatTime(date) {
        const now = new Date();
        const d = new Date(date);
        const diffMin = Math.floor((now - d) / (1000 * 60));

        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
        if (diffMin < 10080) return `${Math.floor(diffMin / 1440)}d ago`;

        return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    }

    /**
     * Get notification icon and color based on category and type
     */
    static getNotificationMeta(notification) {
        const {category, priority, type} = notification;

        const priorityColors = {
            CRITICAL: 'text-red-600 bg-red-50 dark:bg-red-500/10',
            URGENT: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10',
            HIGH: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10',
            NORMAL: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
            LOW: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10'
        };

        const categoryIcons = {
            ORDER: '📦',
            DELIVERY: '🚚',
            SECURITY: '🔒',
            IDENTITY: '👤',
            SYSTEM: '⚙️',
            PAYMENT: '💳',
            SOCIAL: '💬',
            PROMOTION: '🎉'
        };

        return {
            icon: categoryIcons[category] || '📬',
            color: priorityColors[priority] || priorityColors.NORMAL,
            priority
        };
    }

    // Chat

    // get all the chat conversation
    static async getConversations(params) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/admin/support/chat`,
                params: params
            });

            return response.data;
        } catch (error) {
            console.error('Get conversation error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Search users
     */
    static async searchUsers(params) {
        console.log(params);
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/admin/support/chat/search`,
                params: { params }
            });

            return response.data;
        } catch (error) {
            console.error('Search user error:', error);
            return {success: false, error: error.message};
        }
    }


    static async getMessages(id) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/admin/support/chat/message/get`,
                params: { id }
            });

            return response.data;
        } catch (error) {
            console.error('Get message error:', error);
            return {success: false, error: error.message};
        }
    }

    static async sendMessage(conversationId, messageData) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/admin/support/chat/message/send`,
                data: {
                    conversationId,
                    messageData
                }
            });

            return response.data;
        } catch (error) {
            console.error('Send message error:', error);
            return {success: false, error: error.message};
        }
    }

    static async markChatAsRead(conversationId, lastReadSeq) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/admin/support/chat/message/read`,
                data: {
                    conversationId,
                    lastReadSeq
                }
            });

            return response.data;
        } catch (error) {
            console.error('mark chat as read error:', error);
            return {success: false, error: error.message};
        }
    }

    static async togglePin(conversationId) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/admin/support/chat/toggle-pin`,
                data: {conversationId}
            });

            return response.data;
        } catch (error) {
            console.error('Toogel pin erro:', error);
            return {success: false, error: error.message};
        }
    }

    static async deleteConversation(conversationId) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: `/admin/support/chat/delete`,
                data: {conversationId}
            });

            return response.data;
        } catch (error) {
            console.error('Delete conversation error:', error);
            return {success: false, error: error.message};
        }
    }

    static async deleteFromHistory(conversationId) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: `/admin/support/chat/history/delete`,
                data: { conversationId }
            });

            return response.data;
        } catch (error) {
            console.error('Delete from history', error);
            return {success: false, error: error.message};
        }
    }

    static async createConversation(targetUserId, targetRole, orderId = null) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/admin/support/chat/create`,
                data: {
                    targetUserId,
                    targetRole,
                    orderId,
                }
            });
            return response.data;
        } catch (error) {
            console.error('Creat conversation error:', error);
            return {success: false, error: error.message};
        }
    }

    static async getOrCreateConversation(targetUserId, orderId = null) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/admin/support/chat/get-or-create`,
                data: {
                    targetUserId,
                    orderId,
                }
            });
            return response.data;
        } catch (error) {
            console.error('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

}

export default AdminUtils;