/**
 * PROJECT IDA - DASHBOARD PAGE
 * Enterprise-grade dashboard with actionable metrics
 * Design: Stripe + Vercel + Linear inspired
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderTree,
    Database,
    GitBranch,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Plus,
    Upload,
    Activity,
    BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFeatureStore } from '../store/useFeatureStore';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PageHeader, EmptyState } from '../components/common';
import { StatCard } from '../components/data';
import AiChat from '../components/analytics/AiChat';
import { cn } from '../lib/utils';

interface DashboardStats {
    projects: { total: number; active: number };
    datasets: { total: number; processing: number };
    jobs: { running: number; failed: number; completed: number };
    storage: { used: number; limit: number };
}

interface RecentActivity {
    id: string;
    type: 'project' | 'dataset' | 'job';
    action: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error' | 'info';
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, tenant } = useAuthStore();
    const { quotas } = useFeatureStore();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, [tenant?.id]);

    const loadDashboardData = async () => {
        if (!tenant?.id) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch projects and datasets in parallel
            const [projectsRes, datasetsRes, auditLogsRes] = await Promise.all([
                api.get('/projects', { headers: { 'x-tenant-id': tenant.id } }),
                api.get('/datasets', { headers: { 'x-tenant-id': tenant.id } }),
                api.get('/admin/audit-logs', {
                    headers: { 'x-tenant-id': tenant.id },
                    params: { limit: 10 } // Get last 10 activities
                }).catch(() => ({ data: { logs: [] } })) // Fallback if admin endpoint not accessible
            ]);

            const projects = projectsRes.data;
            const datasets = datasetsRes.data;
            const jobs: any[] = []; // Jobs endpoint not implemented yet

            setStats({
                projects: {
                    total: projects.length,
                    active: projects.length,
                },
                datasets: {
                    total: datasets.length,
                    processing: 0,
                },
                jobs: {
                    running: jobs.filter((j: any) => j.status === 'RUNNING').length,
                    failed: jobs.filter((j: any) => j.status === 'FAILED').length,
                    completed: jobs.filter((j: any) => j.status === 'COMPLETED').length,
                },
                storage: {
                    used: 0,
                    limit: quotas?.maxStorageBytes || 1073741824,
                },
            });

            // Map audit logs to recent activity
            const logs = auditLogsRes.data?.logs || [];
            const mappedActivity: RecentActivity[] = logs.map((log: any) => {
                // Determine activity type and status based on action
                let type: 'project' | 'dataset' | 'job' = 'dataset';
                let status: 'success' | 'warning' | 'error' | 'info' = 'info';
                let action = log.action || 'Unknown action';

                // Map entity types
                if (log.entityType === 'Project') type = 'project';
                else if (log.entityType === 'Dataset' || log.entityType === 'Upload') type = 'dataset';
                else if (log.entityType === 'Job') type = 'job';

                // Map actions to user-friendly messages and statuses
                if (action.includes('CREATED')) {
                    status = 'success';
                    action = `${log.entityType} created successfully`;
                } else if (action.includes('UPDATED')) {
                    status = 'info';
                    action = `${log.entityType} updated`;
                } else if (action.includes('DELETED')) {
                    status = 'warning';
                    action = `${log.entityType} deleted`;
                } else if (action.includes('FAILED')) {
                    status = 'error';
                    action = `${log.entityType} operation failed`;
                } else if (action.includes('COMPLETED')) {
                    status = 'success';
                    action = `${log.entityType} completed`;
                }

                return {
                    id: log.id,
                    type,
                    action,
                    timestamp: log.createdAt,
                    status
                };
            });

            setRecentActivity(mappedActivity);
        } catch (error: any) {
            console.error('Failed to load dashboard:', error);
            setError(error.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="skeleton h-12 w-64" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton h-32 rounded-lg" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="skeleton h-64 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <EmptyState
                icon={AlertCircle}
                title="Failed to Load Dashboard"
                description={error}
                action={{
                    label: 'Retry',
                    onClick: loadDashboardData,
                }}
            />
        );
    }

    const storagePercentage = Math.round(
        ((stats?.storage.used || 0) / (stats?.storage.limit || 1)) * 100
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <PageHeader
                title="Dashboard"
                description={`Welcome back, ${user?.name}. Here's what's happening with your data.`}
                actions={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/datasets')}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Dataset
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => navigate('/projects')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </>
                }
            />

            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Projects"
                    value={stats?.projects.total || 0}
                    subtitle={`${stats?.projects.active || 0} active`}
                    icon={FolderTree}
                    onClick={() => navigate('/projects')}
                />
                <StatCard
                    title="Datasets"
                    value={stats?.datasets.total || 0}
                    subtitle={
                        stats?.datasets.processing
                            ? `${stats.datasets.processing} processing`
                            : 'All ready'
                    }
                    icon={Database}
                    onClick={() => navigate('/datasets')}
                />
                <StatCard
                    title="Active Jobs"
                    value={stats?.jobs.running || 0}
                    subtitle={`${stats?.jobs.completed || 0} completed today`}
                    icon={GitBranch}
                    onClick={() => navigate('/jobs')}
                />
                <StatCard
                    title="Storage Used"
                    value={`${storagePercentage}%`}
                    subtitle={`${formatBytes(stats?.storage.used || 0)} of ${formatBytes(stats?.storage.limit || 0)}`}
                    icon={BarChart3}
                />
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3 h-[600px]">
                {/* Recent Activity */}
                <div className="lg:col-span-2 h-full min-h-0">
                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900 h-full flex flex-col">
                        <CardHeader className="border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Activity className="h-4 w-4" />
                                    Recent Activity
                                </CardTitle>
                                <Button variant="ghost" size="sm">
                                    View All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                            {recentActivity.length === 0 ? (
                                <EmptyState
                                    icon={Clock}
                                    title="No recent activity"
                                    description="Your activity will appear here"
                                    className="py-12"
                                />
                            ) : (
                                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-center gap-4 p-4">
                                            {/* ... activity render ... */}
                                            <div
                                                className={cn(
                                                    'rounded-full p-2',
                                                    activity.status === 'success' && 'bg-emerald-50 dark:bg-emerald-900/20',
                                                    activity.status === 'error' && 'bg-red-50 dark:bg-red-900/20',
                                                    activity.status === 'warning' && 'bg-amber-50 dark:bg-amber-900/20',
                                                    activity.status === 'info' && 'bg-blue-50 dark:bg-blue-900/20'
                                                )}
                                            >
                                                {activity.status === 'success' && (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                )}
                                                {activity.status === 'error' && (
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                )}
                                                {activity.status === 'warning' && (
                                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                                    {activity.action}
                                                </p>
                                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* AI Chat Sidebar */}
                <div className="lg:col-span-1 h-full min-h-0">
                    <AiChat />
                </div>
            </div>

            {/* System Alerts */}
            {stats?.jobs.failed && stats.jobs.failed > 0 && (
                <Card className="border-l-4 border-l-error-500 bg-error-50 dark:bg-error-950">
                    <CardContent className="flex items-center gap-4 p-4">
                        <AlertCircle className="h-5 w-5 text-error-600" />
                        <div className="flex-1">
                            <p className="font-medium text-error-900 dark:text-error-100">
                                {stats.jobs.failed} job{stats.jobs.failed > 1 ? 's' : ''} failed
                            </p>
                            <p className="text-sm text-error-700 dark:text-error-300">
                                Review failed jobs to resolve issues
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/jobs?status=failed')}
                        >
                            View Jobs
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// Helper function
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default Dashboard;
