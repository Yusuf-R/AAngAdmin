// src/store/useSystemStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSystemStore = create(
    persist(
        (set, get) => ({
            role: null,
            setRole: (role) => set({ role }),
            clearRole: () => set({ role: null }),
        }),
        {
            name: 'system-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ role: state.role }),
        }
    )
);