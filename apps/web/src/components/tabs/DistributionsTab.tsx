/**
 * DISTRIBUTIONS TAB - Statistical Distribution Analysis
 * PRO TIER - $29/mo
 * Histograms, bar charts, distribution fitting
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Lock, Crown, AlertCircle, Info } from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FeatureGate } from '../FeatureGate';
import { cn } from '../../lib/utils';
import {
    ComposedChart,
    BarChart,
    Bar,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface DistributionsTabProps {
    datasetId: string;
}

interface DistributionData {
    distributions: Record<string, {
        histogram?: {
            counts: number[];
            bin_edges: number[];
        };
        statistics?: {
            mean: number;
            median: number;
            std: number;
            skewness: number;
            kurtosis: number;
        };
        value_counts?: Record<string, number>;
        entropy?: number;
    }>;
}

export const DistributionsTab: React.FC<DistributionsTabProps> = ({ datasetId }) => {
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

    const { data: distributions, isLoading } = useQuery<DistributionData>({
        queryKey: ['eda-distributions', datasetId],
        queryFn: async () => {
            const response = await api.get(`/datasets/${datasetId}/eda/distributions`);
            return response.data;
        },
        enabled: true, // Will be gated by FeatureGate
    });

    const ProPaywall = () => (
        <div className="flex min-h-[500px] items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Lock className="h-10 w-10 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-neutral-0">
                    Unlock Distribution Analysis
                </h3>
                <p className="mb-6 text-neutral-600 dark:text-neutral-400">
                    Get detailed statistical distributions, histograms, and distribution fitting with PRO tier
                </p>
                <div className="mb-6 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                    <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        PRO Features Include:
                    </p>
                    <ul className="space-y-1 text-left text-sm text-neutral-600 dark:text-neutral-400">
                        <li>✓ Histogram analysis for all numeric columns</li>
                        <li>✓ Bar charts for categorical data</li>
                        <li>✓ Distribution fitting (Normal, Log-normal, etc.)</li>
                        <li>✓ Skewness and kurtosis analysis</li>
                        <li>✓ Goodness-of-fit tests</li>
                    </ul>
                </div>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to PRO - $29/mo
                </Button>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="skeleton-loader h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-loader h-96" />
                    ))}
                </div>
            </div>
        );
    }

    if (!distributions || !distributions.distributions || Object.keys(distributions.distributions).length === 0) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-neutral-400" />
                    <h3 className="mt-4 text-lg font-medium">Distribution data not available</h3>
                    <p className="mt-2 text-neutral-600">This could be due to an error in analysis or missing dataset versions.</p>
                </div>
            </div>
        );
    }

    const columns = Object.keys(distributions.distributions);
    const currentColumn = selectedColumn || columns[0];
    const currentData = distributions.distributions[currentColumn];

    const renderNumericDistribution = (colName: string, data: any) => {
        if (!data.histogram) return null;

        const totalCount = data.histogram.counts.reduce((a: number, b: number) => a + b, 0);
        const mean = data.statistics?.mean || 0;
        const std = data.statistics?.std || 1;

        const chartData = data.histogram.counts.map((count: number, idx: number) => {
            const midPoint = (data.histogram.bin_edges[idx] + data.histogram.bin_edges[idx + 1]) / 2;

            // Calculate normal distribution value (PDF)
            const exponent = -0.5 * Math.pow((midPoint - mean) / Math.max(std, 0.0001), 2);
            const normalValue = (1 / (Math.max(std, 0.0001) * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

            const binWidth = data.histogram.bin_edges[1] - data.histogram.bin_edges[0];
            const fittedCount = normalValue * totalCount * binWidth;

            return {
                range: data.histogram.bin_edges[idx].toFixed(2),
                count,
                fitted: parseFloat(fittedCount.toFixed(2)),
            };
        });

        const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

        return (
            <Card className="border-none bg-white dark:bg-neutral-900 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            Distribution & Fitting: {colName}
                        </CardTitle>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                Actual
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                                <div className="w-2 h-2 border-t-2 border-emerald-600"></div>
                                Normal Fit
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="range"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                                {chartData.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[0]} fillOpacity={0.8} />
                                ))}
                            </Bar>
                            <Line
                                type="monotone"
                                dataKey="fitted"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={false}
                                animationDuration={1500}
                            />
                            <Area
                                type="monotone"
                                dataKey="fitted"
                                fill="#10b981"
                                fillOpacity={0.1}
                                stroke="none"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>

                    {data.statistics && (
                        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                <div className="text-xs text-neutral-600 dark:text-neutral-400">Mean</div>
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {data.statistics.mean.toFixed(2)}
                                </div>
                            </div>
                            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                                <div className="text-xs text-neutral-600 dark:text-neutral-400">Median</div>
                                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {data.statistics.median.toFixed(2)}
                                </div>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                <div className="text-xs text-neutral-600 dark:text-neutral-400">Std Dev</div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {data.statistics.std.toFixed(2)}
                                </div>
                            </div>
                            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                                <div className="text-xs text-neutral-600 dark:text-neutral-400">Skewness</div>
                                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                    {data.statistics.skewness.toFixed(2)}
                                </div>
                            </div>
                            <div className="rounded-lg bg-pink-50 p-3 dark:bg-pink-900/20">
                                <div className="text-xs text-neutral-600 dark:text-neutral-400">Kurtosis</div>
                                <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                                    {data.statistics.kurtosis.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderCategoricalDistribution = (colName: string, data: any) => {
        if (!data.value_counts) return null;

        const chartData = Object.entries(data.value_counts)
            .slice(0, 15)
            .map(([name, count]) => ({
                name: String(name).substring(0, 25),
                count: count as number,
            }));

        const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

        return (
            <Card className="border-none bg-white dark:bg-neutral-900 shadow-xl">
                <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        Count Plot: {colName}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} margin={{ bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.entropy !== undefined && (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/20 dark:bg-indigo-900/10">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Shannon Entropy</div>
                                    <Info className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-0">
                                    {data.entropy.toFixed(3)}
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    Measures dataset variety and uncertainty
                                </div>
                            </div>
                        )}
                        <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Top Category</div>
                            </div>
                            <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-0 truncate">
                                {chartData[0]?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Frequency: {chartData[0]?.count || 0} occurrences
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <FeatureGate feature="distributions" fallback={<ProPaywall />}>
            <div className="space-y-6 animate-fade-in">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">
                            Distribution Analysis
                        </h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Statistical distributions and frequency analysis
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 dark:from-indigo-900/20 dark:to-purple-900/20">
                        <Crown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">PRO Feature</span>
                    </div>
                </div>

                {/* Column Selector */}
                <div className="flex flex-wrap gap-2">
                    {columns.slice(0, 10).map((col) => (
                        <button
                            key={col}
                            onClick={() => setSelectedColumn(col)}
                            className={cn(
                                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                currentColumn === col
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                            )}
                        >
                            {col}
                        </button>
                    ))}
                </div>

                {/* Distribution Charts */}
                <div className="grid gap-6">
                    {currentData.histogram
                        ? renderNumericDistribution(currentColumn, currentData)
                        : renderCategoricalDistribution(currentColumn, currentData)}
                </div>

                {/* Show more columns */}
                {columns.length > 10 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {columns.slice(10, 20).map((col) => {
                            const data = distributions.distributions[col];
                            return data.histogram
                                ? renderNumericDistribution(col, data)
                                : renderCategoricalDistribution(col, data);
                        })}
                    </div>
                )}
            </div>
        </FeatureGate>
    );
};
