// AdminController -- every matter related to admin execution
import getModels from "@/server/models/AAng/AAngLogistics";
import dbClient from "@/server/db/mongoDb";
import mongoose from "mongoose";
import AuthController from "@/server/controllers/AuthController";
import {revalidatePath, revalidateTag} from "next/cache";
import getOrderModels from "@/server/models/Order";
import Notification from "@/server/models/Notification"
import NotificationService from "@/server/services/NotificationService"
import {NextResponse} from "next/server";

const {Order} = await getOrderModels();
const {Admin, AAngBase, Driver} = await getModels()
await dbClient.connect();

class AdminController {

    /**
     * Retrieves the admin profile by admin ID, excluding sensitive fields.
     * Establishes a database connection, fetches the admin document by ID,
     * omitting the password, and handles errors if the admin is not found.
     *
     * @param {string} adminId - The unique identifier of the admin.
     * @returns {Promise<Object>} The admin profile data without the password field.
     * @throws {Error} If the admin is not found or fetching fails.
     */
    static async adminProfile(adminId) {
        try {
            await dbClient.connect();
            const adminData = await Admin.findById(
                mongoose.Types.ObjectId.createFromHexString(adminId)
            ).select('-password'); // Exclude sensitive data

            if (!adminData) {
                throw new Error("Admin not found");
            }
            return adminData;
        } catch (err) {
            console.error('Admin profile fetch error:', err);
            throw new Error('Failed to fetch admin profile');
        }
    }

    /**
     * Updates the admin role of a user and revalidates relevant cache paths and tags.
     *
     * @param {Object} payload - Object containing userId and new adminRole.
     * @param {string} payload.userId - The ID of the user whose role will be updated.
     * @param {string} payload.adminRole - The new admin role to set.
     * @returns {Promise<Object>} Success response with message, or error information on failure.
     */
    static async updateAdminRole(payload) {
        const {userId, adminRole} = payload;
        try {
            await Admin.findByIdAndUpdate(userId, {adminRole}, {new: true}).lean();
            revalidatePath(`/admin/users/edit/${userId}`);
            revalidatePath('/admin/dashboard'); // Main user management page
            revalidateTag('allUserData'); // If you're using cache tags
            revalidateTag(`user-${userId}`); // Specific user cache
            return {
                success: true,
                message: 'Admin role updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to update user data'
            };
        }
    }

    /**
     * @description Get all users
     * @params {Object}
     *   page: number;
     *   limit: number;
     *   search?: string;
     * @returns {Promise<void>}
     * @throws {Error} If the admin is not found
     *
     */
    static async allUser(params) {
        const {page = 10, limit = 100, search, role, status, sortBy = 'createdAt', sortOrder = 'desc'} = params;

        try {
            await dbClient.connect();

            const skip = (page - 1) * limit;

            // Build search query
            let searchQuery = {};

            if (search && search.trim()) {
                searchQuery.$or = [
                    {email: {$regex: search.trim(), $options: 'i'}},
                    {fullName: {$regex: search.trim(), $options: 'i'}},
                    {phoneNumber: {$regex: search.trim(), $options: 'i'}}
                ];
            }

            // Add role filter
            if (role && role !== 'all') {
                searchQuery.role = {$regex: new RegExp(`^${role}$`, 'i')};
            }

            // Add status filter
            if (status && status !== 'all') {
                searchQuery.status = {$regex: new RegExp(`^${status}$`, 'i')};
            }

            // Build sort object
            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Fetch users with pagination and filters
            const data = await AAngBase.find(searchQuery)
                .select('-password')
                .limit(parseInt(limit))
                .skip(skip)
                .sort(sortObj)
                .lean();

            // Get total count WITH the same search/filter query
            const totalUsers = await AAngBase.countDocuments(searchQuery);
            const dashBoardStats = await AdminController.allUserStats();

            // Return the data
            return {
                data: JSON.parse(JSON.stringify(data)),
                dashBoardStats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers: totalUsers,
                    hasNext: page < Math.ceil(totalUsers / limit),
                    hasPrev: page > 1
                }
            };

        } catch (err) {
            console.error('User fetch error:', err);
            throw new Error('Failed to fetch users');
        }
    }

    /**
     * @description Get allUser stats
     *
     */
    static async allUserStats() {
        await dbClient.connect();
        const stats = await AAngBase.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: {$sum: 1}, // this will add 1 to every count
                    activeUsers: {
                        $sum: {$cond: [{$eq: ["$status", "Active"]}, 1, 0]}
                        // $cond == condition
                        // if status is equal to active then add + 1 else 0
                    },
                    inactiveUsers: {
                        $sum: {$cond: [{$eq: ["$status", "Inactive"]}, 1, 0]}
                    },
                    suspendedUsers: {
                        $sum: {$cond: [{$eq: ["$status", "Suspended"]}, 1, 0]}
                    },
                    bannedUsers: {
                        $sum: {$cond: [{$eq: ["$status", "Banned"]}, 1, 0]}

                    },
                    deletedUsers: {
                        $sum: {$cond: [{$eq: ["$status", "Deleted"]}, 1, 0]}
                    },
                    blockedUsers: {
                        $sum: {$cond: [{$eq: ["$status", "Blocked"]}, 1, 0]}
                    },
                    pendingUsers: {
                        $sum: {$cond: [{$eq: ["$status", "Pending"]}, 1, 0]}
                    },

                    driverUsers: {
                        $sum: {$cond: [{$eq: ["$role", "Driver"]}, 1, 0]}
                    },
                    adminUsers: {
                        $sum: {$cond: [{$eq: ["$role", "Admin"]}, 1, 0]}
                    },
                    clientUsers: {
                        $sum: {$cond: [{$eq: ["$role", "Client"]}, 1, 0]}
                    }
                }
            }
        ]);
        return stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            pendingUsers: 0,
            suspendedUsers: 0,
            bannedUsers: 0,
            deletedUsers: 0,
            blockedUsers: 0,
            driverUsers: 0,
            adminUsers: 0,
            clientUsers: 0
        };
    }

    static async createUser(obj) {
        const {fullName, email, password, phoneNumber, role, gender} = obj;
        if (!fullName || !email || !password || !role || !gender) {
            throw new Error('Missing required fields');
        }
        try {
            await dbClient.connect();

            // Check if user already exists
            let user = await AAngBase.findOne({email});
            if (user) {
                // Get available auth methods
                throw new Error('User already exists');
            }

            // Hash password
            const hashedPassword = await AuthController.hashPassword(password);

            // Create user
            user = await AAngBase.create({
                email,
                fullName,
                phoneNumber,
                gender,
                password: hashedPassword,
                role: role.charAt(0).toUpperCase() + role.slice(1),
                authMethods: [{
                    type: 'Credentials',
                    verified: false,
                    lastUsed: new Date()
                }],
                preferredAuthMethod: 'Credentials',
                provider: 'Credentials', // Backward compatibility
            });
            return (user);
        } catch (err) {
            console.error('User create error:', err);
            throw new Error('Failed to create user');
        }
    }

    static async userAccountAction(payload, action) {
        try {
            const {userId} = payload
            await dbClient.connect();
            await AAngBase.findByIdAndUpdate(
                {_id: userId},
                {
                    $set: {status: action}
                }
            )
            return ({
                message: `User account has been ${action}`
            })
        } catch (err) {
            console.log(err.message);
            throw new Error(`Operation failed: ${err.message}`);
        }
    }

    static async systemDeleteUserAccount(payload) {
        try {
            const {userId, action} = payload
            await dbClient.connect();
            await AAngBase.findByIdAndDelete({_id: userId})
            return ({
                message: `User account has been ${action}`
            })
        } catch (err) {
            console.log(err.message);
            throw new Error(`Operation failed: ${err.message}`);
        }
    }


    static async getDataById(id) {
        try {
            await dbClient.connect();
            const _id = await mongoose.Types.ObjectId.createFromHexString(id)
            const userData = await AAngBase.findById({_id}).select('-password').lean();
            if (!userData) {
                throw new Error("Admin not found");
            }
            return JSON.parse(JSON.stringify(userData));
        } catch (err) {
            console.error('User data fetch error:', err);
            throw new Error('Failed to fetch user data');
        }
    }

    static async updateUserById(userId, data) {
        try {
            const updatedUser = await AAngBase.findByIdAndUpdate(
                userId,
                {$set: data},
                {new: true, runValidators: true}
            ).lean();

            if (!updatedUser) {
                throw new Error('User not found');
            }
            // Return the complete updated user object
            return JSON.parse(JSON.stringify(updatedUser));
        } catch (error) {
            throw error;
        }
    }

    static async updateUserData(userId, tabName, data) {
        try {
            // Call your existing controller method
            const updatedUser = await AdminController.updateUserById(userId, tabName, data);

            // Revalidate relevant paths and cache tags
            revalidatePath(`/admin/users/edit/${userId}`);
            revalidatePath('/admin/dashboard'); // Main user management page
            revalidateTag('allUserData'); // If you're using cache tags
            revalidateTag(`user-${userId}`); // Specific user cache

            return {
                success: true,
                data: updatedUser,
                message: 'User data updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to update user data'
            };
        }
    }

    static async updateUserBasicInfo(userId, basicInfo) {
        try {
            const result = await AdminController.updateUserById(userId, basicInfo);

            // Revalidate critical paths
            revalidatePath(`/admin/users/edit/${userId}`);
            revalidatePath('/admin/dashboard');
            revalidatePath('/admin/users');
            revalidateTag('allUserData');

            return {
                success: true,
                data: JSON.parse(JSON.stringify(result)),
                message: 'Basic information updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async updateLocationInfo(payload) {
        const {userId, locationId, locationData} = payload;
        if (!userId || !locationId || !locationData) {
            throw new Error('Missing required fields');
        }
        try {
            const result = await AAngBase.findOneAndUpdate(
                {_id: userId, "savedLocations._id": locationId},
                {$set: {"savedLocations.$": locationData}},
                {new: true}
            );
            revalidatePath(`/admin/users/edit/${userId}`);
            revalidatePath(`/admin/location/edit/${userId}/${locationId}`);
            revalidatePath('/admin/dashboard');
            revalidatePath('/admin/users');
            revalidateTag('allUserData');
            return {success: true, data: JSON.parse(JSON.stringify(result))};
        } catch (error) {
            throw error;
        }
    }

    static async createLocation(payload) {
        const {userId, locationData} = payload;
        if (!userId || !locationData) {
            throw new Error('Missing required fields');
        }
        try {
            // creating a new location for the user
            const result = await AAngBase.findOneAndUpdate(
                {_id: userId}, {
                    $push: {
                        savedLocations: locationData
                    }
                }, {
                    new: true,
                }
            );
            revalidatePath(`/admin/users/edit/${userId}`);
            revalidatePath('/admin/dashboard');
            revalidatePath('/admin/users');
            revalidateTag('allUserData');
            return {success: true, data: JSON.parse(JSON.stringify(result))};
        } catch (error) {
            throw error;
        }
    }

    static async deleteUserLocation(payload) {
        const {userId, locationId} = payload
        try {
            // First, check if the location exists and belongs to the user
            const userWithLocation = await AAngBase.findOne({
                _id: userId,
                'savedLocations._id': locationId,
            }, {
                'savedLocations.$': 1
            });

            if (!userWithLocation) {
                return ({
                    error: "Location not found or unauthorized access",
                    code: 404,
                });
            }

            // Use atomic operation to remove the location
            const updatedUser = await AAngBase.findOneAndUpdate(
                {_id: userId, 'savedLocations._id': locationId},
                {$pull: {savedLocations: {_id: locationId}}},
                {new: true,}
            );

            if (!updatedUser) {
                return ({error: "User not found", code: 404});
            }
            revalidatePath(`/admin/users/edit/${userId}`);
            revalidatePath('/admin/dashboard');
            revalidatePath('/admin/users');
            revalidateTag('allUserData');
            return {success: true, data: JSON.parse(JSON.stringify(updatedUser))};
        } catch (error) {
            console.log(error.message)
            throw new Error(error.message)
        }
    }

    static async deleteAllUserLocations(payload) {
        const {userId} = payload
        try {
            // First, check if the location exists and belongs to the user
            const userWithLocation = await AAngBase.findOne(
                {_id: userId,},
                {'savedLocations.$': 1}
            );

            if (!userWithLocation) {
                return ({
                    error: "Location not found or unauthorized access",
                    code: 404,
                });
            }

            const updatedUser = await AAngBase.findOneAndUpdate(
                {_id: userId},
                {$set: {savedLocations: []}},
                {new: true,}
            );
            if (!updatedUser) {
                return ({error: "User not found", code: 404});
            }
            revalidatePath(`/admin/users/edit/${userId}`);
            revalidatePath('/admin/dashboard');
            revalidatePath('/admin/users');
            revalidateTag('allUserData');
            return {success: true, data: JSON.parse(JSON.stringify(updatedUser))};
        } catch (error) {
            console.log(error.message)
            throw new Error(error.message)
        }
    }

    static async getAllUserSession() {
        try {
            await dbClient.connect();
            const users = await AAngBase.find({});
            return users.map(user => {
                return {
                    user_id: user._id,
                    email: user.email,
                    sessionTokens: user.sessionTokens
                }
            });
        } catch (err) {
            console.log(err.message)
            throw new Error(err.message)

        }
    }

    /**
     * Cleanup user sessions based on strategy
     * @param {string} userId - The user ID
     * @param {string} strategy - Cleanup strategy: 'keep-recent-5', 'remove-stale', 'delete-all'
     */
    static async cleanupUserSessions(payload) {
        const {userId, strategy} = payload;
        try {
            await dbClient.connect();
            const user = await AAngBase.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            let updatedTokens = user.sessionTokens || [];
            let removedCount = 0;

            switch (strategy) {
                case 'keep-recent-5':
                    // Sort by lastActive and keep only 5 most recent
                    const sorted = [...updatedTokens].sort((a, b) =>
                        new Date(b.lastActive) - new Date(a.lastActive)
                    );
                    removedCount = updatedTokens.length - 5;
                    updatedTokens = sorted.slice(0, 5);
                    break;

                case 'remove-stale':
                    // Remove tokens inactive for more than 7 days
                    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                    const staleTokens = updatedTokens.filter(t =>
                        new Date(t.lastActive) < sevenDaysAgo
                    );
                    removedCount = staleTokens.length;
                    updatedTokens = updatedTokens.filter(t =>
                        new Date(t.lastActive) >= sevenDaysAgo
                    );
                    break;

                case 'delete-all':
                    // Remove all session tokens
                    removedCount = updatedTokens.length;
                    updatedTokens = [];
                    break;

                default:
                    throw new Error('Invalid cleanup strategy');
            }

            // Update user with cleaned tokens
            user.sessionTokens = updatedTokens;
            await user.save();

            return {
                success: true,
                message: `Removed ${removedCount} session(s). ${updatedTokens.length} remaining.`,
                removed: removedCount,
                remaining: updatedTokens.length
            };
        } catch (err) {
            console.error('Session cleanup error:', err);
            throw new Error(err.message);
        }
    }

    /**
     * Bulk cleanup sessions for multiple users
     * @param {string} strategy - 'cleanup-all-excess' or 'cleanup-all-stale'
     */
    static async bulkCleanupSessions(strategy) {
        try {
            await dbClient.connect();

            let totalCleaned = 0;
            let usersAffected = 0;

            if (strategy === 'cleanup-all-excess') {
                // Find users with more than 10 sessions
                const users = await AAngBase.find({
                    $expr: {$gt: [{$size: {$ifNull: ['$sessionTokens', []]}}, 10]}
                });

                for (const user of users) {
                    const sorted = [...(user.sessionTokens || [])].sort((a, b) =>
                        new Date(b.lastActive) - new Date(a.lastActive)
                    );
                    const removed = user.sessionTokens.length - 10;
                    user.sessionTokens = sorted.slice(0, 10);
                    await user.save();

                    totalCleaned += removed;
                    usersAffected++;
                }
            } else if (strategy === 'cleanup-all-stale') {
                // Find all users and remove stale sessions
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const users = await AAngBase.find({
                    'sessionTokens.0': {$exists: true}
                });

                for (const user of users) {
                    const originalCount = user.sessionTokens.length;
                    user.sessionTokens = user.sessionTokens.filter(t =>
                        new Date(t.lastActive) >= sevenDaysAgo
                    );
                    const removed = originalCount - user.sessionTokens.length;

                    if (removed > 0) {
                        await user.save();
                        totalCleaned += removed;
                        usersAffected++;
                    }
                }
            } else {
                throw new Error('Invalid bulk cleanup strategy');
            }

            return {
                success: true,
                message: `Cleaned ${totalCleaned} sessions from ${usersAffected} users`,
                totalCleaned,
                usersAffected
            };
        } catch (err) {
            console.error('Bulk cleanup error:', err);
            throw new Error(err.message);
        }
    }

    /**
     * Get session statistics
     */
    static async getSessionStatistics() {
        try {
            await dbClient.connect();

            const users = await AAngBase.find({});
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

            const stats = users.reduce((acc, user) => {
                const sessionCount = user.sessionTokens?.length || 0;
                const staleCount = user.sessionTokens?.filter(t =>
                    new Date(t.lastActive) < sevenDaysAgo
                ).length || 0;

                return {
                    totalUsers: acc.totalUsers + 1,
                    usersWithSessions: sessionCount > 0 ? acc.usersWithSessions + 1 : acc.usersWithSessions,
                    totalSessions: acc.totalSessions + sessionCount,
                    usersNeedingCleanup: sessionCount > 10 ? acc.usersNeedingCleanup + 1 : acc.usersNeedingCleanup,
                    totalStale: acc.totalStale + staleCount,
                    averageSessionsPerUser: 0 // Will calculate after
                };
            }, {
                totalUsers: 0,
                usersWithSessions: 0,
                totalSessions: 0,
                usersNeedingCleanup: 0,
                totalStale: 0
            });

            stats.averageSessionsPerUser = stats.usersWithSessions > 0
                ? (stats.totalSessions / stats.usersWithSessions).toFixed(2)
                : 0;

            return stats;
        } catch (err) {
            console.error('Stats error:', err);
            throw new Error(err.message);
        }
    }

    /**
     * Delete specific session token
     * @param {string} userId - User ID
     * @param {string} tokenId - Session token _id to remove
     */
    static async deleteSpecificSession(userId, tokenId) {
        try {
            await dbClient.connect();

            const user = await AAngBase.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const originalCount = user.sessionTokens.length;
            user.sessionTokens = user.sessionTokens.filter(
                t => t._id.toString() !== tokenId
            );

            if (originalCount === user.sessionTokens.length) {
                throw new Error('Session token not found');
            }

            await user.save();

            return {
                success: true,
                message: 'Session token deleted successfully',
                remaining: user.sessionTokens.length
            };
        } catch (err) {
            console.error('Delete session error:', err);
            throw new Error(err.message);
        }
    }

    /**
     * Auto-cleanup cron job - can be scheduled to run daily
     * Automatically removes stale sessions (7+ days old) for all users
     */
    static async autoCleanupStaleSessions() {
        try {
            await dbClient.connect();

            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            let totalCleaned = 0;
            let usersAffected = 0;

            // Find users with stale sessions
            const users = await AAngBase.find({
                'sessionTokens.lastActive': {$lt: new Date(sevenDaysAgo)}
            });

            for (const user of users) {
                const originalCount = user.sessionTokens.length;
                user.sessionTokens = user.sessionTokens.filter(t =>
                    new Date(t.lastActive) >= sevenDaysAgo
                );

                const removed = originalCount - user.sessionTokens.length;
                if (removed > 0) {
                    await user.save();
                    totalCleaned += removed;
                    usersAffected++;
                }
            }

            console.log(`[Auto-cleanup] Removed ${totalCleaned} stale sessions from ${usersAffected} users`);

            return {
                success: true,
                totalCleaned,
                usersAffected,
                timestamp: new Date().toISOString()
            };
        } catch (err) {
            console.error('Auto-cleanup error:', err);
            throw new Error(err.message);
        }
    }

    /**
     * Get detailed user session info
     * @param {string} userId - User ID
     */
    static async getUserSessionDetails(userId) {
        try {
            await dbClient.connect();

            const user = await AAngBase.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const sessions = user.sessionTokens || [];

            const activeSessions = sessions.filter(t =>
                new Date(t.lastActive) >= sevenDaysAgo
            );
            const staleSessions = sessions.filter(t =>
                new Date(t.lastActive) < sevenDaysAgo
            );

            // Group by device
            const deviceGroups = sessions.reduce((acc, token) => {
                const device = token.device || 'Unknown';
                if (!acc[device]) {
                    acc[device] = [];
                }
                acc[device].push(token);
                return acc;
            }, {});

            return {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                },
                summary: {
                    total: sessions.length,
                    active: activeSessions.length,
                    stale: staleSessions.length,
                    needsCleanup: sessions.length > 10
                },
                deviceGroups,
                sessions: sessions.sort((a, b) =>
                    new Date(b.lastActive) - new Date(a.lastActive)
                )
            };
        } catch (err) {
            console.error('Get session details error:', err);
            throw new Error(err.message);
        }
    }


    // Order Management
    // server/controllers/AdminController.js
    static async initialOrderData(params = {}) {
        const {
            page = 1,
            limit = 100,
            sortBy = 'finalScore',
            sortOrder = 'desc',
            search = '', // Add search parameter
            status = '',
            priority = '',
            orderType = ''
        } = params;

        try {
            await dbClient.connect();
            const {Order} = await getOrderModels();

            const skip = (page - 1) * limit;

            // Build search pipeline
            const searchMatchStage = {};

            // Add search functionality
            if (search && search.trim()) {
                searchMatchStage.$or = [
                    {orderRef: {$regex: search.trim(), $options: 'i'}},
                    {"package.description": {$regex: search.trim(), $options: 'i'}},
                    {"location.pickUp.address": {$regex: search.trim(), $options: 'i'}},
                    {"location.dropOff.address": {$regex: search.trim(), $options: 'i'}},
                    {"location.pickUp.landmark": {$regex: search.trim(), $options: 'i'}},
                    {"location.dropOff.landmark": {$regex: search.trim(), $options: 'i'}},
                    {"location.pickUp.contactPerson.name": {$regex: search.trim(), $options: 'i'}},
                    {"location.dropOff.contactPerson.name": {$regex: search.trim(), $options: 'i'}},
                    {"driverAssignment.driverInfo.name": {$regex: search.trim(), $options: 'i'}}
                ];
            }

            // Add filters
            if (status && status !== 'all') {
                searchMatchStage.status = status;
            }
            if (priority && priority !== 'all') {
                searchMatchStage.priority = priority;
            }
            if (orderType && orderType !== 'all') {
                searchMatchStage.orderType = orderType;
            }

            // Build aggregation pipeline
            const pipeline = [
                // Apply search and filters first
                ...(Object.keys(searchMatchStage).length > 0 ? [{$match: searchMatchStage}] : []),

                {
                    $addFields: {
                        // Priority score: higher score = higher priority
                        priorityScore: {
                            $switch: {
                                branches: [
                                    {
                                        case: {$eq: ["$status", "admin_review"]},
                                        then: 1000
                                    },
                                    {
                                        case: {$eq: ["$status", "admin_rejected"]},
                                        then: 950
                                    },
                                    {
                                        case: {$in: ["$status", ["broadcast", "pending"]]},
                                        then: 800
                                    },
                                    {
                                        case: {$in: ["$status", ["assigned", "confirmed"]]},
                                        then: 750
                                    },
                                    {
                                        case: {$in: ["$status", ["en_route_pickup", "arrived_pickup"]]},
                                        then: 700
                                    },
                                    {
                                        case: {$in: ["$status", ["picked_up", "in_transit", "arrived_dropoff"]]},
                                        then: 600
                                    },
                                    {
                                        case: {$eq: ["$status", "delivered"]},
                                        then: 400
                                    },
                                    {
                                        case: {$in: ["$status", ["failed", "returned"]]},
                                        then: 350
                                    },
                                    {
                                        case: {$eq: ["$status", "cancelled"]},
                                        then: 200
                                    },
                                    {
                                        case: {$eq: ["$status", "draft"]},
                                        then: 100
                                    }
                                ],
                                default: 500
                            }
                        },
                        recencyBonus: {
                            $divide: [
                                {$subtract: [new Date(), "$createdAt"]},
                                1000 * 60 * 60 * 24
                            ]
                        }
                    }
                },
                {
                    $addFields: {
                        finalScore: {
                            $subtract: [
                                "$priorityScore",
                                {$multiply: ["$recencyBonus", 0.1]}
                            ]
                        }
                    }
                }
            ];

            // Get total count for pagination (before skip/limit)
            const countPipeline = [...pipeline, {$count: "total"}];
            const [countResult] = await Order.aggregate(countPipeline);
            const totalFilteredOrders = countResult?.total || 0;

            // Add sorting, pagination, and projection
            pipeline.push(
                {
                    $sort: {
                        [sortBy]: sortOrder === 'desc' ? -1 : 1,
                        createdAt: -1
                    }
                },
                {$skip: skip},
                {$limit: limit},
                {
                    $project: {
                        deliveryToken: 0,
                        "payment.paystackData": 0
                    }
                }
            );

            const orders = await Order.aggregate(pipeline);

            // Get total statistics (unchanged)
            const statsPipeline = [
                {
                    $facet: {
                        totalAllOrders: [{$count: "count"}],
                        statusBreakdown: [
                            {$group: {_id: "$status", count: {$sum: 1}}}
                        ],
                        revenueStats: [
                            {
                                $match: {"payment.status": "paid"}
                            },
                            {
                                $group: {
                                    _id: null,
                                    revenue: {$sum: "$pricing.totalAmount"}
                                }
                            }
                        ]
                    }
                }
            ];

            const [statsResult] = await Order.aggregate(statsPipeline);
            const totalAllOrders = statsResult.totalAllOrders[0]?.count || 0;
            const statusBreakdown = statsResult.statusBreakdown || [];

            const statusCounts = {};
            statusBreakdown.forEach(item => {
                statusCounts[item._id] = item.count;
            });

            const totalStatistics = {
                total: totalAllOrders,
                active: [
                    "pending", "broadcast", "assigned", "confirmed",
                    "picked_up", "in_transit", "en_route_pickup",
                    "arrived_pickup", "arrived_dropoff", "admin_review",
                    "admin_approved", "submitted"
                ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0),
                completed: statusCounts.delivered || 0,
                failed: ["failed", "cancelled", "returned", "admin_rejected"]
                    .reduce((sum, status) => sum + (statusCounts[status] || 0), 0),
                revenue: statsResult.revenueStats[0]?.revenue || 0,
                pendingApproval: statusCounts.admin_review || 0,
                drafts: statusCounts.draft || 0
            };

            const result = {
                initialOrderData: orders,
                totalStatistics,
                pagination: {
                    page,
                    limit,
                    totalPages: Math.ceil(totalFilteredOrders / limit), // Use filtered count
                    totalResults: totalFilteredOrders,
                    hasNextPage: page < Math.ceil(totalFilteredOrders / limit),
                    hasPrevPage: page > 1
                }
            };

            return JSON.parse(JSON.stringify(result));

        } catch (err) {
            console.error('Order fetch error:', err);
            throw new Error('Failed to fetch orders data');
        }
    }

    // In AdminController.js
    static async clientOrderData(params = {}, clientId) {
        const {
            page = 1,
            limit = 100,
            sortBy = 'finalScore',
            sortOrder = 'desc',
            search = '',
            status = '',
            priority = '',
            orderType = ''
        } = params;

        try {
            await dbClient.connect();
            const {Order} = await getOrderModels();
            const clientData = await AdminController.getDataById(clientId);

            const skip = (page - 1) * limit;

            // Build base match stage with clientId
            const baseMatchStage = {
                clientId: new mongoose.Types.ObjectId(clientId)
            };

            // Build search pipeline
            const searchMatchStage = {...baseMatchStage};

            // Add search functionality
            if (search && search.trim()) {
                searchMatchStage.$or = [
                    {orderRef: {$regex: search.trim(), $options: 'i'}},
                    {"package.description": {$regex: search.trim(), $options: 'i'}},
                    {"location.pickUp.address": {$regex: search.trim(), $options: 'i'}},
                    {"location.dropOff.address": {$regex: search.trim(), $options: 'i'}},
                    {"location.pickUp.landmark": {$regex: search.trim(), $options: 'i'}},
                    {"location.dropOff.landmark": {$regex: search.trim(), $options: 'i'}}
                ];
            }

            // Add filters
            if (status && status !== 'all') {
                searchMatchStage.status = status;
            }
            if (priority && priority !== 'all') {
                searchMatchStage.priority = priority;
            }
            if (orderType && orderType !== 'all') {
                searchMatchStage.orderType = orderType;
            }

            // Build aggregation pipeline
            const pipeline = [
                // Apply client filter and search/filters
                {$match: searchMatchStage},

                {
                    $addFields: {
                        // Priority score: higher score = higher priority
                        priorityScore: {
                            $switch: {
                                branches: [
                                    {
                                        case: {$eq: ["$status", "admin_review"]},
                                        then: 1000
                                    },
                                    {
                                        case: {$eq: ["$status", "admin_rejected"]},
                                        then: 950
                                    },
                                    {
                                        case: {$in: ["$status", ["broadcast", "pending"]]},
                                        then: 800
                                    },
                                    {
                                        case: {$in: ["$status", ["assigned", "confirmed"]]},
                                        then: 750
                                    },
                                    {
                                        case: {$in: ["$status", ["en_route_pickup", "arrived_pickup"]]},
                                        then: 700
                                    },
                                    {
                                        case: {$in: ["$status", ["picked_up", "in_transit", "arrived_dropoff"]]},
                                        then: 600
                                    },
                                    {
                                        case: {$eq: ["$status", "delivered"]},
                                        then: 400
                                    },
                                    {
                                        case: {$in: ["$status", ["failed", "returned"]]},
                                        then: 350
                                    },
                                    {
                                        case: {$eq: ["$status", "cancelled"]},
                                        then: 200
                                    },
                                    {
                                        case: {$eq: ["$status", "draft"]},
                                        then: 100
                                    }
                                ],
                                default: 500
                            }
                        },
                        recencyBonus: {
                            $divide: [
                                {$subtract: [new Date(), "$createdAt"]},
                                1000 * 60 * 60 * 24
                            ]
                        }
                    }
                },
                {
                    $addFields: {
                        finalScore: {
                            $subtract: [
                                "$priorityScore",
                                {$multiply: ["$recencyBonus", 0.1]}
                            ]
                        }
                    }
                }
            ];

            // Get total count for pagination (before skip/limit)
            const countPipeline = [...pipeline, {$count: "total"}];
            const [countResult] = await Order.aggregate(countPipeline);
            const totalFilteredOrders = countResult?.total || 0;

            // Add sorting, pagination, and projection
            pipeline.push(
                {
                    $sort: {
                        [sortBy]: sortOrder === 'desc' ? -1 : 1,
                        createdAt: -1
                    }
                },
                {$skip: skip},
                {$limit: limit},
                {
                    $project: {
                        deliveryToken: 0,
                        "payment.paystackData": 0
                    }
                }
            );

            const orders = await Order.aggregate(pipeline);

            // Get client-specific statistics
            const statsPipeline = [
                {$match: baseMatchStage},
                {
                    $facet: {
                        totalAllOrders: [{$count: "count"}],
                        statusBreakdown: [
                            {$group: {_id: "$status", count: {$sum: 1}}}
                        ],
                        revenueStats: [
                            {
                                $match: {"payment.status": "paid"}
                            },
                            {
                                $group: {
                                    _id: null,
                                    revenue: {$sum: "$pricing.totalAmount"},
                                    totalOrders: {$sum: 1}
                                }
                            }
                        ]
                    }
                }
            ];

            const [statsResult] = await Order.aggregate(statsPipeline);
            const totalAllOrders = statsResult.totalAllOrders[0]?.count || 0;
            const statusBreakdown = statsResult.statusBreakdown || [];

            const statusCounts = {};
            statusBreakdown.forEach(item => {
                statusCounts[item._id] = item.count;
            });

            // Enhanced statistics for client view
            const totalStatistics = {
                total: totalAllOrders,
                draft: statusCounts.draft || 0,
                ongoing: [
                    "pending", "broadcast", "assigned", "confirmed",
                    "picked_up", "in_transit", "en_route_pickup",
                    "arrived_pickup", "arrived_dropoff", "admin_review",
                    "admin_approved", "submitted"
                ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0),
                completed: statusCounts.delivered || 0,
                cancelled: ["failed", "cancelled", "returned", "admin_rejected"]
                    .reduce((sum, status) => sum + (statusCounts[status] || 0), 0),
                revenue: statsResult.revenueStats[0]?.revenue || 0,
                paidOrders: statsResult.revenueStats[0]?.totalOrders || 0
            };

            const result = {
                initialClientOrderData: orders,
                totalStatistics,
                pagination: {
                    page,
                    limit,
                    totalPages: Math.ceil(totalFilteredOrders / limit),
                    totalResults: totalFilteredOrders,
                    hasNextPage: page < Math.ceil(totalFilteredOrders / limit),
                    hasPrevPage: page > 1
                },
                clientData,
            };

            return JSON.parse(JSON.stringify(result));

        } catch (err) {
            console.error('Client order fetch error:', err);
            throw new Error('Failed to fetch client orders data');
        }
    }

    static serializeOrderData(data) {
        return JSON.parse(JSON.stringify(data, (key, value) => {
            // Convert MongoDB ObjectId to string
            if (value && typeof value === 'object' && value._bsontype === 'ObjectID') {
                return value.toString();
            }

            // Convert Date objects to ISO strings
            if (value instanceof Date) {
                return value.toISOString();
            }

            // Handle nested objects that might have ObjectIds
            if (value && typeof value === 'object' && value.buffer && value._bsontype === 'ObjectID') {
                return value.toString();
            }

            return value;
        }));
    }

    static async getOrderDataById(orderId) {
        try {
            await dbClient.connect();
            const orderData = await Order.findById(orderId);
            if (!orderData) {
                throw new Error("Order data not found");
            }
            return JSON.parse(JSON.stringify(orderData));
        } catch (err) {
            console.error('User data fetch error:', err);
            throw new Error('Failed to fetch user data');
        }
    }

    static async adminReviewUpdate(payload) {
        const {_id, status, reason} = payload;

        if (status !== 'approved' && status !== 'rejected') {
            throw new Error('Invalid status');
        }

        try {
            await dbClient.connect();
            const {Order} = await getOrderModels();

            await Order.updateOne(
                { _id },
                {
                    $set: {
                        "orderTrackingHistory.$[elem].isCurrent": false,
                        "orderTrackingHistory.$[elem].isCompleted": true
                    }
                },
                {
                    arrayFilters: [{ "elem.isCurrent": true }]
                }
            );

            const orderData = await Order.findById(_id);
            if (!orderData) {
                throw new Error('Order not found');
            }


            if (status === 'approved') {
                return await Order.findOneAndUpdate(
                    {_id},
                    {
                        $set: {status: 'broadcast' },
                        $push: {
                            orderTrackingHistory: {
                                $each: [
                                    {
                                        status: 'admin_approved',
                                        timestamp: new Date(),
                                        title: 'Order Approved',
                                        description: 'Your order has been approved by admin and is ready for driver assignment.',
                                        icon: "✅",
                                        isCompleted: true,
                                        isCurrent: false,
                                    },
                                    {
                                        status: 'driver_assignment_started',
                                        timestamp: new Date(),
                                        title: 'Finding Driver',
                                        description: 'We are finding an available driver for your order.',
                                        icon: "🔍",
                                        isCompleted: false,
                                        isCurrent: true,
                                    }
                                ]
                            }
                        }
                    },
                    {new: true}
                );
            } else {
                // Rejection validation
                if (!reason || typeof reason !== 'object') {
                    throw new Error('Rejection reason required');
                }

                const validReasons = ['dataIntegrity', 'contraBandItems'];
                const providedReasons = Object.keys(reason).filter(key => reason[key] === true);

                if (providedReasons.length === 0) {
                    throw new Error('At least one rejection reason must be selected');
                }

                const isValid = providedReasons.every(key => validReasons.includes(key));
                if (!isValid) {
                    throw new Error('Invalid rejection reason provided');
                }

                return await Order.findOneAndUpdate(
                    {_id},
                    {
                        $set: {status: 'admin_rejected'},
                        $push: {
                            orderTrackingHistory: {
                                status: 'system_admin_rejected',
                                timestamp: new Date(),
                                title: 'Order Rejected',
                                description: 'Your order has been rejected by admin. Please contact support for details.',
                                reason: reason,
                                icon: "❌",
                                isCompleted: true,
                                isCurrent: true,
                            }
                        }
                    },
                    {new: true}
                );
            }
            // disable broadcast if already broadcasted from the object instance of the orderAssignment
        } catch (e) {
            throw new Error(`Update failed: ${e.message}`);
        }
    }

    // Add to your AdminController
    static async reverseAdminDecision(payload) {
        const {_id, reversalReason} = payload;

        try {
            await dbClient.connect();
            const {Order} = await getOrderModels();

            const order = await Order.findById(_id);
            if (!order) throw new Error('Order not found');

            // Validation checks
            // if (!['admin_approved', 'admin_rejected'].includes(order.status)) {
            //     throw new Error('Only approved or rejected orders can be reversed');
            // }

            if (order.driverAssignment?.driverId) {
                throw new Error('Cannot reverse: Driver already assigned');
            }

            // Check time window (30 minutes)
            const lastUpdate = order.orderTrackingHistory[order.orderTrackingHistory.length - 1];
            const timeDiff = Date.now() - new Date(lastUpdate.timestamp).getTime();
            if (timeDiff > 30 * 60 * 1000) {
                throw new Error('Reversal window expired (30 minutes)');
            }

            // Perform reversal - set back to admin_review
            return await Order.findOneAndUpdate(
                {_id},
                {
                    $set: {status: 'admin_review'},
                    $push: {
                        orderTrackingHistory: {
                            status: 'admin_review_started',
                            timestamp: new Date(),
                            title: 'Decision Reversed',
                            description: `Previous ${order.status === 'admin_approved' ? 'approval' : 'rejection'} was reversed by admin. Order is back under review.`,
                            reason: {reversalNote: reversalReason},
                            icon: "🔄",
                            isCompleted: false,
                            isCurrent: true,
                        }
                    }
                },
                {new: true}
            );
            // disable broadcast if already broadcasted from the object instance of the orderAssignment

        } catch (e) {
            throw new Error(`Reversal failed: ${e.message}`);
        }
    }

    static async orderAssignment(payload) {
        const orderId = payload._id;
        if (!orderId) {
            throw new Error('Order ID is required');
        }
        try {
            await dbClient.connect();
            const {Order, OrderAssignment} = await getOrderModels();

            const order = await Order.findById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status !== 'broadcast') {
                throw new Error(`Order is not in broadcast status. Current status: ${order.status}`);
            }
            // Find eligible drivers based on order requirements
            const eligibleDrivers = await AdminController.findEligibleDrivers(order);
            const broadcastRadius = AdminController.calculateBroadcastRadius(order);

            const orderAssignment = new OrderAssignment({
                orderId: order._id,
                availableDrivers: eligibleDrivers.map(driver => ({
                    driverId: driver._id,
                    distance: driver.distance,
                    estimatedArrival: driver.eta,
                    notifiedAt: new Date(),
                    responded: false
                })) || [],
                assignmentStrategy: 'nearest',
                broadcastRadius,
                maxDrivers: 1000,
                timeoutDuration: 15000, // 15 minutes
                status: 'broadcasting'
            });

            await orderAssignment.save();

            // Update order tracking
            // await Order.findByIdAndUpdate(orderId, {
            //     $push: {
            //         orderTrackingHistory: {
            //             status: 'driver_assignment_started',
            //             timestamp: new Date(),
            //             title: 'Broadcasting to Drivers',
            //             description: 'Order is now available for nearby drivers',
            //             icon: '📡',
            //             isCompleted: false,
            //             isCurrent: true
            //         }
            //     }
            // });

            // we send a websocke to our node server to notify drivers
            // then when our nodeJs server recieves it , it will implment the notifyDrivers function
            // this will be done at the client side since our socket is client only
            return {
                success: true,
                orderAssignment: JSON.parse(JSON.stringify(orderAssignment)),
                message: 'Order broadcasting started'
            };

        } catch (error) {
            console.error('Order assignment error:', error);
            throw new Error(`Order assignment failed: ${error.message}`);
        }
    }

    static async findEligibleDrivers(order) {
        const {Driver} = await getModels();

        const pickupCoords = order.location.pickUp.coordinates.coordinates;
        const maxDistance = AdminController.calculateBroadcastRadius(order);

        // Query for eligible drivers with geospatial search
        return await Driver.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: pickupCoords // [lng, lat]
                    },
                    distanceField: 'distance',
                    maxDistance: maxDistance,
                    spherical: true,
                    query: {
                        availabilityStatus: 'online',
                        'verification.overallStatus': 'approved',
                        'vehicleDetails.type': {
                            $in: order.vehicleRequirements
                        },
                        // Ensure driver is not on another trip
                        'operationalStatus.currentOrderId': {$exists: false}
                    }
                }
            },
            {
                $match: {
                    // Additional filters
                    // 'performance.averageRating': { $gte: 3.0 },
                    'verification.documentsStatus.license': 'approved',
                    'verification.documentsStatus.vehicleRegistration': 'approved',
                    'verification.documentsStatus.insurance': 'approved'
                }
            },
            {
                $addFields: {
                    // Calculate priority score
                    priorityScore: {
                        $add: [
                            {$multiply: ['$performance.averageRating', 20]}, // Rating weight
                            {$multiply: ['$performance.completionRate', 0.5]}, // Completion rate
                            {
                                $cond: [
                                    {$lt: ['$distance', 2000]}, // Very close drivers get bonus
                                    30,
                                    0
                                ]
                            }
                        ]
                    },
                    // Estimate arrival time (distance / average speed)
                    eta: {
                        $divide: [
                            '$distance',
                            {$multiply: [25, 16.67]} // 25 km/h in m/s
                        ]
                    }
                }
            },
            {
                $sort: {
                    priorityScore: -1,
                    distance: 1
                }
            },
            {
                $limit: 1000
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    phoneNumber: 1,
                    'vehicleDetails.type': 1,
                    'vehicleDetails.plateNumber': 1,
                    'performance.averageRating': 1,
                    distance: 1,
                    eta: 1,
                    priorityScore: 1,
                    'currentLocation.coordinates': 1
                }
            }
        ]);
    }

    /**
     * Helper: Calculate dynamic broadcast radius based on order
     */
    static calculateBroadcastRadius(order) {
        let radius = 5000; // Base 5km

        if (order.priority === 'urgent') radius = 10000;
        if (order.flags.isUrgent) radius = 15000;
        if (order.priority === 'high') radius = 8000;

        // Increase for hard-to-deliver items
        if (order.package.isFragile) radius += 2000;
        if (order.package.requiresSpecialHandling) radius += 2000;

        return radius;
    }

    /**
     * Helper: Send notifications to drivers
     */
    static async notifyDrivers(drivers, order, assignmentId) {
        // Implement push notification logic
        console.log(`Notifying ${drivers.length} drivers about order ${order.orderRef}`);
        // TODO: Integrate with Firebase/OneSignal/etc
    }

    /**
     * Get users for deletion interface with search and pagination
     */
    static async getUsersForDeletion(params = {}) {
        const {page = 1, limit = 100, search = ''} = params;

        try {
            await dbClient.connect();
            const {AAngBase} = await getModels();

            const skip = (page - 1) * limit;
            let searchQuery = {};

            // Build search query
            if (search && search.trim()) {
                const searchTrim = search.trim();

                // Check if search looks like a MongoDB ObjectId
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchTrim);

                searchQuery.$or = [
                    {email: {$regex: searchTrim, $options: 'i'}},
                    {fullName: {$regex: searchTrim, $options: 'i'}},
                    ...(isObjectId ? [{_id: searchTrim}] : [])
                ];
            }

            // Fetch users with minimal fields for performance
            const users = await AAngBase.find(searchQuery)
                .select('_id email fullName role status createdAt')
                .limit(parseInt(limit))
                .skip(skip)
                .sort({createdAt: -1})
                .lean();

            // Get total count for pagination
            const totalUsers = await AAngBase.countDocuments(searchQuery);

            return {
                data: JSON.parse(JSON.stringify(users)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers,
                    hasNext: page < Math.ceil(totalUsers / limit),
                    hasPrev: page > 1
                }
            };

        } catch (err) {
            console.error('User fetch error:', err);
            throw new Error('Failed to fetch users for deletion');
        }
    }

    /**
     * Get orders for deletion interface with search and pagination
     */
    static async getOrdersForDeletion(params = {}) {
        const {page = 1, limit = 100, search = ''} = params;

        try {
            await dbClient.connect();
            const {Order} = await getOrderModels();
            const {AAngBase} = await getModels();

            const skip = (page - 1) * limit;
            let searchQuery = {};

            // Build search query
            if (search && search.trim()) {
                const searchTrim = search.trim();
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchTrim);

                // Try to find user by email first
                let userIdFromEmail = null;
                if (searchTrim.includes('@')) {
                    const user = await AAngBase.findOne({
                        email: {$regex: searchTrim, $options: 'i'}
                    }).select('_id');

                    if (user) {
                        userIdFromEmail = user._id;
                    }
                }

                searchQuery.$or = [
                    {orderRef: {$regex: searchTrim, $options: 'i'}},
                    ...(isObjectId ? [
                        {_id: searchTrim},
                        {clientId: searchTrim}
                    ] : []),
                    ...(userIdFromEmail ? [{clientId: userIdFromEmail}] : [])
                ];
            }

            // Fetch orders with minimal fields
            const orders = await Order.find(searchQuery)
                .select('_id orderRef clientId status createdAt pricing')
                .limit(parseInt(limit))
                .skip(skip)
                .sort({createdAt: -1})
                .lean();

            // Fetch client emails for display
            const clientIds = [...new Set(orders.map(o => o.clientId).filter(Boolean))];
            const clients = await AAngBase.find({
                _id: {$in: clientIds}
            }).select('_id email');

            // Create client email map
            const clientMap = {};
            clients.forEach(c => {
                clientMap[c._id.toString()] = c.email;
            });

            // Attach client emails to orders
            const ordersWithEmails = orders.map(order => ({
                ...order,
                clientEmail: clientMap[order.clientId?.toString()] || 'Unknown'
            }));

            // Get total count for pagination
            const totalOrders = await Order.countDocuments(searchQuery);

            return {
                data: JSON.parse(JSON.stringify(ordersWithEmails)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalOrders / limit),
                    totalOrders,
                    hasNext: page < Math.ceil(totalOrders / limit),
                    hasPrev: page > 1
                }
            };

        } catch (err) {
            console.error('Order fetch error:', err);
            throw new Error('Failed to fetch orders for deletion');
        }
    }

    static async systemDeleteUser(userIds) {
        // Connect to database
        await dbClient.connect();
        const {AAngBase} = await getModels();
        const {Order} = await getOrderModels();

        // Delete users
        await AAngBase.deleteMany({
            _id: {$in: userIds}
        });

        // Delete all orders associated with these users
        await Order.deleteMany({
            clientId: {$in: userIds}
        });

        console.log(`✅ Deleted Successfully`);
        return true;
    }

    static async systemDeleteOrder(orderIds) {
        // Connect to database
        await dbClient.connect();

        // we are to clean up any images at the S3 bucket for each order we're deleting
        // take proper ref record

        // Delete orders
        await Order.deleteMany({
            _id: {$in: orderIds}
        });

        console.log(`✅ Deleted Successfully`);
        return true;
    };

    // server/controllers/AdminController.js

    static async getOrderById(orderId) {
        await dbClient.connect();
        const order = await Order.findById(orderId)
            .populate({
                path: 'clientId',
                select: 'fullName email phoneNumber',
                optional: true // This allows null if document doesn't exist
            })
            .populate({
                path: 'driverId',
                select: 'fullName email phoneNumber vehicleInfo',
                optional: true
            })
            .lean();

        if (!order) {
            throw new Error('Order not found');
        }

        return JSON.parse(JSON.stringify(order));
    }

    static async getClientById(clientId) {
        await dbClient.connect();
        const client = await AAngBase.findById(clientId)
            .select('fullName email phoneNumber profileImage createdAt')
            .lean();

        if (!client) {
            throw new Error('Client not found');
        }


        return JSON.parse(JSON.stringify(client));
    }

    // In your AdminController
    static async updateDriverValidation(payload) {
        await dbClient.connect();
        const {id, action, feedback, adminId} = payload;

        // Validate action
        if (action !== 'approve' && action !== 'reject' && action !== 'suspend') {
            throw new Error('Invalid action');
        }

        // Verify admin exists
        const admin = await Admin.findById(adminId);
        if (!admin) {
            throw new Error('Admin not found');
        }

        // Find driver
        const driver = await Driver.findById(id);
        if (!driver) {
            throw new Error('Driver not found');
        }

        // Map frontend actions to database statuses
        const statusMap = {
            'approve': 'approved',
            'reject': 'rejected',
            'suspend': 'suspended'
        };

        const newStatus = statusMap[action];
        const now = new Date();

        // Update verification status
        driver.verification.overallStatus = newStatus;
        driver.verification.verifiedBy = adminId;
        driver.verification.verificationDate = now;
        driver.verification.lastReviewDate = now;

        // Set rejection reason if applicable
        if (action === 'reject' || action === 'suspend') {
            driver.verification.rejectionReason = feedback;
        }

        // Update individual document statuses based on overall decision
        await AdminController.updateIndividualDocumentStatuses(driver, newStatus, adminId);

        // Add to submission history
        const latestSubmission = driver.verification.submissions[driver.verification.submissions.length - 1];
        if (latestSubmission) {
            latestSubmission.reviewedBy = adminId;
            latestSubmission.reviewedAt = now;
            latestSubmission.status = newStatus;
            latestSubmission.feedback = feedback || '';
        }

        // Update driver status based on verification outcome
        if (action === 'approve') {
            driver.status = 'Active';
            driver.availabilityStatus = 'online'; // They can now go online
        } else if (action === 'suspend') {
            driver.status = 'Suspended';
            driver.availabilityStatus = 'offline'; // Force offline
        } else if (action === 'reject') {
            driver.status = 'Active'; // Keep active but verification rejected
            driver.availabilityStatus = 'offline'; // Can't operate without approval
        }

        // Calculate compliance score
        driver.verification.complianceScore = AdminController.calculateComplianceScore(driver, newStatus);

        await driver.save();

        // TODO: Trigger notifications (email/SMS) to driver
        // TODO: Log admin action in audit trail

        return {
            success: true,
            message: `Driver verification ${action}d successfully`,
            driver: {
                _id: driver._id,
                fullName: driver.fullName,
                status: driver.status,
                verificationStatus: driver.verification.overallStatus
            }
        };
    }

    // Helper to update individual document statuses
    static updateIndividualDocumentStatuses(driver, overallStatus, adminId) {
        const now = new Date();

        // Update basic verification documents
        if (driver.verification.basicVerification) {
            // Identification
            if (driver.verification.basicVerification.identification) {
                driver.verification.basicVerification.identification.status = overallStatus;
                driver.verification.basicVerification.identification.verified = overallStatus === 'approved';
                driver.verification.basicVerification.identification.verifiedAt = now;
                driver.verification.basicVerification.identification.verifiedBy = adminId;
                if (overallStatus === 'rejected') {
                    driver.verification.basicVerification.identification.rejectionReason = 'Part of overall rejection';
                }
            }

            // Passport photo
            if (driver.verification.basicVerification.passportPhoto) {
                driver.verification.basicVerification.passportPhoto.status = overallStatus;
                driver.verification.basicVerification.passportPhoto.verified = overallStatus === 'approved';
                driver.verification.basicVerification.passportPhoto.verifiedAt = now;
                if (overallStatus === 'rejected') {
                    driver.verification.basicVerification.passportPhoto.rejectionReason = 'Part of overall rejection';
                }
            }

            // Bank accounts
            if (driver.verification.basicVerification.bankAccounts) {
                driver.verification.basicVerification.bankAccounts.forEach(account => {
                    account.verified = overallStatus === 'approved';
                    account.verifiedAt = now;
                });
            }

            // Operational area
            if (driver.verification.basicVerification.operationalArea) {
                driver.verification.basicVerification.operationalArea.verified = overallStatus === 'approved';
                driver.verification.basicVerification.operationalArea.verifiedAt = now;
            }
        }

        // Update vehicle-specific verification
        const vehicleType = driver.verification.specificVerification.activeVerificationType;
        if (vehicleType && driver.verification.specificVerification[vehicleType]) {
            const vehicleData = driver.verification.specificVerification[vehicleType];

            // Generic function to update nested document status
            const updateDocumentStatus = (doc) => {
                if (doc && typeof doc === 'object') {
                    if (doc.status !== undefined) {
                        doc.status = overallStatus;
                    }
                    if (doc.verified !== undefined) {
                        doc.verified = overallStatus === 'approved';
                        doc.verifiedAt = now;
                    }
                }
            };

            // Update all document fields in vehicle data
            Object.values(vehicleData).forEach(field => {
                if (field && typeof field === 'object') {
                    if (Array.isArray(field)) {
                        field.forEach(updateDocumentStatus);
                    } else {
                        updateDocumentStatus(field);
                    }
                }
            });
        }
    }

    // Helper to calculate compliance score
    static calculateComplianceScore(driver, status) {
        if (status === 'approved') {
            return 100; // Fully compliant
        } else if (status === 'suspended') {
            return 40; // Partially compliant but suspended
        } else if (status === 'rejected') {
            return 20; // Mostly non-compliant
        }

        // Calculate based on completed verification steps
        let score = 0;
        const basic = driver.verification.basicVerification;
        const specific = driver.verification.specificVerification;

        if (basic?.isComplete) score += 40;
        if (specific?.isComplete) score += 40;
        if (basic?.identification?.verified) score += 10;
        if (basic?.passportPhoto?.verified) score += 10;

        return Math.min(100, score);
    }

    // Notification
    /**
     * Get initial notification data for admin panel
     * Similar to initialOrderData pattern
     */
    // Enhanced initialNotificationData method for AdminController
    // This aligns with getNotifications to provide consistent comprehensive statistics

    static async initialNotificationData(params = {}) {
        const {
            page = 1,
            limit = 100,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search = '',
            category = '',
            priority = '',
            status = '',
            showDeleted = 'false',
            adminActionRequired = '',
            adminActionStatus = '',
            adminActionUrgency = ''
        } = params;

        try {
            await dbClient.connect();

            const skip = (page - 1) * limit;

            // Build search/filter pipeline - DON'T filter deleted by default for admin view
            const matchStage = {};

            // Show deleted filter
            if (showDeleted === 'only') {
                matchStage['deleted.status'] = true;
            } else if (showDeleted === 'false') {
                matchStage['deleted.status'] = false;
            }
            // If 'true' or 'all', show both deleted and non-deleted

            // Add filters
            if (category && category !== 'all') {
                matchStage.category = category;
            }
            if (priority && priority !== 'all') {
                matchStage.priority = priority;
            }
            if (status && status !== 'all') {
                if (status === 'unread') {
                    matchStage['read.status'] = false;
                } else if (status === 'read') {
                    matchStage['read.status'] = true;
                } else {
                    matchStage.status = status;
                }
            }

            // Admin action filters

            if (adminActionRequired !== '') {
                matchStage['adminAction.required'] = adminActionRequired === 'true';
            }
            if (adminActionStatus && adminActionStatus !== 'all') {
                matchStage['adminAction.status'] = adminActionStatus;
            }
            if (adminActionUrgency && adminActionUrgency !== 'all') {
                matchStage['adminAction.urgency'] = adminActionUrgency;
            }

            // Add search functionality
            if (search && search.trim()) {
                matchStage.$or = [
                    {'content.title': {$regex: search.trim(), $options: 'i'}},
                    {'content.body': {$regex: search.trim(), $options: 'i'}},
                    {'content.orderRef': {$regex: search.trim(), $options: 'i'}},
                    {'metadata.orderRef': {$regex: search.trim(), $options: 'i'}}
                ];
            }

            // Build aggregation pipeline
            const pipeline = [
                {$match: matchStage},
                {
                    $addFields: {
                        // Priority score for sorting
                        priorityScore: {
                            $switch: {
                                branches: [
                                    {case: {$eq: ["$priority", "CRITICAL"]}, then: 1000},
                                    {case: {$eq: ["$priority", "URGENT"]}, then: 800},
                                    {case: {$eq: ["$priority", "HIGH"]}, then: 600},
                                    {case: {$eq: ["$priority", "NORMAL"]}, then: 400},
                                    {case: {$eq: ["$priority", "LOW"]}, then: 200}
                                ],
                                default: 400
                            }
                        },
                        // Read status score (unread = higher priority)
                        readScore: {
                            $cond: {
                                if: {$eq: ["$read.status", false]},
                                then: 1000,
                                else: 0
                            }
                        },
                        adminActionScore: {
                            $cond: {
                                if: {$eq: ["$adminAction.required", true]},
                                then: {
                                    $switch: {
                                        branches: [
                                            {case: {$eq: ["$adminAction.status", "PENDING"]}, then: 5000},
                                            {case: {$eq: ["$adminAction.status", "IN_PROGRESS"]}, then: 4000},
                                            {case: {$eq: ["$adminAction.status", "ESCALATED"]}, then: 4500},
                                            {case: {$eq: ["$adminAction.status", "COMPLETED"]}, then: 100},
                                            {case: {$eq: ["$adminAction.status", "REJECTED"]}, then: 50}
                                        ],
                                        default: 0
                                    }
                                },
                                else: 0
                            }
                        },
                        // Admin urgency boost
                        adminUrgencyScore: {
                            $cond: {
                                if: {$eq: ["$adminAction.required", true]},
                                then: {
                                    $switch: {
                                        branches: [
                                            {case: {$eq: ["$adminAction.urgency", "IMMEDIATE"]}, then: 3000},
                                            {case: {$eq: ["$adminAction.urgency", "TODAY"]}, then: 2000},
                                            {case: {$eq: ["$adminAction.urgency", "THIS_WEEK"]}, then: 1000},
                                            {case: {$eq: ["$adminAction.urgency", "WHENEVER"]}, then: 500}
                                        ],
                                        default: 500
                                    }
                                },
                                else: 0
                            }
                        },
                        // Deleted penalty (deleted = lower priority)
                        deletedPenalty: {
                            $cond: {
                                if: {$eq: ["$deleted.status", true]},
                                then: -5000, // Push deleted to bottom
                                else: 0
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        finalScore: {
                            $add: ["$priorityScore", "$readScore", "$adminActionScore", "$adminUrgencyScore", "$deletedPenalty"]
                        }
                    }
                }
            ];

            // Get total count for pagination
            const countPipeline = [...pipeline, {$count: "total"}];
            const [countResult] = await Notification.aggregate(countPipeline);
            const totalFiltered = countResult?.total || 0;

            // Add sorting and pagination
            pipeline.push(
                {
                    $sort: {
                        [sortBy === 'priority' ? 'finalScore' : sortBy]: sortOrder === 'desc' ? -1 : 1,
                        createdAt: -1
                    }
                },
                {$skip: skip},
                {$limit: limit}
            );

            const notifications = await Notification.aggregate(pipeline);

            // Define all possible categories, priorities, and statuses
            const allCategories = ['ORDER', 'DELIVERY', 'SECURITY', 'IDENTITY', 'SYSTEM', 'PAYMENT', 'SOCIAL', 'PROMOTION'];
            const allAdminActionStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ESCALATED'];
            const allAdminActionUrgencies = ['IMMEDIATE', 'TODAY', 'THIS_WEEK', 'WHENEVER'];

            const allPriorities = ['CRITICAL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'];
            const allStatuses = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'EXPIRED'];

            // Enhanced comprehensive statistics pipeline
            const statsPipeline = [
                {
                    $facet: {
                        // Overall system statistics (ALL notifications in DB)
                        totalAll: [{$count: "count"}],
                        totalDeleted: [
                            {$match: {'deleted.status': true}},
                            {$count: "count"}
                        ],
                        totalActive: [
                            {$match: {'deleted.status': false}},
                            {$count: "count"}
                        ],
                        unreadAll: [
                            {$match: {'read.status': false}},
                            {$count: "count"}
                        ],
                        unreadActive: [
                            {$match: {'read.status': false, 'deleted.status': false}},
                            {$count: "count"}
                        ],

                        // admin actions
                        adminActionRequired: [
                            {$match: {'adminAction.required': true}},
                            {$count: "count"}
                        ],
                        adminActionStatusBreakdown: [
                            {$match: {'adminAction.required': true}},
                            {$group: {_id: "$adminAction.status", count: {$sum: 1}}}
                        ],
                        adminActionUrgencyBreakdown: [
                            {$match: {'adminAction.required': true}},
                            {$group: {_id: "$adminAction.urgency", count: {$sum: 1}}}
                        ],
                        adminActionPending: [
                            {$match: {'adminAction.required': true, 'adminAction.status': 'PENDING'}},
                            {$count: "count"}
                        ],
                        adminActionInProgress: [
                            {$match: {'adminAction.required': true, 'adminAction.status': 'IN_PROGRESS'}},
                            {$count: "count"}
                        ],
                        adminActionOverdue: [
                            {$match: {'adminAction.required': true, 'adminAction.sla.isOverdue': true}},
                            {$count: "count"}
                        ],

                        // Category breakdowns (system-wide)
                        systemCategoryBreakdown: [
                            {$group: {_id: "$category", count: {$sum: 1}}}
                        ],
                        activeCategoryBreakdown: [
                            {$match: {'deleted.status': false}},
                            {$group: {_id: "$category", count: {$sum: 1}}}
                        ],
                        filteredCategoryBreakdown: [
                            {$match: matchStage},
                            {$group: {_id: "$category", count: {$sum: 1}}}
                        ],

                        // Priority breakdowns
                        systemPriorityBreakdown: [
                            {$group: {_id: "$priority", count: {$sum: 1}}}
                        ],
                        activePriorityBreakdown: [
                            {$match: {'deleted.status': false}},
                            {$group: {_id: "$priority", count: {$sum: 1}}}
                        ],
                        unreadPriorityBreakdown: [
                            {$match: {'read.status': false, 'deleted.status': false}},
                            {$group: {_id: "$priority", count: {$sum: 1}}}
                        ],
                        filteredPriorityBreakdown: [
                            {$match: matchStage},
                            {$group: {_id: "$priority", count: {$sum: 1}}}
                        ],

                        // Status breakdowns
                        systemStatusBreakdown: [
                            {$group: {_id: "$status", count: {$sum: 1}}}
                        ],
                        activeStatusBreakdown: [
                            {$match: {'deleted.status': false}},
                            {$group: {_id: "$status", count: {$sum: 1}}}
                        ],
                        filteredStatusBreakdown: [
                            {$match: matchStage},
                            {$group: {_id: "$status", count: {$sum: 1}}}
                        ],

                        // User statistics
                        topUsers: [
                            {$group: {_id: "$userId", count: {$sum: 1}}},
                            {$sort: {count: -1}},
                            {$limit: 10}
                        ],

                        // Recent activity (last 7 days)
                        recentActivity: [
                            {
                                $match: {
                                    createdAt: {$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        $dateToString: {format: "%Y-%m-%d", date: "$createdAt"}
                                    },
                                    count: {$sum: 1}
                                }
                            },
                            {$sort: {_id: 1}}
                        ]
                    }
                }
            ];

            const [statsResult] = await Notification.aggregate(statsPipeline);

            // Helper function to convert array to object with default values
            const arrayToObject = (array, defaultKeys, defaultValue = 0) => {
                const result = {};
                defaultKeys.forEach(key => {
                    result[key] = defaultValue;
                });
                array.forEach(item => {
                    result[item._id] = item.count;
                });
                return result;
            };

            // Process all statistics
            const systemCategoryStats = arrayToObject(statsResult.systemCategoryBreakdown || [], allCategories);
            const activeCategoryStats = arrayToObject(statsResult.activeCategoryBreakdown || [], allCategories);
            const filteredCategoryStats = arrayToObject(statsResult.filteredCategoryBreakdown || [], allCategories);

            // NEW: Admin action statistics
            const adminActionStatusStats = arrayToObject(statsResult.adminActionStatusBreakdown || [], allAdminActionStatuses);
            const adminActionUrgencyStats = arrayToObject(statsResult.adminActionUrgencyBreakdown || [], allAdminActionUrgencies);

            const systemPriorityStats = arrayToObject(statsResult.systemPriorityBreakdown || [], allPriorities);
            const activePriorityStats = arrayToObject(statsResult.activePriorityBreakdown || [], allPriorities);
            const unreadPriorityStats = arrayToObject(statsResult.unreadPriorityBreakdown || [], allPriorities);
            const filteredPriorityStats = arrayToObject(statsResult.filteredPriorityBreakdown || [], allPriorities);

            const systemStatusStats = arrayToObject(statsResult.systemStatusBreakdown || [], allStatuses);
            const activeStatusStats = arrayToObject(statsResult.activeStatusBreakdown || [], allStatuses);
            const filteredStatusStats = arrayToObject(statsResult.filteredStatusBreakdown || [], allStatuses);

            // Calculate delivery and read rates
            const totalInSystem = statsResult.totalAll[0]?.count || 1;
            const totalDelivered = systemStatusStats.SENT + systemStatusStats.DELIVERED + systemStatusStats.READ;
            const deliveryRate = Math.round((totalDelivered / totalInSystem) * 100);
            const readRate = Math.round((systemStatusStats.READ / totalInSystem) * 100);

            // Comprehensive statistics matching getNotifications structure
            const totalStatistics = {
                // Basic counts - TOTAL includes deleted
                total: statsResult.totalAll[0]?.count || 0,
                totalActive: statsResult.totalActive[0]?.count || 0,
                totalDeleted: statsResult.totalDeleted[0]?.count || 0,
                unread: statsResult.unreadActive[0]?.count || 0, // Active unread only
                unreadAll: statsResult.unreadAll[0]?.count || 0, // Including deleted
                read: (statsResult.totalActive[0]?.count || 0) - (statsResult.unreadActive[0]?.count || 0),

                // Category statistics
                byCategory: systemCategoryStats, // All including deleted
                activeByCategory: activeCategoryStats, // Active only
                filteredByCategory: filteredCategoryStats, // Based on current filters

                adminAction: {
                    required: statsResult.adminActionRequired[0]?.count || 0,
                    pending: statsResult.adminActionPending[0]?.count || 0,
                    inProgress: statsResult.adminActionInProgress[0]?.count || 0,
                    overdue: statsResult.adminActionOverdue[0]?.count || 0,
                    byStatus: adminActionStatusStats,
                    byUrgency: adminActionUrgencyStats
                },

                // Priority statistics
                byPriority: systemPriorityStats, // All including deleted
                activeByPriority: activePriorityStats, // Active only
                unreadByPriority: unreadPriorityStats, // Active unread
                filteredByPriority: filteredPriorityStats, // Based on current filters

                // Status statistics
                byStatus: systemStatusStats, // All including deleted
                activeByStatus: activeStatusStats, // Active only
                filteredByStatus: filteredStatusStats, // Based on current filters

                // Quick access metrics (active only for UI display)
                critical: activePriorityStats.CRITICAL || 0,
                urgent: activePriorityStats.URGENT || 0,
                high: activePriorityStats.HIGH || 0,
                adminActionPending: statsResult.adminActionPending[0]?.count || 0,
                adminActionUrgent: adminActionUrgencyStats.IMMEDIATE || 0,


                // Performance metrics
                deliveryRate,
                readRate,
                failedCount: systemStatusStats.FAILED || 0,
                pendingCount: systemStatusStats.PENDING || 0,

                // User statistics
                topUsers: statsResult.topUsers || [],
                uniqueUsers: statsResult.topUsers?.length || 0,

                // Recent activity
                recentActivity: statsResult.recentActivity || [],
                last7DaysTotal: statsResult.recentActivity?.reduce((sum, day) => sum + day.count, 0) || 0,

                // Filter context
                isFiltered: !!(search || category || priority || status || showDeleted !== 'false'),
                activeFilters: {
                    search: search || null,
                    category: category || null,
                    priority: priority || null,
                    status: status || null,
                    showDeleted: showDeleted || 'false',
                    adminActionRequired: adminActionRequired || null,
                    adminActionStatus: adminActionStatus || null,
                    adminActionUrgency: adminActionUrgency || null
                }
            };

            const result = {
                initialNotificationData: notifications,
                totalStatistics,
                pagination: {
                    page,
                    limit,
                    totalPages: Math.ceil(totalFiltered / limit),
                    totalResults: totalFiltered,
                    hasNextPage: page < Math.ceil(totalFiltered / limit),
                    hasPrevPage: page > 1
                }
            };

            return JSON.parse(JSON.stringify(result));

        } catch (err) {
            console.error('Notification fetch error:', err);
            throw new Error('Failed to fetch notifications data');
        }
    }


    // used with API
    static async getNotifications(params = {}) {
        const {
            page = 1,
            limit = 100,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search = '',
            category = '',
            priority = '',
            status = '',
            showDeleted = 'false',
            adminActionRequired = '',
            adminActionStatus = '',
            adminActionUrgency = ''
        } = params;

        try {
            await dbClient.connect();

            const skip = (page - 1) * limit;

            // Build search/filter pipeline
            const matchStage = {};

            // Show deleted filter
            if (showDeleted === 'only') {
                matchStage['deleted.status'] = true;
            } else if (showDeleted === 'false') {
                matchStage['deleted.status'] = false;
            }
            // If 'true' or 'all', show both

            // Add filters - Only apply if value exists and is not empty
            if (category && category.trim() && category !== 'all') {
                matchStage.category = category;
            }
            if (priority && priority.trim() && priority !== 'all') {
                matchStage.priority = priority;
            }
            if (status && status.trim() && status !== 'all') {
                if (status === 'unread') {
                    matchStage['read.status'] = false;
                } else if (status === 'read') {
                    matchStage['read.status'] = true;
                } else {
                    matchStage.status = status;
                }
            }

            // NEW: Admin action filters
            if (adminActionRequired !== '') {
                matchStage['adminAction.required'] = adminActionRequired === 'true';
            }
            if (adminActionStatus && adminActionStatus !== 'all') {
                matchStage['adminAction.status'] = adminActionStatus;
            }
            if (adminActionUrgency && adminActionUrgency !== 'all') {
                matchStage['adminAction.urgency'] = adminActionUrgency;
            }

            // Add search functionality
            if (search && search.trim()) {
                matchStage.$or = [
                    {'content.title': {$regex: search.trim(), $options: 'i'}},
                    {'content.body': {$regex: search.trim(), $options: 'i'}},
                    {'content.orderRef': {$regex: search.trim(), $options: 'i'}},
                    {'metadata.orderRef': {$regex: search.trim(), $options: 'i'}}
                ];
            }

            // Build aggregation pipeline for notifications
            const pipeline = [
                {$match: matchStage},
                {
                    $addFields: {
                        // Priority score for intelligent sorting
                        priorityScore: {
                            $switch: {
                                branches: [
                                    {case: {$eq: ["$priority", "CRITICAL"]}, then: 1000},
                                    {case: {$eq: ["$priority", "URGENT"]}, then: 800},
                                    {case: {$eq: ["$priority", "HIGH"]}, then: 600},
                                    {case: {$eq: ["$priority", "NORMAL"]}, then: 400},
                                    {case: {$eq: ["$priority", "LOW"]}, then: 200}
                                ],
                                default: 400
                            }
                        },
                        // Read status score (unread = higher priority)
                        readScore: {
                            $cond: {
                                if: {$eq: ["$read.status", false]},
                                then: 1000,
                                else: 0
                            }
                        },
                        // NEW: Admin action priority boost (admin actions get highest priority)
                        adminActionScore: {
                            $cond: {
                                if: {$eq: ["$adminAction.required", true]},
                                then: {
                                    $switch: {
                                        branches: [
                                            {case: {$eq: ["$adminAction.status", "PENDING"]}, then: 5000},
                                            {case: {$eq: ["$adminAction.status", "IN_PROGRESS"]}, then: 4000},
                                            {case: {$eq: ["$adminAction.status", "ESCALATED"]}, then: 4500},
                                            {case: {$eq: ["$adminAction.status", "COMPLETED"]}, then: 100},
                                            {case: {$eq: ["$adminAction.status", "REJECTED"]}, then: 50}
                                        ],
                                        default: 0
                                    }
                                },
                                else: 0
                            }
                        },
                        // NEW: Admin urgency boost
                        adminUrgencyScore: {
                            $cond: {
                                if: {$eq: ["$adminAction.required", true]},
                                then: {
                                    $switch: {
                                        branches: [
                                            {case: {$eq: ["$adminAction.urgency", "IMMEDIATE"]}, then: 3000},
                                            {case: {$eq: ["$adminAction.urgency", "TODAY"]}, then: 2000},
                                            {case: {$eq: ["$adminAction.urgency", "THIS_WEEK"]}, then: 1000},
                                            {case: {$eq: ["$adminAction.urgency", "WHENEVER"]}, then: 500}
                                        ],
                                        default: 500
                                    }
                                },
                                else: 0
                            }
                        },
                        // Deleted penalty (deleted = lower priority)
                        deletedPenalty: {
                            $cond: {
                                if: {$eq: ["$deleted.status", true]},
                                then: -5000,
                                else: 0
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        finalScore: {
                            $add: [
                                "$priorityScore",
                                "$readScore",
                                "$adminActionScore",
                                "$adminUrgencyScore",
                                "$deletedPenalty"
                            ]
                        }
                    }
                }
            ];

            // Get total count for pagination
            const countPipeline = [...pipeline, {$count: "total"}];
            const [countResult] = await Notification.aggregate(countPipeline);
            const totalFiltered = countResult?.total || 0;

            // Add sorting and pagination to main pipeline
            pipeline.push(
                {
                    $sort: {
                        [sortBy === 'priority' ? 'finalScore' : sortBy]: sortOrder === 'desc' ? -1 : 1,
                        createdAt: -1
                    }
                },
                {$skip: skip},
                {$limit: limit}
            );

            const notifications = await Notification.aggregate(pipeline);

            // Define all possible categories, priorities, and statuses
            const allCategories = ['ORDER', 'DELIVERY', 'SECURITY', 'IDENTITY', 'SYSTEM', 'PAYMENT', 'SOCIAL', 'PROMOTION'];
            const allPriorities = ['CRITICAL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'];
            const allStatuses = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'EXPIRED'];
            // NEW: Admin action enums
            const allAdminActionStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ESCALATED'];
            const allAdminActionUrgencies = ['IMMEDIATE', 'TODAY', 'THIS_WEEK', 'WHENEVER'];

            // Enhanced comprehensive statistics pipeline
            const statsPipeline = [
                {
                    $facet: {
                        // Overall system statistics (ALL notifications in DB)
                        totalAll: [{$count: "count"}],
                        totalDeleted: [
                            {$match: {'deleted.status': true}},
                            {$count: "count"}
                        ],
                        totalActive: [
                            {$match: {'deleted.status': false}},
                            {$count: "count"}
                        ],
                        unreadAll: [
                            {$match: {'read.status': false}},
                            {$count: "count"}
                        ],
                        unreadActive: [
                            {$match: {'read.status': false, 'deleted.status': false}},
                            {$count: "count"}
                        ],

                        // NEW: Admin action statistics
                        adminActionRequired: [
                            {$match: {'adminAction.required': true}},
                            {$count: "count"}
                        ],
                        adminActionStatusBreakdown: [
                            {$match: {'adminAction.required': true}},
                            {$group: {_id: "$adminAction.status", count: {$sum: 1}}}
                        ],
                        adminActionUrgencyBreakdown: [
                            {$match: {'adminAction.required': true}},
                            {$group: {_id: "$adminAction.urgency", count: {$sum: 1}}}
                        ],
                        adminActionPending: [
                            {$match: {'adminAction.required': true, 'adminAction.status': 'PENDING'}},
                            {$count: "count"}
                        ],
                        adminActionInProgress: [
                            {$match: {'adminAction.required': true, 'adminAction.status': 'IN_PROGRESS'}},
                            {$count: "count"}
                        ],
                        adminActionOverdue: [
                            {$match: {'adminAction.required': true, 'adminAction.sla.isOverdue': true}},
                            {$count: "count"}
                        ],

                        // Category breakdowns
                        systemCategoryBreakdown: [
                            {$group: {_id: "$category", count: {$sum: 1}}}
                        ],
                        activeCategoryBreakdown: [
                            {$match: {'deleted.status': false}},
                            {$group: {_id: "$category", count: {$sum: 1}}}
                        ],
                        filteredCategoryBreakdown: [
                            {$match: matchStage},
                            {$group: {_id: "$category", count: {$sum: 1}}}
                        ],

                        // Priority breakdowns
                        systemPriorityBreakdown: [
                            {$group: {_id: "$priority", count: {$sum: 1}}}
                        ],
                        activePriorityBreakdown: [
                            {$match: {'deleted.status': false}},
                            {$group: {_id: "$priority", count: {$sum: 1}}}
                        ],
                        unreadPriorityBreakdown: [
                            {$match: {'read.status': false, 'deleted.status': false}},
                            {$group: {_id: "$priority", count: {$sum: 1}}}
                        ],
                        filteredPriorityBreakdown: [
                            {$match: matchStage},
                            {$group: {_id: "$priority", count: {$sum: 1}}}
                        ],

                        // Status breakdowns
                        systemStatusBreakdown: [
                            {$group: {_id: "$status", count: {$sum: 1}}}
                        ],
                        activeStatusBreakdown: [
                            {$match: {'deleted.status': false}},
                            {$group: {_id: "$status", count: {$sum: 1}}}
                        ],
                        filteredStatusBreakdown: [
                            {$match: matchStage},
                            {$group: {_id: "$status", count: {$sum: 1}}}
                        ],

                        // User statistics
                        topUsers: [
                            {$group: {_id: "$userId", count: {$sum: 1}}},
                            {$sort: {count: -1}},
                            {$limit: 10}
                        ],

                        // Recent activity (last 7 days)
                        recentActivity: [
                            {
                                $match: {
                                    createdAt: {$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        $dateToString: {format: "%Y-%m-%d", date: "$createdAt"}
                                    },
                                    count: {$sum: 1}
                                }
                            },
                            {$sort: {_id: 1}}
                        ]
                    }
                }
            ];

            const [statsResult] = await Notification.aggregate(statsPipeline);

            // Helper function to convert array to object with default values
            const arrayToObject = (array, defaultKeys, defaultValue = 0) => {
                const result = {};
                defaultKeys.forEach(key => {
                    result[key] = defaultValue;
                });
                array.forEach(item => {
                    result[item._id] = item.count;
                });
                return result;
            };

            // Process all statistics
            const systemCategoryStats = arrayToObject(statsResult.systemCategoryBreakdown || [], allCategories);
            const activeCategoryStats = arrayToObject(statsResult.activeCategoryBreakdown || [], allCategories);
            const filteredCategoryStats = arrayToObject(statsResult.filteredCategoryBreakdown || [], allCategories);

            const systemPriorityStats = arrayToObject(statsResult.systemPriorityBreakdown || [], allPriorities);
            const activePriorityStats = arrayToObject(statsResult.activePriorityBreakdown || [], allPriorities);
            const unreadPriorityStats = arrayToObject(statsResult.unreadPriorityBreakdown || [], allPriorities);
            const filteredPriorityStats = arrayToObject(statsResult.filteredPriorityBreakdown || [], allPriorities);

            const systemStatusStats = arrayToObject(statsResult.systemStatusBreakdown || [], allStatuses);
            const activeStatusStats = arrayToObject(statsResult.activeStatusBreakdown || [], allStatuses);
            const filteredStatusStats = arrayToObject(statsResult.filteredStatusBreakdown || [], allStatuses);

            // NEW: Admin action statistics
            const adminActionStatusStats = arrayToObject(statsResult.adminActionStatusBreakdown || [], allAdminActionStatuses);
            const adminActionUrgencyStats = arrayToObject(statsResult.adminActionUrgencyBreakdown || [], allAdminActionUrgencies);

            // Calculate delivery and read rates
            const totalInSystem = statsResult.totalAll[0]?.count || 1;
            const totalDelivered = systemStatusStats.SENT + systemStatusStats.DELIVERED + systemStatusStats.READ;
            const deliveryRate = Math.round((totalDelivered / totalInSystem) * 100);
            const readRate = Math.round((systemStatusStats.READ / totalInSystem) * 100);

            // Enhanced comprehensive statistics
            const totalStatistics = {
                // Basic counts
                total: statsResult.totalAll[0]?.count || 0,
                totalActive: statsResult.totalActive[0]?.count || 0,
                totalDeleted: statsResult.totalDeleted[0]?.count || 0,
                unread: statsResult.unreadActive[0]?.count || 0,
                unreadAll: statsResult.unreadAll[0]?.count || 0,
                read: (statsResult.totalActive[0]?.count || 0) - (statsResult.unreadActive[0]?.count || 0),

                // Category statistics
                byCategory: systemCategoryStats,
                activeByCategory: activeCategoryStats,
                filteredByCategory: filteredCategoryStats,

                // Priority statistics
                byPriority: systemPriorityStats,
                activeByPriority: activePriorityStats,
                unreadByPriority: unreadPriorityStats,
                filteredByPriority: filteredPriorityStats,

                // Status statistics
                byStatus: systemStatusStats,
                activeByStatus: activeStatusStats,
                filteredByStatus: filteredStatusStats,

                // NEW: Admin action statistics
                adminAction: {
                    required: statsResult.adminActionRequired[0]?.count || 0,
                    pending: statsResult.adminActionPending[0]?.count || 0,
                    inProgress: statsResult.adminActionInProgress[0]?.count || 0,
                    overdue: statsResult.adminActionOverdue[0]?.count || 0,
                    byStatus: adminActionStatusStats,
                    byUrgency: adminActionUrgencyStats
                },

                // Quick access metrics
                critical: activePriorityStats.CRITICAL || 0,
                urgent: activePriorityStats.URGENT || 0,
                high: activePriorityStats.HIGH || 0,
                adminActionPending: statsResult.adminActionPending[0]?.count || 0,
                adminActionUrgent: adminActionUrgencyStats.IMMEDIATE || 0,

                // Performance metrics
                deliveryRate,
                readRate,
                failedCount: systemStatusStats.FAILED || 0,
                pendingCount: systemStatusStats.PENDING || 0,

                // User statistics
                topUsers: statsResult.topUsers || [],
                uniqueUsers: statsResult.topUsers?.length || 0,

                // Recent activity
                recentActivity: statsResult.recentActivity || [],
                last7DaysTotal: statsResult.recentActivity?.reduce((sum, day) => sum + day.count, 0) || 0,

                // Filter context
                isFiltered: !!(search || category || priority || status || showDeleted !== 'false'),
                activeFilters: {
                    search: search || null,
                    category: category || null,
                    priority: priority || null,
                    status: status || null,
                    showDeleted: showDeleted || 'false',
                    adminActionRequired: adminActionRequired || null,
                    adminActionStatus: adminActionStatus || null,
                    adminActionUrgency: adminActionUrgency || null
                }
            };

            const result = {
                success: true,
                notifications,
                stats: totalStatistics,
                pagination: {
                    page,
                    limit,
                    totalPages: Math.ceil(totalFiltered / limit),
                    totalResults: totalFiltered,
                    hasNextPage: page < Math.ceil(totalFiltered / limit),
                    hasPrevPage: page > 1
                }
            };

            return JSON.parse(JSON.stringify(result));

        } catch (err) {
            console.error('Notification fetch error:', err);
            throw new Error('Failed to fetch notifications data');
        }
    }

    /**
     * Fetches top unread notifications for dropdown/badge display
     * Optimized for quick loading in navigation components
     * @param {Object} params - { limit: number }
     * @returns {Promise<Object>} - Notifications and count data
     */
    static async getTopUnreadNotifications(params = {}) {
        const {
            limit = 10,
            adminActionOnly = true
        } = params;

        try {
            await dbClient.connect();

            // Build the base match stage
            const baseMatch = {
                'deleted.status': false,
                'read.status': false
            };

            // If we only want admin action notifications, add that filter
            if (adminActionOnly) {
                baseMatch['adminAction.required'] = true;
                baseMatch['adminAction.status'] = {
                    $in: ['PENDING', 'IN_PROGRESS', 'ESCALATED']
                };
            }

            // Enhanced pipeline with admin action priority
            const pipeline = [
                {
                    $match: baseMatch
                },
                {
                    $addFields: {
                        // Priority score for intelligent sorting
                        priorityScore: {
                            $switch: {
                                branches: [
                                    {case: {$eq: ["$priority", "CRITICAL"]}, then: 1000},
                                    {case: {$eq: ["$priority", "URGENT"]}, then: 800},
                                    {case: {$eq: ["$priority", "HIGH"]}, then: 600},
                                    {case: {$eq: ["$priority", "NORMAL"]}, then: 400},
                                    {case: {$eq: ["$priority", "LOW"]}, then: 200}
                                ],
                                default: 400
                            }
                        },
                        // Admin action priority boost
                        adminActionScore: {
                            $cond: {
                                if: {$eq: ["$adminAction.required", true]},
                                then: {
                                    $switch: {
                                        branches: [
                                            {case: {$eq: ["$adminAction.status", "PENDING"]}, then: 5000},
                                            {case: {$eq: ["$adminAction.status", "ESCALATED"]}, then: 4500},
                                            {case: {$eq: ["$adminAction.status", "IN_PROGRESS"]}, then: 4000},
                                            {case: {$eq: ["$adminAction.status", "COMPLETED"]}, then: 100},
                                            {case: {$eq: ["$adminAction.status", "REJECTED"]}, then: 50}
                                        ],
                                        default: 0
                                    }
                                },
                                else: 0
                            }
                        },
                        // Admin urgency boost
                        adminUrgencyScore: {
                            $cond: {
                                if: {$eq: ["$adminAction.required", true]},
                                then: {
                                    $switch: {
                                        branches: [
                                            {case: {$eq: ["$adminAction.urgency", "IMMEDIATE"]}, then: 3000},
                                            {case: {$eq: ["$adminAction.urgency", "TODAY"]}, then: 2000},
                                            {case: {$eq: ["$adminAction.urgency", "THIS_WEEK"]}, then: 1000},
                                            {case: {$eq: ["$adminAction.urgency", "WHENEVER"]}, then: 500}
                                        ],
                                        default: 500
                                    }
                                },
                                else: 0
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        // COMBINED score - admin actions get massive priority
                        finalScore: {
                            $add: [
                                "$priorityScore",
                                "$adminActionScore",
                                "$adminUrgencyScore"
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        finalScore: -1,
                        createdAt: -1
                    }
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        _id: 1,
                        userId: 1,
                        category: 1,
                        type: 1,
                        priority: 1,
                        content: 1,
                        adminAction: 1,
                        metadata: 1,
                        status: 1,
                        read: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ];

            const notifications = await Notification.aggregate(pipeline);

            // Get the appropriate count based on our filter
            const unreadCount = await Notification.countDocuments(baseMatch);

            // Always get admin action count separately for the store
            const adminActionCount = await Notification.countDocuments({
                'deleted.status': false,
                'read.status': false,
                'adminAction.required': true,
                'adminAction.status': {$in: ['PENDING', 'IN_PROGRESS', 'ESCALATED']}
            });

            const result = {
                success: true,
                notifications,
                unreadCount,
                adminActionCount,
                hasUnread: unreadCount > 0,
                hasAdminActions: adminActionCount > 0,
                adminActionOnly,
                timestamp: new Date().toISOString()
            };

            return JSON.parse(JSON.stringify(result));

        } catch (err) {
            console.log('Top notifications fetch error:', err);
            return {
                success: false,
                notifications: [],
                unreadCount: 0,
                adminActionCount: 0,
                hasUnread: false,
                hasAdminActions: false,
                error: err.message
            };
        }
    }

    /**
     * Marks a notification as read
     * @param {string} notificationId - The notification ID
     * @returns {Promise<Object>}
     */
    static async markNotificationAsRead(notificationId) {
        try {
            await dbClient.connect();

            const result = await Notification.findByIdAndUpdate(
                notificationId,
                {
                    $set: {
                        'read.status': true,
                        'read.readAt': new Date()
                    }
                },
                {new: true}
            );

            if (!result) {
                return {
                    success: false,
                    error: 'Notification not found'
                };
            }

            // Emit socket event for real-time update
            if (global.io && result.userId) {
                global.io.to(result.userId.toString()).emit('notification:updated', {
                    notificationId,
                    action: 'marked_read',
                    timestamp: new Date()
                });
            }

            return {
                success: true,
                message: 'Notification marked as read',
                notification: JSON.parse(JSON.stringify(result))
            };

        } catch (err) {
            console.error('Mark as read error:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Marks all unread notifications as read
     * @returns {Promise<Object>}
     */
    static async markAllNotificationsAsRead() {
        try {
            await dbClient.connect();

            const result = await Notification.updateMany(
                {
                    'deleted.status': false,
                    'read.status': false
                },
                {
                    $set: {
                        'read.status': true,
                        'read.readAt': new Date()
                    }
                }
            );

            // Emit socket event for bulk update
            if (global.io) {
                global.io.emit('notification:bulk-update', {
                    action: 'marked_all_read',
                    modifiedCount: result.modifiedCount,
                    timestamp: new Date()
                });
            }

            return {
                success: true,
                message: `${result.modifiedCount} notifications marked as read`,
                modifiedCount: result.modifiedCount
            };

        } catch (err) {
            console.error('Mark all as read error:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    // Add this method to AdminController

    /**
     * Gets detailed notification data with related entity information
     * @param {string} notificationId - The notification ID
     * @returns {Promise<Object>} - Detailed notification data
     */
    static async getNotificationData(notificationId) {
        try {
            await dbClient.connect();

            // Get notification with populated references
            const notification = await Notification.findById(notificationId).lean();

            if (!notification) {
                return null;
            }

            // Get related entity details if exists
            let relatedEntityData = null;

            if (notification.adminAction?.relatedEntity?.type && notification.adminAction?.relatedEntity?.id) {
                const entityType = notification.adminAction.relatedEntity.type;
                const entityId = notification.adminAction.relatedEntity.id;

                try {
                    switch (entityType) {
                        case 'order':
                            relatedEntityData = await Order.findById(entityId)
                                .populate('userId', 'fullName email phone')
                                .populate('driverId', 'fullName phone vehicleInfo')
                                .lean();
                            break;

                        case 'driver_verification':
                            relatedEntityData = await Driver.findById(entityId)
                                .populate('userId', 'fullName email phone')
                                .lean();
                            break;

                        case 'payment':
                            relatedEntityData = await Payment.findById(entityId)
                                .populate('userId', 'fullName email')
                                .lean();
                            break;

                        case 'user_profile':
                            relatedEntityData = await AAngBase.findById(entityId)
                                .select('fullName email phone role status createdAt')
                                .lean();
                            break;

                        case 'dispute':
                        case 'support_ticket':
                        case 'report':
                            // Add models for these if you have them
                            relatedEntityData = {
                                _id: entityId,
                                type: entityType,
                                status: notification.adminAction.relatedEntity.status
                            };
                            break;
                    }
                } catch (err) {
                    console.error(`Error fetching related entity (${entityType}):`, err);
                }
            }

            // Calculate time metrics
            const timeMetrics = {
                age: notification.createdAt ?
                    Math.round((new Date() - new Date(notification.createdAt)) / 60000) : 0, // minutes

                timeToRead: notification.read?.readAt && notification.createdAt ?
                    Math.round((new Date(notification.read.readAt) - new Date(notification.createdAt)) / 60000) : null,

                timeToHandle: notification.adminAction?.handledBy?.handledAt && notification.createdAt ?
                    Math.round((new Date(notification.adminAction.handledBy.handledAt) - new Date(notification.createdAt)) / 60000) : null,

                timeToComplete: notification.adminAction?.outcome?.completedAt && notification.adminAction?.handledBy?.handledAt ?
                    Math.round((new Date(notification.adminAction.outcome.completedAt) - new Date(notification.adminAction.handledBy.handledAt)) / 60000) : null,

                isOverdue: notification.adminAction?.sla?.dueAt ?
                    new Date() > new Date(notification.adminAction.sla.dueAt) : false,

                timeUntilDue: notification.adminAction?.sla?.dueAt ?
                    Math.round((new Date(notification.adminAction.sla.dueAt) - new Date()) / 60000) : null
            };

            // Get interaction summary
            const interactionSummary = {
                total: notification.metadata?.interactions?.length || 0,
                byAction: {},
                lastInteraction: notification.metadata?.interactions?.length > 0 ?
                    notification.metadata.interactions[notification.metadata.interactions.length - 1] : null
            };

            notification.metadata?.interactions?.forEach(interaction => {
                const action = interaction.action || 'unknown';
                interactionSummary.byAction[action] = (interactionSummary.byAction[action] || 0) + 1;
            });

            const result = {
                notification,
                relatedEntity: relatedEntityData,
                timeMetrics,
                interactionSummary,
                metadata: {
                    fetchedAt: new Date(),
                    canTakeAction: notification.adminAction?.status === 'PENDING' ||
                        notification.adminAction?.status === 'IN_PROGRESS',
                    actionUrl: this.getActionUrl(notification)
                }
            };

            return JSON.parse(JSON.stringify(result));

        } catch (err) {
            console.error('Get notification data error:', err);
            throw new Error('Failed to fetch notification data');
        }
    }

    /**
     * Helper: Generate action URL based on notification type
     */
    static getActionUrl(notification) {
        if (!notification.adminAction?.required) return null;

        const entityType = notification.adminAction.relatedEntity?.type;
        const entityId = notification.adminAction.relatedEntity?.id;

        if (!entityType || !entityId) {
            // Use deepLink if available
            return notification.content?.richContent?.actionButtons?.[0]?.deepLink || null;
        }

        const urlMap = {
            'order': `/admin/orders/${entityId}`,
            'driver_verification': `/admin/drivers/${entityId}/verification`,
            'payment': `/admin/payments/${entityId}`,
            'dispute': `/admin/disputes/${entityId}`,
            'user_profile': `/admin/users/${entityId}`,
            'support_ticket': `/admin/support/${entityId}`,
            'report': `/admin/reports/${entityId}`,
            'system_alert': `/admin/system/alerts`
        };

        return urlMap[entityType] || null;
    }


    /**
     * Deletes a notification (soft delete)
     * @param {string} notificationId - The notification ID
     * @returns {Promise<Object>}
     */
    static async deleteNotification(notificationId) {
        try {
            await dbClient.connect();

            const result = await Notification.findByIdAndUpdate(
                notificationId,
                {
                    $set: {
                        'deleted.status': true,
                        'deleted.deletedAt': new Date()
                    }
                },
                {new: true}
            );

            if (!result) {
                return {
                    success: false,
                    error: 'Notification not found'
                };
            }

            // Emit socket event
            if (global.io && result.userId) {
                global.io.to(result.userId.toString()).emit('notification:updated', {
                    notificationId,
                    action: 'deleted',
                    timestamp: new Date()
                });
            }

            return {
                success: true,
                message: 'Notification deleted'
            };

        } catch (err) {
            console.error('Delete notification error:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Restores a deleted notification
     * @param {string} notificationId - The notification ID
     * @returns {Promise<Object>}
     */
    static async restoreNotification(notificationId) {
        try {
            await dbClient.connect();

            const result = await Notification.findByIdAndUpdate(
                notificationId,
                {
                    $set: {
                        'deleted.status': false,
                        'deleted.deletedAt': null
                    }
                },
                {new: true}
            );

            if (!result) {
                return {
                    success: false,
                    error: 'Notification not found'
                };
            }

            // Emit socket event
            if (global.io && result.userId) {
                global.io.to(result.userId.toString()).emit('notification:updated', {
                    notificationId,
                    action: 'restored',
                    timestamp: new Date()
                });
            }

            return {
                success: true,
                message: 'Notification restored',
                notification: JSON.parse(JSON.stringify(result))
            };

        } catch (err) {
            console.error('Restore notification error:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }


    /**
     * Mark single notification as read
     */
    static async markAsRead(payload) {

        const {notificationId} = payload;
        if (!notificationId) throw new Error('Missing required fields');

        try {
            await dbClient.connect();
            const notification = await Notification.findOne({
                _id: notificationId,
            });

            if (!notification) {
                throw new Error('Notification not found');
            }

            notification.read.status = true;
            notification.read.readAt = new Date();
            notification.status = 'READ';
            await notification.save();

            return ({
                message: 'Notification marked as read',
                notification
            });
        } catch (err) {
            console.error('Mark as read error:', err);
            throw new Error('Failed to mark notification as read');
        }
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(payload) {
        const {id, category} = payload;
        try {
            await dbClient.connect();
            await NotificationService.markAllAsRead(id, category);
            return ({success: 'All notifications marked as read'});
        } catch (err) {
            console.error('Mark all as read error:', err);
            throw new Error('Failed to mark all notifications as read');
        }
    }

    /**
     * Soft delete a notification
     */
    // static async deleteNotification(payload) {
    //     const {notificationId} = payload;
    //
    //     if (!notificationId) throw new Error('Missing required fields');
    //
    //     try {
    //         await dbClient.connect();
    //         const notification = await Notification.findOne({
    //             _id: notificationId,
    //         });
    //
    //         if (!notification) {
    //             throw new Error('Notification not found');
    //         }
    //
    //         notification.deleted.status = true;
    //         notification.deleted.deletedAt = new Date();
    //         await notification.save();
    //
    //         return ({ message: 'Notification deleted' });
    //     } catch (err) {
    //         console.error('Delete notification error:', err);
    //         return res.status(500).json({ error: 'Failed to delete notification' });
    //     }
    // }

    /**
     * Delete all notifications (soft delete)
     */
    static async deleteAllNotifications(payload) {
        try {
            await dbClient.connect();
            await NotificationService.deleteAllNotifications(payload.userId);
            return ({message: 'All notifications deleted'});
        } catch (err) {
            console.error('Delete all notifications error:', err);
            throw new Error('Failed to delete all notifications');
        }
    }

    /**
     * ADMIN ONLY: Permanently delete soft-deleted notifications
     * This is the final cleanup that removes notifications from DB
     */
    static async permanentlyDeleteNotifications(payload) {
        try {
            await dbClient.connect();
            const {notificationIds = [], deleteAll = false} = payload;

            let result;
            if (deleteAll) {
                // Delete all soft-deleted notifications across all users
                result = await Notification.deleteMany({
                    'deleted.status': true
                });
            } else if (notificationIds.length > 0) {
                // Delete specific notifications
                result = await Notification.deleteMany({
                    _id: {$in: notificationIds},
                    'deleted.status': true
                });
            } else {
                return ({
                    error: 'Either provide notificationIds or set deleteAll to true'
                });
            }

            return ({message: 'Notifications permanently deleted'});
        } catch (err) {
            console.error('Permanent delete error:', err);
            throw Error('Failed to permanently delete notifications');
        }
    }

    /**
     * Get notification statistics for admin dashboard
     */
    static async getNotificationStatistics(payload) {
        const {userData} = payload
        try {
            await dbClient.connect();
            const stats = await NotificationService.getNotificationStats(userData._id);

            // Get additional admin-specific stats
            const [categoryBreakdown, statusBreakdown, recentActivity] = await Promise.all([
                Notification.aggregate([
                    {$match: {userId: userData._id, 'deleted.status': false}},
                    {$group: {_id: '$category', count: {$sum: 1}}}
                ]),
                Notification.aggregate([
                    {$match: {userId: userData._id, 'deleted.status': false}},
                    {$group: {_id: '$status', count: {$sum: 1}}}
                ]),
                Notification.find({
                    userId: userData._id,
                    'deleted.status': false
                })
                    .sort({createdAt: -1})
                    .limit(10)
                    .lean()
            ]);

            return ({
                ...stats,
                categoryBreakdown: categoryBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                statusBreakdown: statusBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                recentActivity
            });
        } catch (err) {
            console.error('Get statistics error:', err);
            return ({error: 'Failed to fetch statistics'});
        }
    }

    /**
     * Create a notification for a specific user (admin action)
     * Used when admin needs to send notifications to drivers/clients
     */
    static async createNotificationForUser(req, res) {
        try {
            await dbClient.connect();
            const {
                targetUserId,
                type,
                customContent,
                metadata = {},
                priority = 'NORMAL'
            } = req.body;

            if (!targetUserId || !type) {
                return res.status(400).json({
                    error: 'targetUserId and type are required'
                });
            }

            const notification = await NotificationService.createNotification({
                userId: targetUserId,
                type,
                customContent,
                metadata: {
                    ...metadata,
                    source: 'admin',
                    adminId: userData._id
                },
                priority
            });

            return res.status(201).json({
                message: 'Notification created successfully',
                notification
            });
        } catch (err) {
            console.error('Create notification error:', err);
            return res.status(500).json({error: 'Failed to create notification'});
        }
    }
}

export default AdminController;