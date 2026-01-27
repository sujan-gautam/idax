/**
 * OVERVIEW TAB - Dataset Summary & Health Check
 * FREE TIER - Lead generation
 * Professional, data-dense, actionable
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Database,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    BarChart3,
    Activity,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

interface OverviewTabProps {
    datasetId: string;
}

interface ColumnInfo {
    name: string;
    type: string;
    missing: number;
    unique: number;
}

interface OverviewData {
    dataset_id: string;
    shape: {
        rows: number;
        columns: number;
    };
    quality_score: number;
    completeness: number;
    columns: ColumnInfo[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ datasetId }) => {
    const { data: overview, isLoading, error } = useQuery<OverviewData>({
        queryKey: ['eda-overview', datasetId],
        queryFn: async () => {
            const response = await api.get(`/datasets/${datasetId}/eda/overview`);
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="skeleton-loader h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-loader h-32" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-0">
                        Failed to load overview
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                </div>
            </div>
        );
    }

    if (!overview) return null;

    const getQualityColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getQualityBadge = (score: number) => {
        if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-700 border-green-200' };
        if (score >= 70) return { label: 'Good', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
        if (score >= 50) return { label: 'Fair', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        return { label: 'Poor', color: 'bg-red-100 text-red-700 border-red-200' };
    };

    const qualityBadge = getQualityBadge(overview.quality_score);

    // Defensive check to avoid crash if API returns error structure instead of OverviewData
    const columns = overview.columns || [];
    const shape = overview.shape || { rows: 0, columns: 0 };

    const typeBreakdown = columns.reduce((acc, col) => {
        acc[col.type] = (acc[col.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalMissing = columns.reduce((sum, col) => sum + col.missing, 0);
    const totalCells = shape.rows * shape.columns;
    const missingPercentage = totalCells > 0 ? ((totalMissing / totalCells) * 100).toFixed(1) : '0.0';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">
                        Dataset Overview
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Summary statistics and data quality assessment
                    </p>
                </div>
                <div className={cn('inline-flex items-center gap-2 rounded-full border-2 px-4 py-2', qualityBadge.color)}>
                    <Activity className="h-4 w-4" />
                    <span className="font-semibold">{qualityBadge.label} Quality</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none bg-white dark:bg-neutral-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Total Rows
                                </p>
                                <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-0">
                                    {overview.shape.rows.toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-white dark:bg-neutral-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Columns
                                </p>
                                <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-0">
                                    {overview.shape.columns}
                                </p>
                            </div>
                            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-white dark:bg-neutral-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Quality Score
                                </p>
                                <p className={cn('mt-2 text-3xl font-bold', getQualityColor(overview.quality_score))}>
                                    {overview.quality_score.toFixed(1)}
                                </p>
                                <p className="text-xs text-neutral-500">out of 100</p>
                            </div>
                            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-white dark:bg-neutral-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Completeness
                                </p>
                                <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-0">
                                    {overview.completeness.toFixed(1)}%
                                </p>
                                <p className="text-xs text-neutral-500">{missingPercentage}% missing</p>
                            </div>
                            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/20">
                                <CheckCircle2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Column Type Breakdown */}
            <Card className="border-none bg-white dark:bg-neutral-900">
                <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                    <CardTitle className="text-base font-semibold">Column Type Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-5">
                        {Object.entries(typeBreakdown).map(([type, count]) => (
                            <div key={type} className="text-center">
                                <div className={cn(
                                    'mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold',
                                    type === 'numeric' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
                                    type === 'categorical' && 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
                                    type === 'datetime' && 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
                                    type === 'text' && 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
                                    type === 'empty' && 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                )}>
                                    {count}
                                </div>
                                <p className="text-sm font-medium capitalize text-neutral-700 dark:text-neutral-300">
                                    {type}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Column Analysis Table */}
            <Card className="border-none bg-white dark:bg-neutral-900">
                <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                    <CardTitle className="text-base font-semibold">Column Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Column Name</th>
                                    <th>Data Type</th>
                                    <th>Unique Values</th>
                                    <th>Missing Values</th>
                                    <th>Missing %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overview.columns.map((column) => {
                                    const missingPct = ((column.missing / overview.shape.rows) * 100).toFixed(1);

                                    return (
                                        <tr key={column.name}>
                                            <td className="font-medium text-neutral-900 dark:text-neutral-0">
                                                {column.name}
                                            </td>
                                            <td>
                                                <span className={cn(
                                                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                                    column.type === 'numeric' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
                                                    column.type === 'categorical' && 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                                                    column.type === 'datetime' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
                                                    column.type === 'text' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
                                                    column.type === 'empty' && 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                                                )}>
                                                    {column.type}
                                                </span>
                                            </td>
                                            <td className="text-neutral-600 dark:text-neutral-400">
                                                {column.unique.toLocaleString()}
                                            </td>
                                            <td className={cn(
                                                'font-medium',
                                                column.missing > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                            )}>
                                                {column.missing.toLocaleString()}
                                            </td>
                                            <td className={cn(
                                                'font-medium',
                                                parseFloat(missingPct) > 10 ? 'text-red-600 dark:text-red-400' :
                                                    parseFloat(missingPct) > 0 ? 'text-yellow-600 dark:text-yellow-400' :
                                                        'text-green-600 dark:text-green-400'
                                            )}>
                                                {missingPct}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {overview.quality_score < 90 && (
                <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <div>
                                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                                    Data Quality Recommendations
                                </p>
                                <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                                    {parseFloat(missingPercentage) > 5 && (
                                        <li>• Consider handling missing values ({missingPercentage}% of data)</li>
                                    )}
                                    {overview.quality_score < 70 && (
                                        <li>• Review data collection process to improve quality</li>
                                    )}
                                    {overview.columns.some(c => c.type === 'empty') && (
                                        <li>• Remove empty columns to reduce noise</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
