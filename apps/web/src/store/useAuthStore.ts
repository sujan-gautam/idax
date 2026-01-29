import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface Tenant {
    id: string;
    name: string;
    plan: string;
}

interface AuthState {
    user: User | null;
    tenant: Tenant | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;

    setAuth: (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, tenantName: string) => Promise<void>;
    logout: () => void;
    refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,

            setAuth: (user, tenant, accessToken, refreshToken) => {
                set({ user, tenant, accessToken, refreshToken, error: null })
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
            },

            clearAuth: () => {
                set({ user: null, tenant: null, accessToken: null, refreshToken: null })
                delete api.defaults.headers.common['Authorization']
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
            },

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),

            login: async (email, password) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await api.post('/auth/login', { email, password })
                    const { user, tenant, accessToken, refreshToken } = response.data

                    localStorage.setItem('accessToken', accessToken)
                    localStorage.setItem('refreshToken', refreshToken)

                    get().setAuth(user, tenant, accessToken, refreshToken)
                } catch (error: any) {
                    const message = error.response?.data?.error || 'Login failed'
                    set({ error: message })
                    throw new Error(message)
                } finally {
                    set({ isLoading: false })
                }
            },

            register: async (email, password, name, tenantName) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await api.post('/auth/register', {
                        email,
                        password,
                        name,
                        tenantName
                    })
                    const { user, tenant, accessToken, refreshToken } = response.data

                    localStorage.setItem('accessToken', accessToken)
                    localStorage.setItem('refreshToken', refreshToken)

                    get().setAuth(user, tenant, accessToken, refreshToken)
                } catch (error: any) {
                    const message = error.response?.data?.error || 'Registration failed'
                    set({ error: message })
                    throw new Error(message)
                } finally {
                    set({ isLoading: false })
                }
            },

            logout: () => {
                get().clearAuth()
            },

            refreshAuth: async () => {
                const refreshToken = localStorage.getItem('refreshToken')
                if (!refreshToken) {
                    get().clearAuth()
                    return
                }

                set({ isLoading: true })
                try {
                    const response = await api.post('/auth/refresh', { refreshToken })
                    const { accessToken, user, tenant } = response.data

                    localStorage.setItem('accessToken', accessToken)
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

                    set({ user, tenant, accessToken, error: null })
                } catch (error) {
                    get().clearAuth()
                    throw error
                } finally {
                    set({ isLoading: false })
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                user: state.user,
                tenant: state.tenant
            }),
        }
    )
)
