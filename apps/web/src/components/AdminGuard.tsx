/**
 * ADMIN GUARD
 * Comprehensive access control for admin routes
 * - Verifies authentication
 * - Checks admin role (ADMIN or OWNER)
 * - Shows loading state during verification
 * - Redirects unauthorized users
 * - Logs access attempts
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface AdminGuardProps {
    children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuthStore();
    const [verifying, setVerifying] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        verifyAccess();
    }, [user, isAuthenticated, authLoading]);

    useEffect(() => {
        if (accessDenied && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (accessDenied && countdown === 0) {
            navigate('/dashboard');
        }
    }, [accessDenied, countdown, navigate]);

    const verifyAccess = async () => {
        // Wait for auth to finish loading
        if (authLoading) {
            return;
        }

        // Check if user is authenticated
        if (!isAuthenticated || !user) {
            console.warn('[AdminGuard] Unauthorized access attempt - not authenticated');
            setAccessDenied(true);
            setVerifying(false);
            return;
        }

        // Check if user has admin role
        const hasAdminAccess = user.role === 'ADMIN' || user.role === 'OWNER';

        if (!hasAdminAccess) {
            console.warn(`[AdminGuard] Unauthorized access attempt by user ${user.email} with role ${user.role}`);
            setAccessDenied(true);
            setVerifying(false);
            return;
        }

        // Access granted
        console.log(`[AdminGuard] Access granted to ${user.email} (${user.role})`);
        setAccessDenied(false);
        setVerifying(false);
    };

    // Loading state - verifying access
    if (authLoading || verifying) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <div className="text-center space-y-6 p-8 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 animate-pulse" />
                        </div>
                        <div className="relative flex items-center justify-center h-20 w-20 mx-auto">
                            <Shield className="h-10 w-10 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            Verifying Access
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Checking admin credentials...
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        <span className="text-xs font-medium text-slate-500">Please wait</span>
                    </div>
                </div>
            </div>
        );
    }

    // Access denied - show error and redirect
    if (accessDenied) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-950 dark:to-red-950/20">
                <div className="text-center space-y-6 p-8 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border-2 border-red-200 dark:border-red-900 max-w-md">
                    {/* Icon */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30 animate-pulse" />
                        </div>
                        <div className="relative flex items-center justify-center h-24 w-24 mx-auto">
                            <Lock className="h-12 w-12 text-red-600 dark:text-red-500" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                                Access Denied
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            Admin Access Required
                        </h2>

                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                            You don't have permission to access the admin panel. This area is restricted to administrators and owners only.
                        </p>

                        {user && (
                            <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    Current user:
                                </p>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {user.email}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Role: <span className="font-semibold text-red-600 dark:text-red-400">{user.role}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Redirect countdown */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Redirecting in {countdown} seconds...</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go to Dashboard
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => navigate('/settings')}
                                className="w-full"
                            >
                                Contact Administrator
                            </Button>
                        </div>
                    </div>

                    {/* Security notice */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            🔒 This access attempt has been logged for security purposes
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Access granted - render children
    return <>{children}</>;
};

export default AdminGuard;
