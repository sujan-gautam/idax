/**
 * DATA QUALITY TAB - Issue Summary & Health Checks
 * Professional Tier Feature
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, ShieldAlert, AlertCircle, CheckCircle2, Crown, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FeatureGate } from '../FeatureGate';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface DataQualityTabProps {
    datasetId: string;
}

interface QualityIssue {
    column: string;
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    recommendation: string;
}

interface QualitySummary {
    totalIssues: number;
    summary: {
        high: number;
        medium: number;
        low: number;
    };
    issues: QualityIssue[];
}

export const DataQualityTab: React.FC<DataQualityTabProps> = ({ datasetId }) => {
    const { data: quality, isLoading } = useQuery<QualitySummary>({
        queryKey: ['eda-quality', datasetId],
        queryFn: async () => {
            const response = await api.get(`/datasets/${datasetId}/eda/quality`);
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="skeleton-loader h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton-loader h-32" />
                    ))}
                </div>
                <div className="skeleton-loader h-96 w-full" />
            </div>
        );
    }

    if (!quality || quality.totalIssues === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <BadgeCheck className="h-10 w-10 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-0">Dataset looks healthy!</h3>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">We didn't find any significant data quality issues.</p>
            </div>
        );
    }

    const ProPaywall = () => (
        <div className="flex min-h-[500px] items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Lock className="h-10 w-10 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-neutral-0">
                    Smarter Data Quality
                </h3>
                <p className="mb-6 text-neutral-600 dark:text-neutral-400">
                    Get automated health scores and repair recommendations with PRO tier quality scans
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to PRO
                </Button>
            </div>
        </div>
    );

    const { summary, issues } = quality;

    return (
        <FeatureGate feature="quality" fallback={<ProPaywall />}>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">Data Quality Report</h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Automated scan result highlighting structural and statistical anomalies
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">PRO Feature</span>
                    </div>
                </div>

                {/* Severity Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-red-500 bg-white dark:bg-neutral-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-red-500">Critical Issues</p>
                                    <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-neutral-0">{summary.high}</p>
                                </div>
                                <ShieldAlert className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500 bg-white dark:bg-neutral-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Moderate Issues</p>
                                    <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-neutral-0">{summary.medium}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 bg-white dark:bg-neutral-900">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Advice / Info</p>
                                    <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-neutral-0">{summary.low}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Issues Table */}
                <Card className="border-none bg-white dark:bg-neutral-900 overflow-hidden">
                    <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                        <CardTitle className="text-base font-semibold">Identified Quality Issues</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="data-table w-full text-left">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-4">Severity</th>
                                        <th className="px-6 py-4">Column / Area</th>
                                        <th className="px-6 py-4">Issue Type</th>
                                        <th className="px-6 py-4">Message</th>
                                        <th className="px-6 py-4">Action Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {issues.map((issue, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                    issue.severity === 'high' ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/50" :
                                                        issue.severity === 'medium' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50" :
                                                            "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50"
                                                )}>
                                                    {issue.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-0">
                                                {issue.column}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                                {issue.type.split('_').join(' ')}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                                {issue.message}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                    {issue.recommendation}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </FeatureGate>
    );
};
