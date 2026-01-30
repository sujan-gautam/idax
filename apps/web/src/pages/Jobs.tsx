/**
 * JOBS & PIPELINES PAGE - Redesigned Professional UI
 * Monitor background tasks and analysis jobs with real-time updates
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    ArrowRight,
    Play,
    Filter,
    Search,
    TrendingUp,
    Zap,
    AlertTriangle,
    RefreshCw,
    Calendar,
    Database
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PageHeader, EmptyState } from '../components/common';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';

interface Job {
    id: string;
    type: string;
    dataset_name: string;
    dataset_id: string;
    status: 'completed' | 'failed' | 'running' | 'pending' | 'not_started';
    created_at: string;
    duration?: string;
}

type StatusFilter = 'all' | 'completed' | 'running' | 'failed' | 'pending';

const Jobs: React.FC = () => {
    const { tenant } = useAuthStore();
    const navigate = useNavigate();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadJobs();
        const interval = setInterval(loadJobs, 10000);
        return () => clearInterval(interval);
    }, [tenant?.id]);

    useEffect(() => {
        let filtered = jobs;

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(job => job.status === statusFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(job =>
                job.dataset_name.toLowerCase().includes(query) ||
                job.type.toLowerCase().includes(query)
            );
        }

        setFilteredJobs(filtered);
    }, [jobs, statusFilter, searchQuery]);

    const loadJobs = async () => {
        if (!tenant?.id) return;
        try {
            const response = await api.get('/jobs');
            setJobs(response.data);
            setLoading(false);
            setIsRefreshing(false);
        } catch (err: any) {
            console.error('Failed to load jobs:', err);
            if (jobs.length === 0) {
                setError(err.message || 'Failed to load jobs');
                setLoading(false);
            }
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadJobs();
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    icon: CheckCircle2,
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                    border: 'border-emerald-200 dark:border-emerald-800',
                    label: 'Completed',
                    pulse: false
                };
            case 'failed':
                return {
                    icon: AlertTriangle,
                    color: 'text-red-600 dark:text-red-400',
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    label: 'Failed',
                    pulse: false
                };
            case 'running':
                return {
                    icon: Activity,
                    color: 'text-indigo-600 dark:text-indigo-400',
                    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                    border: 'border-indigo-200 dark:border-indigo-800',
                    label: 'Running',
                    pulse: true
                };
            case 'pending':
                return {
                    icon: Clock,
                    color: 'text-amber-600 dark:text-amber-400',
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-200 dark:border-amber-800',
                    label: 'Pending',
                    pulse: false
                };
            default:
                return {
                    icon: Activity,
                    color: 'text-slate-500 dark:text-slate-400',
                    bg: 'bg-slate-100 dark:bg-slate-800',
                    border: 'border-slate-200 dark:border-slate-700',
                    label: 'Unknown',
                    pulse: false
                };
        }
    };

    const getStatusCounts = () => {
        return {
            total: jobs.length,
            completed: jobs.filter(j => j.status === 'completed').length,
            running: jobs.filter(j => j.status === 'running').length,
            failed: jobs.filter(j => j.status === 'failed').length,
            pending: jobs.filter(j => j.status === 'pending').length,
        };
    };

    const counts = getStatusCounts();

    if (loading) {
        return (
            <div className="flex h-[500px] items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-slate-500">Loading jobs...</p>
                </div>
            </div>
        );
    }

    if (error && jobs.length === 0) {
        return (
            <EmptyState
                icon={AlertTriangle}
                title="Failed to Load Jobs"
                description={error}
                action={{
                    label: 'Retry',
                    onClick: () => { setLoading(true); loadJobs(); },
                }}
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header with Stats */}
            <div className="space-y-4">
                <PageHeader
                    title="Jobs & Pipelines"
                    description="Monitor and manage your data analysis workflows in real-time"
                    actions={
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            className="gap-2"
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                            Refresh
                        </Button>
                    }
                />

                {/* Stats Cards */}
                {jobs.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card className="border-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{counts.total}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-slate-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Completed</p>
                                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{counts.completed}</p>
                                    </div>
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Running</p>
                                        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">{counts.running}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-indigo-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending</p>
                                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">{counts.pending}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-amber-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">Failed</p>
                                        <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">{counts.failed}</p>
                                    </div>
                                    <AlertTriangle className="h-8 w-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Filters and Search */}
            {jobs.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                            placeholder="Search by dataset or job type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {(['all', 'running', 'completed', 'pending', 'failed'] as StatusFilter[]).map((filter) => (
                            <Button
                                key={filter}
                                variant={statusFilter === filter ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(filter)}
                                className="capitalize"
                            >
                                {filter === 'all' ? `All (${counts.total})` : `${filter} (${counts[filter as keyof typeof counts]})`}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Jobs List */}
            {filteredJobs.length === 0 ? (
                <EmptyState
                    icon={jobs.length === 0 ? Play : Filter}
                    title={jobs.length === 0 ? "No jobs yet" : "No matching jobs"}
                    description={jobs.length === 0 ? "Run an analysis on a dataset to see jobs here." : "Try adjusting your filters or search query."}
                    action={jobs.length === 0 ? {
                        label: 'Go to Datasets',
                        onClick: () => navigate('/datasets')
                    } : undefined}
                />
            ) : (
                <div className="space-y-3">
                    {filteredJobs.map((job) => {
                        const status = getStatusConfig(job.status);
                        const StatusIcon = status.icon;
                        const isActive = job.status === 'running';

                        return (
                            <Card
                                key={job.id}
                                className={cn(
                                    "group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 overflow-hidden",
                                    status.border,
                                    isActive && "shadow-md"
                                )}
                                onClick={() => navigate(`/datasets/${job.dataset_id}`)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Left: Icon and Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                                                status.bg,
                                                status.pulse && "animate-pulse"
                                            )}>
                                                <StatusIcon className={cn("h-6 w-6", status.color, isActive && "animate-spin")} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                        {job.dataset_name}
                                                    </h3>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                        status.bg,
                                                        status.color
                                                    )}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Database className="h-3 w-3" />
                                                        {job.type}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(job.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Action */}
                                        <div className="flex items-center gap-3">
                                            {isActive && (
                                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                                                    <div className="flex gap-1">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Processing</span>
                                                </div>
                                            )}
                                            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Jobs;
