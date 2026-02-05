/**
 * OUTLIERS TAB - Anomaly & Extreme Value Detection
 * ADVANCED tier feature
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, AlertTriangle, Info, Crown, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FeatureGate } from '../FeatureGate';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface OutliersTabProps {
    datasetId: string;
}

interface OutlierInfo {
    method: string;
    count: number;
    percentage: number;
    lowerBound: number;
    upperBound: number;
    examples: number[];
}

export const OutliersTab: React.FC<OutliersTabProps> = ({ datasetId }) => {
    const { data: outliers, isLoading } = useQuery<Record<string, OutlierInfo>>({
        queryKey: ['eda-outliers', datasetId],
        queryFn: async () => {
            const response = await api.get(`/datasets/${datasetId}/eda/outliers`);
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="skeleton-loader h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-loader h-48" />
                    ))}
                </div>
            </div>
        );
    }

    if (!outliers || Object.keys(outliers).length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <div className="text-center">
                    <ShieldAlert className="mx-auto h-12 w-12 text-neutral-400" />
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">No outliers detected in the dataset</p>
                </div>
            </div>
        );
    }

    const ProPaywall = () => (
        <div className="flex min-h-[500px] items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600">
                    <Lock className="h-10 w-10 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-neutral-0">
                    Unlock Outlier Detection
                </h3>
                <p className="mb-6 text-neutral-600 dark:text-neutral-400">
                    Identify extreme values and data anomalies with advanced statistical methods
                </p>
                <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to PRO
                </Button>
            </div>
        </div>
    );

    return (
        <FeatureGate feature="outliers" fallback={<ProPaywall />}>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">Outlier Detection</h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Identification of extreme values using the IQR (Interquartile Range) method
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 dark:from-orange-900/20 dark:to-red-900/20">
                        <Crown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-orange-900 dark:text-orange-100">PRO Feature</span>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(outliers).map(([column, info]) => (
                        <Card key={column} className={cn(
                            "border-none transition-all hover:scale-[1.02]",
                            info.count > 0 ? "bg-white dark:bg-neutral-900 shadow-md" : "bg-neutral-50 dark:bg-neutral-900/40 opacity-70"
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-0">
                                    {column}
                                </CardTitle>
                                {info.count > 0 ? (
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                ) : (
                                    <ShieldAlert className="h-5 w-5 text-green-500" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-0">
                                        {info.count}
                                    </span>
                                    <span className="text-sm font-medium text-neutral-500">outliers</span>
                                </div>
                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    <div
                                        className={cn("h-full transition-all", info.count > 0 ? "bg-orange-500" : "bg-green-500")}
                                        style={{ width: `${Math.min(info.percentage * 5, 100)}%` }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-neutral-500 font-medium">
                                    {typeof info.percentage === 'number' ? info.percentage.toFixed(2) : 'N/A'}% of data points
                                </p>

                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-xs border-b border-neutral-100 dark:border-neutral-800 pb-1">
                                        <span className="text-neutral-500">Normal Range:</span>
                                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                            [{info.lowerBound}, {info.upperBound}]
                                        </span>
                                    </div>
                                    {info.examples && info.examples.length > 0 && (
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-1">
                                                Extreme Value Examples
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {info.examples.map((ex, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium">
                                                        {ex}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="bg-blue-50 border-none dark:bg-blue-900/10">
                    <CardContent className="p-4 flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">How outliers are detected</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                We use the IQR method: values falling below Q1 - 1.5*IQR or above Q3 + 1.5*IQR are flagged as outliers.
                                Outliers often represent measurement errors, data entry issues, or rare but significant events.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </FeatureGate>
    );
};
