/**
 * DATASET DETAILS PAGE - Core Product Experience
 * 8 investigative tabs with backend integration
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ChevronLeft,
    Play,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { OverviewTab } from '../components/tabs/OverviewTab';
import { DistributionsTab } from '../components/tabs/DistributionsTab';
import { CorrelationsTab } from '../components/tabs/CorrelationsTab';
import { cn } from '../lib/utils';

const DatasetDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch dataset info
    const { data: dataset, isLoading: datasetLoading } = useQuery({
        queryKey: ['dataset', id],
        queryFn: async () => {
            const response = await api.get(`/datasets/${id}`);
            return response.data;
        }
    });

    // Fetch dataset processing status with polling
    const { data: status, refetch: refetchStatus } = useQuery({
        queryKey: ['dataset-status', id],
        queryFn: async () => {
            const response = await api.get(`/datasets/${id}/status`);
            return response.data;
        },
        refetchInterval: (query) => {
            const data = query.state.data as any;
            return (data && data.isParsed) ? false : 3000; // Poll every 3s until parsed
        },
        enabled: !!id
    });

    // Trigger EDA analysis
    const [triggeringEDA, setTriggeringEDA] = useState(false);

    const handleTriggerEDA = async () => {
        if (!id) return;

        setTriggeringEDA(true);
        try {
            await api.post(`/eda/analyze`, { datasetId: id });
            // Re-fetch status to update the UI
            refetchStatus();
        } catch (error) {
            console.error('Failed to trigger EDA:', error);
            // alert('Failed to start analysis. Please try again.');
        } finally {
            setTriggeringEDA(false);
        }
    };

    // Auto-trigger EDA if parsed but not analyzed
    useEffect(() => {
        if (status?.isParsed && !status?.hasEDA && !triggeringEDA) {
            handleTriggerEDA();
        }
    }, [status?.isParsed, status?.hasEDA]);

    if (datasetLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
                    <p className="mt-4 text-lg font-medium text-neutral-700 dark:text-neutral-300">
                        Loading dataset info...
                    </p>
                </div>
            </div>
        );
    }

    if (!dataset) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-0">
                        Dataset not found
                    </p>
                    <Button onClick={() => navigate('/datasets')} className="mt-4">
                        Back to Datasets
                    </Button>
                </div>
            </div>
        );
    }

    // Show processing screen if not parsed yet
    if (status && !status.isParsed) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="max-w-md text-center">
                    <div className="relative mx-auto mb-8 h-24 w-24">
                        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20"></div>
                        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-lg dark:bg-neutral-900">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        </div>
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-0">
                        Processing Your Data
                    </h2>
                    <p className="mb-6 text-neutral-600 dark:text-neutral-400">
                        We're currently parsing your file and preparing the analysis engine. This usually takes less than a minute.
                    </p>
                    <div className="space-y-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                            <div className="h-full animate-pulse bg-indigo-600" style={{ width: '60%' }}></div>
                        </div>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            Step: Parsing & Schema Inference...
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        className="mt-8"
                        onClick={() => navigate('/datasets')}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to My Datasets
                    </Button>
                </div>
            </div>
        );
    }

    // Analysis in progress (if we have a version but no EDA results yet)
    if (status?.isParsed && !status?.hasEDA) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/datasets')} className="gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-0">{dataset.name}</h1>
                    </div>
                </div>
                <div className="flex min-h-[500px] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-16 w-16 animate-spin text-indigo-600" />
                        <p className="mt-6 text-xl font-medium text-neutral-900 dark:text-neutral-0">
                            Analyzing your dataset...
                        </p>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            Performing statistical calculations and quality checks.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Main view with tabs
    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/datasets')}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-0">
                            {dataset.name}
                        </h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {dataset.description || 'No description'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTriggerEDA}
                    disabled={triggeringEDA}
                >
                    {triggeringEDA ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Re-analyzing...
                        </>
                    ) : (
                        'Re-analyze'
                    )}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 lg:w-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="distributions">Distributions</TabsTrigger>
                    <TabsTrigger value="correlations">Correlations</TabsTrigger>
                    <TabsTrigger value="outliers">Outliers</TabsTrigger>
                    <TabsTrigger value="quality">Quality</TabsTrigger>
                    <TabsTrigger value="preprocessing">Preprocessing</TabsTrigger>
                    <TabsTrigger value="versions">Versions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <OverviewTab datasetId={id!} />
                </TabsContent>

                <TabsContent value="preview">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Preview tab coming soon
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="distributions">
                    <DistributionsTab datasetId={id!} />
                </TabsContent>

                <TabsContent value="correlations">
                    <CorrelationsTab datasetId={id!} />
                </TabsContent>

                <TabsContent value="outliers">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Outliers tab coming soon
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="quality">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Data Quality tab coming soon
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="preprocessing">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Preprocessing tab coming soon
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="versions">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Versions tab coming soon
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DatasetDetails;
