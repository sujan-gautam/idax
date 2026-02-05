/**
 * CORRELATIONS TAB - Relationship Analysis
 * PRO TIER - $29/mo
 * Multi-method correlation analysis with interactive heatmap
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Network, Lock, Crown, Info } from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FeatureGate } from '../FeatureGate';
import { cn } from '../../lib/utils';

interface CorrelationsTabProps {
    datasetId: string;
}

interface CorrelationData {
    method: string;
    matrix: Record<string, Record<string, number>>;
    correlations: Array<{
        column1: string;
        column2: string;
        correlation: number;
        p_value: number | null;
        strength: string;
    }>;
    columns: string[];
}

export const CorrelationsTab: React.FC<CorrelationsTabProps> = ({ datasetId }) => {
    const [method, setMethod] = useState<'pearson' | 'spearman' | 'kendall'>('pearson');
    const [selectedPair, setSelectedPair] = useState<{ col1: string; col2: string } | null>(null);

    const { data: correlations, isLoading } = useQuery<CorrelationData>({
        queryKey: ['eda-correlations', datasetId, method],
        queryFn: async () => {
            const response = await api.get(`/datasets/${datasetId}/eda/correlations?method=${method}`);
            return response.data;
        }
    });

    const ProPaywall = () => (
        <div className="flex min-h-[500px] items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Lock className="h-10 w-10 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-neutral-0">
                    Unlock Correlation Analysis
                </h3>
                <p className="mb-6 text-neutral-600 dark:text-neutral-400">
                    Discover relationships between variables with advanced correlation methods
                </p>
                <div className="mb-6 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                    <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        PRO Features Include:
                    </p>
                    <ul className="space-y-1 text-left text-sm text-neutral-600 dark:text-neutral-400">
                        <li>✓ Pearson correlation (linear relationships)</li>
                        <li>✓ Spearman correlation (monotonic relationships)</li>
                        <li>✓ Kendall tau (ordinal data)</li>
                        <li>✓ Interactive correlation heatmap</li>
                        <li>✓ Scatter plot matrix</li>
                        <li>✓ Statistical significance (p-values)</li>
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
                <div className="skeleton-loader h-96" />
            </div>
        );
    }

    if (!correlations || !correlations.correlations || correlations.correlations.length === 0) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <Info className="mx-auto h-12 w-12 text-neutral-400" />
                    <p className="mt-4 text-lg font-medium text-neutral-700 dark:text-neutral-300">
                        Not enough numeric columns for correlation analysis
                    </p>
                    <p className="text-sm text-neutral-500">
                        At least 2 numeric columns are required
                    </p>
                </div>
            </div>
        );
    }

    const getCorrelationColor = (corr: number): string => {
        const value = Math.abs(corr);
        if (value > 0.7) return corr > 0 ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)';
        if (value > 0.4) return corr > 0 ? 'rgb(251, 146, 60)' : 'rgb(96, 165, 250)';
        return 'rgb(156, 163, 175)';
    };

    const getCorrelationBadgeColor = (strength: string): string => {
        switch (strength) {
            case 'strong':
                return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400';
            case 'moderate':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'weak':
                return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
            default:
                return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400';
        }
    };

    const renderHeatmap = () => {
        if (!correlations || !correlations.columns || !correlations.correlations) return null;

        const cols = correlations.columns.slice(0, 8);
        const matrix: number[][] = [];

        for (let i = 0; i < cols.length; i++) {
            const row: number[] = [];
            for (let j = 0; j < cols.length; j++) {
                if (i === j) {
                    row.push(1);
                } else {
                    const corr = correlations.correlations.find(
                        (c) =>
                            (c.column1 === cols[i] && c.column2 === cols[j]) ||
                            (c.column1 === cols[j] && c.column2 === cols[i])
                    );
                    row.push(corr ? corr.correlation : 0);
                }
            }
            matrix.push(row);
        }

        return (
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    <div className="flex">
                        <div className="w-32"></div>
                        {cols.map((col, i) => (
                            <div key={i} className="w-24 p-2 text-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                {col.substring(0, 10)}
                            </div>
                        ))}
                    </div>
                    {matrix.map((row, i) => (
                        <div key={i} className="flex">
                            <div className="w-32 py-2 pr-4 text-right text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                {cols[i].substring(0, 15)}
                            </div>
                            {row.map((val, j) => (
                                <div
                                    key={j}
                                    className="flex h-16 w-24 cursor-pointer items-center justify-center border border-neutral-200 text-xs font-bold transition-all hover:scale-105 dark:border-neutral-700"
                                    style={{ backgroundColor: getCorrelationColor(val) }}
                                    title={`${cols[i]} × ${cols[j]}: ${val.toFixed(3)}`}
                                    onClick={() => setSelectedPair({ col1: cols[i], col2: cols[j] })}
                                >
                                    <span className="text-white drop-shadow-lg">{val.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-8 bg-red-600"></div>
                        <span className="text-neutral-600 dark:text-neutral-400">Positive</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-8 bg-blue-600"></div>
                        <span className="text-neutral-600 dark:text-neutral-400">Negative</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-8 bg-neutral-400"></div>
                        <span className="text-neutral-600 dark:text-neutral-400">Weak</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <FeatureGate feature="correlations" fallback={<ProPaywall />}>
            <div className="space-y-6 animate-fade-in">
                {/* Page Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">
                            Correlation Analysis
                        </h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Discover relationships between numeric variables
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 dark:from-indigo-900/20 dark:to-purple-900/20">
                            <Crown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">PRO Feature</span>
                        </div>
                    </div>
                </div>

                {/* Method Selector */}
                <div className="flex flex-wrap gap-2">
                    {(['pearson', 'spearman', 'kendall'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMethod(m)}
                            className={cn(
                                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                method === m
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                            )}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Correlation Heatmap */}
                <Card className="border-none bg-white dark:bg-neutral-900">
                    <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Network className="h-5 w-5 text-indigo-600" />
                            Correlation Heatmap ({method})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">{renderHeatmap()}</CardContent>
                </Card>

                {/* Top Correlations */}
                <Card className="border-none bg-white dark:bg-neutral-900">
                    <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                        <CardTitle className="text-base font-semibold">Top Correlations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {correlations.correlations.slice(0, 12).map((corr, idx) => (
                                <div
                                    key={idx}
                                    className={cn('cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-lg', getCorrelationBadgeColor(corr.strength))}
                                    onClick={() => setSelectedPair({ col1: corr.column1, col2: corr.column2 })}
                                >
                                    <div className="mb-1 text-sm font-semibold">
                                        {corr.column1} × {corr.column2}
                                    </div>
                                    <div className="text-3xl font-bold">{corr.correlation.toFixed(3)}</div>
                                    <div className="mt-1 flex items-center justify-between text-xs">
                                        <span className="capitalize opacity-75">{corr.strength}</span>
                                        {corr.p_value !== null && (
                                            <span className="opacity-75">p={corr.p_value.toFixed(4)}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Scatter Plot (if pair selected) */}
                {selectedPair && (
                    <Card className="border-none bg-white dark:bg-neutral-900">
                        <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <CardTitle className="text-base font-semibold">
                                Scatter Plot: {selectedPair.col1} vs {selectedPair.col2}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Scatter plot visualization would appear here with actual data points from the dataset.
                                    This requires fetching raw data for the selected columns.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </FeatureGate>
    );
};
