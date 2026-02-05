/**
 * SYSTEM STATISTICS COMPONENT
 * Real-time metrics and analytics dashboard
 */

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    Database,
    Upload,
    CheckCircle,
    XCircle,
    Brain,
    TrendingUp,
    Loader2,
    BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface Statistics {
    users: {
        total: number;
        active: number;
        inactive: number;
    };
    resources: {
        projects: number;
        datasets: number;
        uploads: number;
    };
    jobs: {
        total: number;
        completed: number;
        failed: number;
        successRate: string;
    };
    ai: {
        tokensUsed: number;
        promptTokens: number;
        completionTokens: number;
        totalRequests: number;
    };
    recentActivity: Array<{
        action: string;
        count: number;
    }>;
}

export const SystemStatistics: React.FC = () => {
    const { tenant } = useAuthStore();
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatistics();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStatistics, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/admin/statistics', {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!stats) return null;

    const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {title}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                {value}
                            </p>
                            {trend && (
                                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {trend}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className={`p-3 rounded-full ${color}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="h-6 w-6 text-indigo-600" />
                    System Statistics
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Real-time metrics and performance indicators
                </p>
            </div>

            {/* User Stats */}
            <div>
                <h3 className="text-lg font-semibold mb-4">User Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Users"
                        value={stats.users.total}
                        subtitle="All registered users"
                        icon={Users}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    />
                    <StatCard
                        title="Active Users"
                        value={stats.users.active}
                        subtitle={`${((stats.users.active / stats.users.total) * 100).toFixed(0)}% of total`}
                        icon={CheckCircle}
                        color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                    />
                    <StatCard
                        title="Inactive Users"
                        value={stats.users.inactive}
                        subtitle={`${((stats.users.inactive / stats.users.total) * 100).toFixed(0)}% of total`}
                        icon={XCircle}
                        color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    />
                </div>
            </div>

            {/* Resource Stats */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Projects"
                        value={stats.resources.projects}
                        subtitle="Active projects"
                        icon={Database}
                        color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                    />
                    <StatCard
                        title="Datasets"
                        value={stats.resources.datasets}
                        subtitle="Total datasets"
                        icon={BarChart3}
                        color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                    />
                    <StatCard
                        title="Uploads"
                        value={stats.resources.uploads}
                        subtitle="All time uploads"
                        icon={Upload}
                        color="bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400"
                    />
                </div>
            </div>

            {/* Job Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Job Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {stats.jobs.total}
                            </div>
                            <div className="text-sm text-slate-500">Total Jobs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {stats.jobs.completed}
                            </div>
                            <div className="text-sm text-slate-500">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {stats.jobs.failed}
                            </div>
                            <div className="text-sm text-slate-500">Failed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                                {stats.jobs.successRate}%
                            </div>
                            <div className="text-sm text-slate-500">Success Rate</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Job Success Rate</span>
                            <span className="font-medium">{stats.jobs.successRate}%</span>
                        </div>
                        <Progress
                            value={parseFloat(stats.jobs.successRate)}
                            className="h-3"
                            indicatorClassName="bg-gradient-to-r from-green-500 to-emerald-500"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* AI Usage */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-pink-600" />
                        AI Usage Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10">
                            <div className="text-2xl font-bold text-pink-600">
                                {stats.ai.tokensUsed.toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Total Tokens</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.ai.promptTokens.toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Prompt Tokens</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10">
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.ai.completionTokens.toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Completion Tokens</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10">
                            <div className="text-2xl font-bold text-indigo-600">
                                {stats.ai.totalRequests.toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Total Requests</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activity (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentActivity.slice(0, 10).map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                                >
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {activity.action.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {activity.count} times
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-8">No recent activity</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
