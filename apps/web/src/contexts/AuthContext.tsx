import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../services/api';

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

interface AuthContextType {
    user: User | null;
    tenant: Tenant | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, tenantName: string) => Promise<void>;
    logout: () => void;
    refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const loadAuthState = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            if (accessToken && refreshToken) {
                try {
                    // Verify token and get user info
                    await refreshAuth();
                } catch (error) {
                    console.error('Failed to restore auth state:', error);
                    clearAuthState();
                }
            }
            setIsLoading(false);
        };

        loadAuthState();
    }, []);

    // Auto-refresh token before expiry (every 10 minutes)
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(async () => {
            try {
                await refreshAuth();
            } catch (error) {
                console.error('Token refresh failed:', error);
                logout();
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, [user]);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, tenant, accessToken, refreshToken } = response.data;

            // Store tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Update state
            setUser(user);
            setTenant(tenant);

            // Set default auth header
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (
        email: string,
        password: string,
        name: string,
        tenantName: string
    ) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                name,
                tenantName
            });
            const { user, tenant, accessToken, refreshToken } = response.data;

            // Store tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Update state
            setUser(user);
            setTenant(tenant);

            // Set default auth header
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        clearAuthState();
        setUser(null);
        setTenant(null);
    }, []);

    const refreshAuth = useCallback(async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        try {
            const response = await api.post('/auth/refresh', { refreshToken });
            const { accessToken } = response.data;

            // Update access token
            localStorage.setItem('accessToken', accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Get current user info
            const userResponse = await api.get('/auth/me');
            const { user, tenant } = userResponse.data;

            setUser(user);
            setTenant(tenant);
        } catch (error) {
            clearAuthState();
            throw error;
        }
    }, []);

    const clearAuthState = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
    };

    const value: AuthContextType = {
        user,
        tenant,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshAuth
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
