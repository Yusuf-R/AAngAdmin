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
        const payload={userId, strategy}
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
}

export default AdminUtils;