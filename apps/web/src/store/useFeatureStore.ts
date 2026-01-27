import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'
import { useAuthStore } from './useAuthStore'

interface FeatureFlags {
    [key: string]: boolean;
}

interface Quotas {
    maxProjects: number;
    maxStorageBytes: number;
    maxUploadsPerMonth: number;
    currentProjects: number;
    currentStorageBytes: number;
    currentUploadsThisMonth: number;
}

interface FeatureState {
    flags: FeatureFlags;
    quotas: Quotas | null;
    isLoading: boolean;

    fetchMetadata: () => Promise<void>;
    isFeatureEnabled: (feature: string) => boolean;
}

export const useFeatureStore = create<FeatureState>()(
    (set, get) => ({
        flags: {},
        quotas: null,
        isLoading: false,

        fetchMetadata: async () => {
            const tenantId = useAuthStore.getState().tenant?.id;
            if (!tenantId) return;

            set({ isLoading: true });
            try {
                const response = await api.get(`/tenants/${tenantId}/metadata`, {
                    headers: { 'x-tenant-id': tenantId }
                });
                set({
                    flags: response.data.flags || {},
                    quotas: response.data.quotas || null
                });
            } catch (error) {
                console.error('Failed to fetch feature flags:', error);
            } finally {
                set({ isLoading: false });
            }
        },

        isFeatureEnabled: (feature: string) => {
            return get().flags[feature] === true;
        }
    })
)
