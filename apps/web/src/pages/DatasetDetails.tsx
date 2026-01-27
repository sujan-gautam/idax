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

    // EDA status - disabled for now as endpoint doesn't exist
    // TODO: Implement /datasets/:id/eda/status endpoint in backend
    const edaStatus: { status?: string; error_message?: string } | undefined = undefined;
    const statusLoading = false;
    const refetchStatus = () => { };

    // Trigger EDA analysis
    const [triggeringEDA, setTriggeringEDA] = useState(false);

    const handleTriggerEDA = async () => {
        if (!id) return;

        setTriggeringEDA(true);
        try {
            await api.post(`/eda/analyze`, { datasetId: id });
            // Refetch dataset to get updated EDA info
            // refetchStatus();
        } catch (error) {
            console.error('Failed to trigger EDA:', error);
            alert('Failed to start analysis. Please try again.');
        } finally {
            setTriggeringEDA(false);
        }
    };

    if (datasetLoading || statusLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
                    <p className="mt-4 text-lg font-medium text-neutral-700 dark:text-neutral-300">
                        Loading dataset...
                    </p>
                </div>
            </div>
        );
    }

    if (!dataset) {
        return (
            <div className="flex min-h-screen items-center justify-center">
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

    // Show EDA trigger if not started
    if (edaStatus?.status === 'not_started') {
        return (
            <div className="space-y-6 p-6">
                {/* Header */}
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

                {/* Trigger EDA */}
                <div className="flex min-h-[500px] items-center justify-center">
                    <div className="max-w-md text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                            <Play className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-neutral-0">
                            Start Analysis
                        </h3>
                        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
                            Run exploratory data analysis to unlock insights about your dataset
                        </p>
                        <Button
                            onClick={handleTriggerEDA}
                            disabled={triggeringEDA}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                            {triggeringEDA ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Starting Analysis...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Analysis
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading if analysis is running
    if (edaStatus?.status === 'pending' || edaStatus?.status === 'running') {
        return (
            <div className="space-y-6 p-6">
                {/* Header */}
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

                {/* Analysis in progress */}
                <div className="flex min-h-[500px] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-16 w-16 animate-spin text-indigo-600" />
                        <p className="mt-6 text-xl font-medium text-neutral-900 dark:text-neutral-0">
                            Analyzing your dataset...
                        </p>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            This may take a few moments depending on dataset size
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error if analysis failed
    if (edaStatus?.status === 'failed') {
        return (
            <div className="space-y-6 p-6">
                {/* Header */}
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
                    </div>
                </div>

                {/* Error state */}
                <div className="flex min-h-[500px] items-center justify-center">
                    <div className="max-w-md text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                        <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-0">
                            Analysis Failed
                        </p>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            {edaStatus.error_message || 'An error occurred during analysis'}
                        </p>
                        <Button onClick={handleTriggerEDA} className="mt-6">
                            Retry Analysis
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Show tabs if analysis is complete
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
                <TabsList className="grid w-full grid-cols-8 lg:w-auto">
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
