import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAdminStore = create(
    persist(
        (set, get) => ({
            // Admin's own profile data
            adminData: null,
            currentUser: null,
            setCurrentUser: (userData) => set({ currentUser: userData }),
            updateUser: (updates) => set((state) => ({
                currentUser: { ...state.currentUser, ...updates }
            })),
            clearUser: () => set({ currentUser: null }),
            clearAdminData: () => set({ adminData: null }),
            clearAll: () => set({ adminData: null, currentUser: null }),
        }),
        {
            name: 'admin-storage',
            // Only persist admin data, not the massive users data
            partialize: (state) => ({
                adminData: state.adminData,
                currentUser: state.currentUser

            }),
        }
    )
);