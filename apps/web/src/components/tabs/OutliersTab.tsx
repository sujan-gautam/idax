import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    Info,
    Loader2,
    Search,
    ArrowRight,
    ShieldAlert,
    HelpCircle,
    Eye
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";

interface OutliersTabProps {
    datasetId: string;
}

const OutliersTab: React.FC<OutliersTabProps> = ({ datasetId }) => {
    const { tenant } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadOutliers();
    }, [datasetId, tenant?.id]);

    const loadOutliers = async () => {
        if (!tenant?.id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/eda`, {
                headers: { 'x-tenant-id': tenant.id }
            });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load outliers');
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

    if (error || !data?.outliers || Object.keys(data.outliers).length === 0) {
        return (
            <Card className="border-dashed py-24 text-center bg-transparent">
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold">No outlier data available</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Outlier detection requires numeric columns and an executed analysis job.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const outliers = data.outliers;
    const columns = Object.keys(outliers).filter(col =>
        col.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight">Outlier Detection</h2>
                    <p className="text-sm text-slate-500">Statistical anomalies identified via the IQR method.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Filter columns..."
                        className="pl-9 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardContent className="p-0 overflow-x-auto no-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 text-left">
                                <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Column</th>
                                <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Anomalies</th>
                                <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Percentage</th>
                                <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 decoration-dotted underline cursor-help">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>Bounds (Lower / Upper)</TooltipTrigger>
                                            <TooltipContent>
                                                Calculated as Q1 - 1.5IQR and Q3 + 1.5IQR
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </th>
                                <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Anomalous Points (Examples)</th>
                                <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {columns.map((col) => {
                                const outlier = outliers[col];
                                return (
                                    <tr key={col} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                                    outlier.count > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                                )} />
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{col}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium">
                                            {outlier.count.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                                                outlier.percentage > 10 ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                    outlier.percentage > 5 ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                        "bg-slate-50 text-slate-500 dark:bg-slate-800"
                                            )}>
                                                {outlier.percentage}%
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                                            {outlier.lowerBound} <span className="mx-1">/</span> {outlier.upperBound}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-wrap gap-1">
                                                {outlier.examples.slice(0, 3).map((val: number, i: number) => (
                                                    <div key={i} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium font-mono">
                                                        {val}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Button variant="ghost" size="sm" className="h-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye className="h-3 w-3 mr-2" /> View Rows
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <div className="rounded-xl bg-slate-900 p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <HelpCircle className="h-32 w-32" />
                </div>
                <div className="relative z-10 space-y-2">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-400" />
                        How are outliers detected?
                    </h4>
                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                        IDA uses the standard <strong>Interquartile Range (IQR)</strong> method. We calculate the spread of the middle 50% of your data (the IQR = Q3 - Q1).
                        Any points falling below Q1 - 1.5×IQR or above Q3 + 1.5×IQR are statistically classified as outliers.
                        High outlier counts ( {'>'} 5% ) often indicate data entry errors or extreme variability that may require scaling.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OutliersTab;
