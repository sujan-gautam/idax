/**
 * VERSIONS TAB - Dataset History & Rollback
 * Core feature - available to everyone
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, RotateCcw, Download, CheckCircle, Clock, Database } from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface VersionsTabProps {
    datasetId: string;
}

interface Version {
    id: string;
    versionNumber: number;
    rowCount: number;
    columnCount: number;
    createdAt: string;
    artifactS3Key: string;
    isCurrent: boolean;
}

export const VersionsTab: React.FC<VersionsTabProps> = ({ datasetId }) => {
    const { data: versions, isLoading } = useQuery<Version[]>({
        queryKey: ['dataset-versions', datasetId],
        queryFn: async () => {
            const response = await api.get(`/datasets/${datasetId}/versions`);
            // The API might not return isCurrent, we'll mark the latest as current for UI
            const data = response.data;
            if (data.length > 0) {
                // In a real app we'd get activeVersionId from dataset
                return data.map((v: any, i: number) => ({ ...v, isCurrent: i === 0 }));
            }
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton-loader h-24 w-full" />
                ))}
            </div>
        );
    }

    if (!versions || versions.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <div className="text-center">
                    <History className="mx-auto h-12 w-12 text-neutral-400" />
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">No version history found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">Version History</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Immutable snapshots of your data after transformations
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {versions.map((version) => (
                    <Card
                        key={version.id}
                        className={cn(
                            "border-none transition-all",
                            version.isCurrent
                                ? "ring-2 ring-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10"
                                : "bg-white dark:bg-neutral-900"
                        )}
                    >
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-xl border-2",
                                        version.isCurrent
                                            ? "border-indigo-200 bg-white text-indigo-600 dark:bg-neutral-950 dark:border-indigo-800"
                                            : "border-neutral-100 bg-neutral-50 text-neutral-500 dark:bg-neutral-950 dark:border-neutral-800"
                                    )}>
                                        <Database className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-0">
                                                Version {version.versionNumber}
                                            </h3>
                                            {version.isCurrent && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {format(new Date(version.createdAt), 'MMM d, yyyy · HH:mm')}
                                            </span>
                                            <span className="flex items-center gap-1 font-medium">
                                                {version.rowCount.toLocaleString()} rows · {version.columnCount} columns
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Download className="h-4 w-4" />
                                        Download Artifact
                                    </Button>
                                    {!version.isCurrent && (
                                        <Button variant="outline" size="sm" className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400">
                                            <RotateCcw className="h-4 w-4" />
                                            Restore Version
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
