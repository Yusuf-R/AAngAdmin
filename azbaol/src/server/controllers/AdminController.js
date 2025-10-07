// AdminController -- every matter related to admin execution
import getModels from "@/server/models/AAng/AAngLogistics";
import dbClient from "@/server/db/mongoDb";
import mongoose from "mongoose";
import AuthController from "@/server/controllers/AuthController";
import {revalidatePath, revalidateTag} from "next/cache";
import getOrderModels from "@/server/models/Order";
import {NextResponse} from "next/server";

const {Admin, AAngBase} = await getModels()
const {Order} = await getOrderModels();
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
        const {page = 10, limit = 50, search, role, status, sortBy = 'createdAt', sortOrder = 'desc'} = params;

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
            const { userId } = payload
            await dbClient.connect();
            await AAngBase.findByIdAndUpdate(
                {_id: userId},
                {
                    $set: {status: action}
                }
            )
            return ({
                message: `User account has been ${ action }`
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
                message: `User account has been ${ action }`
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
            const { Order } = await getOrderModels();
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
                    { orderRef: { $regex: search.trim(), $options: 'i' } },
                    { "package.description": { $regex: search.trim(), $options: 'i' } },
                    { "location.pickUp.address": { $regex: search.trim(), $options: 'i' } },
                    { "location.dropOff.address": { $regex: search.trim(), $options: 'i' } },
                    { "location.pickUp.landmark": { $regex: search.trim(), $options: 'i' } },
                    { "location.dropOff.landmark": { $regex: search.trim(), $options: 'i' } }
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
                { $match: searchMatchStage },

                {
                    $addFields: {
                        // Priority score: higher score = higher priority
                        priorityScore: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: ["$status", "admin_review"] },
                                        then: 1000
                                    },
                                    {
                                        case: { $eq: ["$status", "admin_rejected"] },
                                        then: 950
                                    },
                                    {
                                        case: { $in: ["$status", ["broadcast", "pending"]] },
                                        then: 800
                                    },
                                    {
                                        case: { $in: ["$status", ["assigned", "confirmed"]] },
                                        then: 750
                                    },
                                    {
                                        case: { $in: ["$status", ["en_route_pickup", "arrived_pickup"]] },
                                        then: 700
                                    },
                                    {
                                        case: { $in: ["$status", ["picked_up", "in_transit", "arrived_dropoff"]] },
                                        then: 600
                                    },
                                    {
                                        case: { $eq: ["$status", "delivered"] },
                                        then: 400
                                    },
                                    {
                                        case: { $in: ["$status", ["failed", "returned"]] },
                                        then: 350
                                    },
                                    {
                                        case: { $eq: ["$status", "cancelled"] },
                                        then: 200
                                    },
                                    {
                                        case: { $eq: ["$status", "draft"] },
                                        then: 100
                                    }
                                ],
                                default: 500
                            }
                        },
                        recencyBonus: {
                            $divide: [
                                { $subtract: [new Date(), "$createdAt"] },
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
                                { $multiply: ["$recencyBonus", 0.1] }
                            ]
                        }
                    }
                }
            ];

            // Get total count for pagination (before skip/limit)
            const countPipeline = [...pipeline, { $count: "total" }];
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
                { $skip: skip },
                { $limit: limit },
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
                { $match: baseMatchStage },
                {
                    $facet: {
                        totalAllOrders: [{ $count: "count" }],
                        statusBreakdown: [
                            { $group: { _id: "$status", count: { $sum: 1 } } }
                        ],
                        revenueStats: [
                            {
                                $match: { "payment.status": "paid" }
                            },
                            {
                                $group: {
                                    _id: null,
                                    revenue: { $sum: "$pricing.totalAmount" },
                                    totalOrders: { $sum: 1 }
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

            const orderData = await Order.findById(_id);
            if (!orderData) {
                throw new Error('Order not found');
            }

            if (status === 'approved') {
                return await Order.findOneAndUpdate(
                    {_id},
                    {
                        $set: {status: 'broadcast'},
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
        const maxDistance = this.calculateBroadcastRadius(order);

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
        const { page = 1, limit = 100, search = '' } = params;

        try {
            await dbClient.connect();
            const { AAngBase } = await getModels();

            const skip = (page - 1) * limit;
            let searchQuery = {};

            // Build search query
            if (search && search.trim()) {
                const searchTrim = search.trim();

                // Check if search looks like a MongoDB ObjectId
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchTrim);

                searchQuery.$or = [
                    { email: { $regex: searchTrim, $options: 'i' } },
                    { fullName: { $regex: searchTrim, $options: 'i' } },
                    ...(isObjectId ? [{ _id: searchTrim }] : [])
                ];
            }

            // Fetch users with minimal fields for performance
            const users = await AAngBase.find(searchQuery)
                .select('_id email fullName role status createdAt')
                .limit(parseInt(limit))
                .skip(skip)
                .sort({ createdAt: -1 })
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
        const { page = 1, limit = 100, search = '' } = params;

        try {
            await dbClient.connect();
            const { Order } = await getOrderModels();
            const { AAngBase } = await getModels();

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
                        email: { $regex: searchTrim, $options: 'i' }
                    }).select('_id');

                    if (user) {
                        userIdFromEmail = user._id;
                    }
                }

                searchQuery.$or = [
                    { orderRef: { $regex: searchTrim, $options: 'i' } },
                    ...(isObjectId ? [
                        { _id: searchTrim },
                        { clientId: searchTrim }
                    ] : []),
                    ...(userIdFromEmail ? [{ clientId: userIdFromEmail }] : [])
                ];
            }

            // Fetch orders with minimal fields
            const orders = await Order.find(searchQuery)
                .select('_id orderRef clientId status createdAt pricing')
                .limit(parseInt(limit))
                .skip(skip)
                .sort({ createdAt: -1 })
                .lean();

            // Fetch client emails for display
            const clientIds = [...new Set(orders.map(o => o.clientId).filter(Boolean))];
            const clients = await AAngBase.find({
                _id: { $in: clientIds }
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
        const { AAngBase } = await getModels();
        const { Order } = await getOrderModels();

        // Delete users
        await AAngBase.deleteMany({
            _id: { $in: userIds }
        });

        // Delete all orders associated with these users
        await Order.deleteMany({
            clientId: { $in: userIds }
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
            _id: { $in: orderIds }
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
}

export default AdminController;