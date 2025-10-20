import Notification from '../models/Notification';

class NotificationService {

    // ==================== USER-SPECIFIC METHODS ====================

    /**
     * Fetch user notifications with optional filters
     */
    static async getUserNotifications(userId, options = {}) {
        const {
            limit = 20,
            offset = 0,
            category = null,
            priority = null,
            unreadOnly = false
        } = options;

        const query = {
            userId,
            'deleted.status': false
        };

        if (category) query.category = category;
        if (priority) query.priority = priority;
        if (unreadOnly) query['read.status'] = false;

        return Notification.find(query)
            .sort({priority: -1, createdAt: -1})
            .limit(limit)
            .skip(offset)
            .lean();
    }

    /**
     * Get notification statistics for a user
     */
    static async getNotificationStats(userId) {
        const [total, unread, byCategory, byPriority] = await Promise.all([
            Notification.countDocuments({userId, 'deleted.status': false}),
            Notification.countDocuments({userId, 'read.status': false, 'deleted.status': false}),
            Notification.aggregate([
                {$match: {userId, 'deleted.status': false}},
                {$group: {_id: '$category', count: {$sum: 1}}}
            ]),
            Notification.aggregate([
                {$match: {userId, 'read.status': false, 'deleted.status': false}},
                {$group: {_id: '$priority', count: {$sum: 1}}}
            ])
        ]);

        return {
            total,
            unread,
            byCategory: byCategory.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            byPriority: byPriority.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId, category = null) {
        const query = {userId, 'read.status': false};
        if (category) query.category = category;

        return Notification.updateMany(query, {
            'read.status': true,
            'read.readAt': new Date(),
            status: 'READ'
        });
    }

    /**
     * Get the count of unread notifications for a user
     */
    static async getUnreadCount(userId) {
        return Notification.countDocuments({
            userId,
            'read.status': false,
            'deleted.status': false
        });
    }

    /**
     * Delete all notifications for a user
     */
    static async deleteAllUserNotifications(userId) {
        return Notification.updateMany(
            {userId, 'deleted.status': false},
            {
                'deleted.status': true,
                'deleted.deletedAt': new Date()
            }
        );
    }

    // ==================== SYSTEM-WIDE METHODS ====================

    /**
     * Get comprehensive system-wide notification statistics
     */
    static async getSystemNotificationStats() {
        const [
            totalAll,
            unreadAll,
            categoryBreakdown,
            priorityBreakdown,
            statusBreakdown,
            userBreakdown
        ] = await Promise.all([
            // Total notifications
            Notification.countDocuments({'deleted.status': false}),

            // Unread notifications
            Notification.countDocuments({'read.status': false, 'deleted.status': false}),

            // Category breakdown
            Notification.aggregate([
                {$match: {'deleted.status': false}},
                {$group: {_id: '$category', count: {$sum: 1}}}
            ]),

            // Priority breakdown (unread only)
            Notification.aggregate([
                {$match: {'read.status': false, 'deleted.status': false}},
                {$group: {_id: '$priority', count: {$sum: 1}}}
            ]),

            // Status breakdown
            Notification.aggregate([
                {$match: {'deleted.status': false}},
                {$group: {_id: '$status', count: {$sum: 1}}}
            ]),

            // User breakdown (top 10 users with most notifications)
            Notification.aggregate([
                {$match: {'deleted.status': false}},
                {$group: {_id: '$userId', count: {$sum: 1}}},
                {$sort: {count: -1}},
                {$limit: 10}
            ])
        ]);

        // Convert arrays to objects
        const categoryStats = {};
        categoryBreakdown.forEach(item => {
            categoryStats[item._id] = item.count;
        });

        const priorityStats = {};
        priorityBreakdown.forEach(item => {
            priorityStats[item._id] = item.count;
        });

        const statusStats = {};
        statusBreakdown.forEach(item => {
            statusStats[item._id] = item.count;
        });

        return {
            total: totalAll,
            unread: unreadAll,
            read: totalAll - unreadAll,
            byCategory: categoryStats,
            byPriority: priorityStats,
            byStatus: statusStats,
            topUsers: userBreakdown,

            // Quick access to critical metrics
            critical: priorityStats.CRITICAL || 0,
            urgent: priorityStats.URGENT || 0,
            high: priorityStats.HIGH || 0,

            // System health metrics
            deliveryRate: Math.round(((totalAll - (statusStats.FAILED || 0)) / totalAll) * 100) || 100
        };
    }

    /**
     * Get top N unread notifications system-wide
     */
    static async getTopUnreadNotifications(limit = 10) {
        return Notification.find({
            'read.status': false,
            'deleted.status': false
        })
            .sort({
                priority: -1, // Critical first
                createdAt: -1 // Newest first
            })
            .limit(limit)
            .lean();
    }

    /**
     * Get notifications by priority level system-wide
     */
    static async getNotificationsByPriority(priority, limit = 100) {
        return Notification.find({
            priority: priority.toUpperCase(),
            'deleted.status': false
        })
            .sort({createdAt: -1})
            .limit(limit)
            .lean();
    }

    /**
     * Permanently delete soft-deleted notifications
     */
    static async purgeDeletedNotifications() {
        const result = await Notification.deleteMany({
            'deleted.status': true
        });

        return {
            deletedCount: result.deletedCount,
            message: `Permanently deleted ${result.deletedCount} soft-deleted notifications`
        };
    }

    /**
     * Cleanup old notifications system-wide
     */
    static async cleanupOldNotifications(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        // Delete read, low/normal priority notifications older than X days
        const result = await Notification.deleteMany({
            createdAt: {$lt: cutoffDate},
            priority: {$in: ['LOW', 'NORMAL']},
            'read.status': true,
            'deleted.status': false
        });

        return {
            deletedCount: result.deletedCount,
            message: `Cleaned up ${result.deletedCount} old notifications`
        };
    }

    /**
     * Get notification trends (last 30 days)
     */
    static async getNotificationTrends(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return Notification.aggregate([
            {
                $match: {
                    createdAt: {$gte: startDate},
                    'deleted.status': false
                }
            },
            {
                $group: {
                    _id: {
                        date: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}},
                        category: "$category"
                    },
                    count: {$sum: 1}
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    categories: {
                        $push: {
                            category: "$_id.category",
                            count: "$count"
                        }
                    },
                    total: {$sum: "$count"}
                }
            },
            {
                $sort: {_id: 1}
            }
        ]);
    }

    /**
     * Bulk update notification status system-wide
     */
    static async bulkUpdateNotifications(filter, update) {
        const result = await Notification.updateMany(
            {...filter, 'deleted.status': false},
            update
        );

        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        };
    }

    /**
     * Get system notification health status
     */
    static async getSystemHealth() {
        const stats = await this.getSystemNotificationStats();
        const topUnread = await this.getTopUnreadNotifications(5);

        const healthScore = Math.min(100, Math.max(0,
            100 - (stats.critical * 10) - (stats.urgent * 5)
        ));

        return {
            healthScore,
            status: healthScore >= 80 ? 'HEALTHY' :
                healthScore >= 60 ? 'DEGRADED' : 'CRITICAL',
            criticalAlerts: stats.critical,
            urgentAlerts: stats.urgent,
            pendingDelivery: stats.unread,
            recentCritical: topUnread.filter(n => n.priority === 'CRITICAL'),
            summary: stats
        };
    }

    // ==================== NOTIFICATION DELIVERY ====================

    /**
     * Send a notification immediately
     */
    static async sendNotification(notificationId) {
        const notification = await Notification.findById(notificationId);
        if (!notification) throw new Error('Notification not found');

        if (notification.status === 'SENT') {
            console.log('Notification already sent:', notificationId);
            return notification;
        }

        // Deliver the notification (implement your delivery logic)
        await this.deliverNotification(notification);
        return notification;
    }

    /**
     * Soft delete a notification
     */
    static async deleteNotification(notificationId) {
        const notification = await Notification.findById(notificationId);
        if (!notification) throw new Error('Notification not found');

        notification.deleted.status = true;
        notification.deleted.deletedAt = new Date();
        return await notification.save();
    }
}

export default NotificationService;