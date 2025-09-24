// AdminController -- every matter related to admin execution
import getModels from "@/server/models/AAng/AAngLogistics";
import dbClient from "@/server/db/mongoDb";
import mongoose from "mongoose";
import AuthController from "@/server/controllers/AuthController";

const {Admin, AAngBase} = await getModels()
await dbClient.connect();

class AdminController {

    static async adminProfile(adminId) {
        try {
            await dbClient.connect();
            const adminData = await Admin.findById(
                mongoose.Types.ObjectId.createFromHexString(adminId)
            ).select('-password -security.backupCodes'); // Exclude sensitive data

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
     * @description Get all users
     * @params {Object}
     *   page: number;
     *   limit: number;
     *   search?: string;
     * @returns {Promise<void>}
     * @throws {Error} If the admin is not found
     *
     */
    // In your AdminController class, update the allUser method

    static async allUser(params) {
        const { page = 10, limit = 50, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;

        try {
            await dbClient.connect();

            const skip = (page - 1) * limit;

            // Build search query
            let searchQuery = {};

            if (search && search.trim()) {
                searchQuery.$or = [
                    { email: { $regex: search.trim(), $options: 'i' } },
                    { fullName: { $regex: search.trim(), $options: 'i' } },
                    { phoneNumber: { $regex: search.trim(), $options: 'i' } }
                ];
            }

            // Add role filter
            if (role && role !== 'all') {
                searchQuery.role = { $regex: new RegExp(`^${role}$`, 'i') };
            }

            // Add status filter
            if (status && status !== 'all') {
                searchQuery.status = { $regex: new RegExp(`^${status}$`, 'i') };
            }

            // Build sort object
            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Fetch users with pagination and filters
            const data = await AAngBase.find(searchQuery)
                .select('-password -security.backupCodes')
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
            throw new Error ('Missing required fields');
        }
        try {
            await dbClient.connect();

            // Check if user already exists
            let user = await AAngBase.findOne({email});
            if (user) {
                // Get available auth methods
                throw new Error ('User already exists');
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


}

export default AdminController;