/**
 * ADMIN PANEL - Main Dashboard
 * Complete SaaS admin panel with all management features
 */

import React from 'react';
import {
    Shield,
    Lock,
    Settings
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useAuthStore } from '../store/useAuthStore';

// Import all admin components
import { UserManagement } from '../components/admin/UserManagement';
import { FeatureFlagsManagement } from '../components/admin/FeatureFlagsManagement';
import { QuotasManagement } from '../components/admin/QuotasManagement';
import { SystemStatistics } from '../components/admin/SystemStatistics';
import { AuditLogs } from '../components/admin/AuditLogs';

interface AdminProps {
    section?: 'statistics' | 'users' | 'features' | 'quotas' | 'audit' | 'settings';
}

const Admin: React.FC<AdminProps> = ({ section = 'statistics' }) => {
    const { user, tenant } = useAuthStore();

    // Check if user has admin access
    if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Lock className="h-16 w-16 text-slate-300" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Access Denied
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    You don't have permission to access the admin panel
                </p>
            </div>
        );
    }

    const renderSection = () => {
        switch (section) {
            case 'statistics':
                return <SystemStatistics />;
            case 'users':
                return <UserManagement />;
            case 'features':
                return <FeatureFlagsManagement />;
            case 'quotas':
                return <QuotasManagement />;
            case 'audit':
                return <AuditLogs />;
            case 'settings':
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Settings className="h-6 w-6 text-indigo-600" />
                                Organization Settings
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Configure organization-wide settings and preferences
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Tenant Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Organization Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Organization Name</label>
                                        <p className="text-sm font-medium mt-1">{tenant?.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Organization ID</label>
                                        <p className="text-sm font-mono mt-1">{tenant?.id}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Plan</label>
                                        <p className="text-sm font-medium mt-1">{tenant?.plan || 'FREE'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                        <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                            {tenant?.status || 'ACTIVE'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Security Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Security & Compliance</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="text-sm font-medium">Two-Factor Authentication</p>
                                            <p className="text-xs text-slate-500">Require 2FA for all users</p>
                                        </div>
                                        <Badge variant="outline">Coming Soon</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="text-sm font-medium">IP Whitelisting</p>
                                            <p className="text-xs text-slate-500">Restrict access by IP address</p>
                                        </div>
                                        <Badge variant="outline">Coming Soon</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="text-sm font-medium">Session Timeout</p>
                                            <p className="text-xs text-slate-500">Auto-logout after inactivity</p>
                                        </div>
                                        <Badge variant="outline">Coming Soon</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="rounded-xl border-2 border-red-200 dark:border-red-900/20 p-6 bg-red-50 dark:bg-red-900/10">
                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                                Danger Zone
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                Irreversible and destructive actions
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border">
                                    <div>
                                        <p className="text-sm font-medium">Reset All Data</p>
                                        <p className="text-xs text-slate-500">Delete all datasets and projects</p>
                                    </div>
                                    <button className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                                        Reset
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border">
                                    <div>
                                        <p className="text-sm font-medium">Delete Organization</p>
                                        <p className="text-xs text-slate-500">Permanently delete this organization</p>
                                    </div>
                                    <button className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <SystemStatistics />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <Shield className="h-8 w-8 text-indigo-500" />
                        Admin {section.charAt(0).toUpperCase() + section.slice(1)}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        System-level management for {tenant?.name}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white border-slate-200 dark:border-slate-700">
                        <Lock className="h-3 w-3 mr-1" />
                        ADMIN ACCESS
                    </Badge>
                    <Badge className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        {tenant?.plan || 'FREE'} PLAN
                    </Badge>
                </div>
            </div>

            {/* Content Section */}
            <div className="mt-8">
                {renderSection()}
            </div>
        </div>
    );
};

export default Admin;
