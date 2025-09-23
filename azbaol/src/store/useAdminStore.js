import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAdminStore = create(
    persist(
        (set, get) => ({
            // Admin's own profile data
            adminData: null,
            isLoading: false,
            error: null,

            // Users management data (with pagination)
            users: [],
            totalUsers: 0,
            currentPage: 1,
            usersPerPage: 50,
            usersLoading: false,
            usersError: null,
            usersFilters: {
                search: '',
                role: '',
                status: '',
                sortBy: 'createdAt',
                sortOrder: 'desc'
            },

            // Selected user for detail view/edit
            selectedUser: null,
            selectedUserLoading: false,
            selectedUserError: null,

            // Statistics
            userStats: {
                total: 0,
                active: 0,
                inactive: 0,
                byRole: {}
            },
            statsLoading: false,
            statsError: null,

            // Actions for Admin Data
            setAdminData: (adminData) => set({ adminData }),

            updateAdminProfile: async (updates) => {
                try {
                    const response = await fetch('/api/admin/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates)
                    });

                    if (!response.ok) throw new Error('Failed to update profile');

                    const updatedAdmin = await response.json();
                    set({ adminData: updatedAdmin });
                    return updatedAdmin;
                } catch (error) {
                    throw error;
                }
            },

            clearAdminData: () => set({
                adminData: null,
                users: [],
                totalUsers: 0,
                selectedUser: null
            }),

            fetchAdminData: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.get('/api/admin/profile');
                    set({ adminData: response.data, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // Actions for Users Management
            setUsersFilters: (newFilters) => set({
                usersFilters: { ...get().usersFilters, ...newFilters },
                currentPage: 1 // Reset to first page when filters change
            }),

            fetchUsers: async (page = 1, limit = 50) => {
                set({ usersLoading: true, usersError: null });

                try {
                    const { usersFilters } = get();
                    const params = new URLSearchParams({
                        page: page.toString(),
                        limit: limit.toString(),
                        ...usersFilters
                    });

                    const response = await fetch(`/api/admin/users?${params}`);

                    if (!response.ok) throw new Error('Failed to fetch users');

                    const data = await response.json();

                    set({
                        users: data.users,
                        totalUsers: data.totalCount,
                        currentPage: page,
                        usersPerPage: limit,
                        usersLoading: false
                    });

                    return data;
                } catch (error) {
                    set({ usersError: error.message, usersLoading: false });
                    throw error;
                }
            },

            fetchUserById: async (userId) => {
                set({ selectedUserLoading: true, selectedUserError: null });

                try {
                    const response = await fetch(`/api/admin/users/${userId}`);

                    if (!response.ok) throw new Error('Failed to fetch user');

                    const userData = await response.json();

                    set({
                        selectedUser: userData,
                        selectedUserLoading: false
                    });

                    return userData;
                } catch (error) {
                    set({ selectedUserError: error.message, selectedUserLoading: false });
                    throw error;
                }
            },

            createUser: async (userData) => {
                try {
                    const response = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                    });

                    if (!response.ok) throw new Error('Failed to create user');

                    const newUser = await response.json();

                    // Optimistically add to current list if we're on the first page
                    const { currentPage, usersPerPage, users } = get();
                    if (currentPage === 1 && users.length < usersPerPage) {
                        set({
                            users: [newUser, ...users],
                            totalUsers: get().totalUsers + 1
                        });
                    } else {
                        // Refresh the current page
                        get().fetchUsers(currentPage, usersPerPage);
                    }

                    return newUser;
                } catch (error) {
                    throw error;
                }
            },

            updateUser: async (userId, updates) => {
                const previousUsers = get().users;
                const previousSelectedUser = get().selectedUser;

                // Optimistic update for users list
                set({
                    users: previousUsers.map(user =>
                        user.id === userId ? { ...user, ...updates } : user
                    )
                });

                // Optimistic update for selected user if it's the same user
                if (previousSelectedUser && previousSelectedUser.id === userId) {
                    set({
                        selectedUser: { ...previousSelectedUser, ...updates }
                    });
                }

                try {
                    const response = await fetch(`/api/admin/users/${userId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates)
                    });

                    if (!response.ok) throw new Error('Failed to update user');

                    const updatedUser = await response.json();

                    // Update with actual server response
                    set({
                        users: previousUsers.map(user =>
                            user.id === userId ? updatedUser : user
                        )
                    });

                    if (previousSelectedUser && previousSelectedUser.id === userId) {
                        set({ selectedUser: updatedUser });
                    }

                    return updatedUser;
                } catch (error) {
                    // Revert on error
                    set({
                        users: previousUsers,
                        selectedUser: previousSelectedUser
                    });
                    throw error;
                }
            },

            deleteUser: async (userId) => {
                const previousUsers = get().users;
                const { selectedUser } = get();

                // Optimistic update
                set({
                    users: previousUsers.filter(user => user.id !== userId),
                    totalUsers: get().totalUsers - 1,
                    // Clear selected user if it's the deleted user
                    selectedUser: selectedUser?.id === userId ? null : selectedUser
                });

                try {
                    const response = await fetch(`/api/admin/users/${userId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('Failed to delete user');

                    // Check if we need to refetch to maintain pagination
                    const { currentPage, usersPerPage, users } = get();
                    if (users.length === 0 && currentPage > 1) {
                        get().fetchUsers(currentPage - 1, usersPerPage);
                    }
                } catch (error) {
                    // Revert on error
                    set({
                        users: previousUsers,
                        totalUsers: get().totalUsers + 1,
                        selectedUser: selectedUser
                    });
                    throw error;
                }
            },

            // Statistics actions
            fetchUserStats: async () => {
                set({ statsLoading: true, statsError: null });

                try {
                    const response = await fetch('/api/admin/users/stats');

                    if (!response.ok) throw new Error('Failed to fetch user statistics');

                    const stats = await response.json();

                    set({
                        userStats: stats,
                        statsLoading: false
                    });

                    return stats;
                } catch (error) {
                    set({ statsError: error.message, statsLoading: false });
                    throw error;
                }
            },

            // Bulk operations
            bulkUpdateUsers: async (userIds, updates) => {
                try {
                    const response = await fetch('/api/admin/users/bulk-update', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userIds, updates })
                    });

                    if (!response.ok) throw new Error('Failed to bulk update users');

                    // Refresh current page
                    const { currentPage, usersPerPage } = get();
                    get().fetchUsers(currentPage, usersPerPage);

                    return await response.json();
                } catch (error) {
                    throw error;
                }
            },

            bulkDeleteUsers: async (userIds) => {
                const previousUsers = get().users;

                // Optimistic update
                set({
                    users: previousUsers.filter(user => !userIds.includes(user.id)),
                    totalUsers: get().totalUsers - userIds.length
                });

                try {
                    const response = await fetch('/api/admin/users/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userIds })
                    });

                    if (!response.ok) throw new Error('Failed to bulk delete users');

                    // Check if we need to refetch
                    const { currentPage, usersPerPage, users } = get();
                    if (users.length === 0 && currentPage > 1) {
                        get().fetchUsers(currentPage - 1, usersPerPage);
                    }
                } catch (error) {
                    // Revert on error
                    set({
                        users: previousUsers,
                        totalUsers: get().totalUsers + userIds.length
                    });
                    throw error;
                }
            }
        }),
        {
            name: 'admin-storage',
            // Only persist admin data, not the massive users data
            partialize: (state) => ({
                adminData: state.adminData,

            }),
        }
    )
);