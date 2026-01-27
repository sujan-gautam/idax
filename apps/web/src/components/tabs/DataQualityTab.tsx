import React, { useState, useEffect } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle2,
    Loader2,
    ArrowRight,
    ShieldCheck,
    Search,
    Filter
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

interface DataQualityTabProps {
    datasetId: string;
}

const DataQualityTab: React.FC<DataQualityTabProps> = ({ datasetId }) => {
    const { tenant } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadDataQuality();
    }, [datasetId, tenant?.id]);

    const loadDataQuality = async () => {
        if (!tenant?.id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/eda`, {
                headers: { 'x-tenant-id': tenant.id }
            });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data quality analysis');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data?.dataQuality) {
        return (
            <Card className="border-dashed py-24 text-center bg-transparent">
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Quality analysis not available</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Please run an EDA job to generate data quality assessments.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { dataQuality: quality } = data;

    const filteredIssues = quality.issues.filter((issue: any) =>
        filter === 'all' || issue.severity === filter
    );

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight">Data Quality Assessment</h2>
                    <p className="text-sm text-slate-500">Identified issues and suggested remediations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={filter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        All ({quality.totalIssues})
                    </Button>
                    <Button
                        variant={filter === 'high' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('high')}
                        className={cn(filter === 'high' && "text-red-600 bg-red-50 dark:bg-red-900/20")}
                    >
                        High ({quality.summary.high})
                    </Button>
                    <Button
                        variant={filter === 'medium' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('medium')}
                        className={cn(filter === 'medium' && "text-amber-600 bg-amber-50 dark:bg-amber-900/20")}
                    >
                        Medium ({quality.summary.medium})
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredIssues.length === 0 ? (
                    <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20">
                        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">No issues detected</h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                    {filter === 'all' ? "Your dataset meets all quality standards." : `No issues with ${filter} severity found.`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredIssues.map((issue: any, idx: number) => (
                            <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1",
                                    issue.severity === 'high' ? "bg-red-500" :
                                        issue.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                                )} />
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                                issue.severity === 'high' ? "bg-red-50 dark:bg-red-900/20 text-red-600" :
                                                    issue.severity === 'medium' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" :
                                                        "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                            )}>
                                                {issue.severity === 'high' ? <AlertCircle className="h-5 w-5" /> :
                                                    issue.severity === 'medium' ? <AlertTriangle className="h-5 w-5" /> :
                                                        <Info className="h-5 w-5" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100">{issue.column || 'Dataset'}</span>
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                        issue.severity === 'high' ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                                            issue.severity === 'medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                                "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                                    )}>
                                                        {issue.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{issue.message}</p>
                                                <div className="pt-2 flex items-center gap-2 text-primary text-xs font-semibold group-hover:translate-x-1 transition-transform cursor-pointer">
                                                    <ArrowRight className="h-3 w-3" />
                                                    <span>Recommendation: {issue.recommendation}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="shrink-0">
                                            Apply Fix
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataQualityTab;
