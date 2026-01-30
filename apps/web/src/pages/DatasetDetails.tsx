/**
 * DATASET DETAILS PAGE - Core Product Experience
 * 8 investigative tabs with backend integration + AI Analytics Assistant
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ChevronLeft,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LoadingState } from '../components/common/LoadingState';
import AiChat from '../components/analytics/AiChat';
import { Sparkles } from 'lucide-react';

// Lazy load heavy tab components
const OverviewTab = lazy(() => import('../components/tabs/OverviewTab').then(m => ({ default: m.OverviewTab })));
const DistributionsTab = lazy(() => import('../components/tabs/DistributionsTab').then(m => ({ default: m.DistributionsTab })));
const CorrelationsTab = lazy(() => import('../components/tabs/CorrelationsTab').then(m => ({ default: m.CorrelationsTab })));
const PreviewTab = lazy(() => import('../components/tabs/PreviewTab').then(m => ({ default: m.PreviewTab })));
const OutliersTab = lazy(() => import('../components/tabs/OutliersTab').then(m => ({ default: m.OutliersTab })));
const DataQualityTab = lazy(() => import('../components/tabs/DataQualityTab').then(m => ({ default: m.DataQualityTab })));
const PreprocessingTab = lazy(() => import('../components/tabs/PreprocessingTab').then(m => ({ default: m.PreprocessingTab })));
const VersionsTab = lazy(() => import('../components/tabs/VersionsTab').then(m => ({ default: m.VersionsTab })));

const DatasetDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isAiOpen, setIsAiOpen] = useState(false);

    // Fetch dataset info
    const { data: dataset, isLoading: datasetLoading } = useQuery({
        queryKey: ['dataset', id],
        queryFn: async () => {
            const response = await api.get(`/datasets/${id}`);
            return response.data;
        },
        enabled: !!id
    });

    // Fetch dataset processing status
    const { data: status, refetch: refetchStatus } = useQuery({
        queryKey: ['dataset-status', id],
        queryFn: async () => {
            const response = await api.get(`/datasets/${id}/status`);
            return response.data;
        },
        refetchInterval: (query) => {
            const data = query.state.data as any;
            return (data && data.isParsed) ? false : 3000;
        },
        enabled: !!id
    });

    const [triggeringEDA, setTriggeringEDA] = useState(false);

    const handleTriggerEDA = async () => {
        if (!id) return;
        setTriggeringEDA(true);
        try {
            await api.post(`/eda/analyze`, { datasetId: id });
            refetchStatus();
        } catch (error) {
            console.error('EDA Error:', error);
        } finally {
            setTriggeringEDA(false);
        }
    };

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
                    <p className="mt-4 text-sm font-medium">Loading Dataset...</p>
                </div>
            </div>
        );
    }

    if (!dataset) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold">Dataset Not Found</h2>
                    <Button onClick={() => navigate('/datasets')} className="mt-4">Return Home</Button>
                </div>
            </div>
        );
    }

    if (status && !status.isParsed) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="max-w-md text-center p-8">
                    <div className="relative mx-auto mb-8 h-20 w-20">
                        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
                        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-neutral-900 shadow-xl">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Parsing Source Data</h2>
                    <p className="text-slate-500 text-sm mb-6">We're indexing your data and preparing analysis pipelines.</p>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 animate-pulse w-2/3" />
                    </div>
                    <Button variant="ghost" className="mt-8" onClick={() => navigate('/datasets')}>
                        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Library
                    </Button>
                </div>
            </div>
        );
    }

    if (status?.isParsed && !status?.hasEDA) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/datasets')}><ChevronLeft className="h-4 w-4" /></Button>
                    <h1 className="text-3xl font-bold">{dataset.name}</h1>
                </div>
                <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                    <div className="h-24 w-24 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold">Crunching Numbers</h3>
                    <p className="text-slate-500 text-sm max-w-xs mt-2">Performing deep statistical analysis...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="relative min-h-screen bg-white dark:bg-neutral-950 overflow-x-hidden">
            {/* Main Content Area */}
            <div className={cn(
                "p-6 space-y-6 transition-all duration-500 ease-in-out",
                isAiOpen ? "lg:pr-0 lg:mr-[400px]" : "mr-0"
            )}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/datasets')}><ChevronLeft className="h-4 w-4" /></Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{dataset.name}</h1>
                                <div className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Indexed</div>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">{dataset.description || 'Exploratory Data Analysis Report'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsAiOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold shadow-lg shadow-indigo-500/20 px-4"
                        >
                            <Sparkles className="h-4 w-4" />
                            Ask IDA AI
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleTriggerEDA} disabled={triggeringEDA} className="text-xs h-10">
                            {triggeringEDA && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                            {triggeringEDA ? 'Syncing...' : 'Force Re-analyze'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="overflow-x-auto pb-4 scrollbar-hide">
                            <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-full w-fit flex gap-1 border border-slate-200 dark:border-slate-800">
                                {['overview', 'preview', 'distributions', 'correlations', 'outliers', 'quality', 'preprocessing', 'versions'].map(tab => (
                                    <TabsTrigger key={tab} value={tab} className="rounded-full px-5 py-1.5 text-xs font-bold transition-all capitalize">{tab}</TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        <div className="mt-4">
                            <Suspense fallback={<LoadingState variant="page" message="Accessing analysis..." />}>
                                <TabsContent value="overview"><OverviewTab datasetId={id!} /></TabsContent>
                                <TabsContent value="preview"><PreviewTab datasetId={id!} /></TabsContent>
                                <TabsContent value="distributions"><DistributionsTab datasetId={id!} /></TabsContent>
                                <TabsContent value="correlations"><CorrelationsTab datasetId={id!} /></TabsContent>
                                <TabsContent value="outliers"><OutliersTab datasetId={id!} /></TabsContent>
                                <TabsContent value="quality"><DataQualityTab datasetId={id!} /></TabsContent>
                                <TabsContent value="preprocessing"><PreprocessingTab datasetId={id!} /></TabsContent>
                                <TabsContent value="versions"><VersionsTab datasetId={id!} /></TabsContent>
                            </Suspense>
                        </div>
                    </Tabs>
                </div>
            </div>

            {/* AI Floating Sidebar (Professional Drawer Style) */}
            <div className={cn(
                "fixed top-0 right-0 h-full w-full lg:w-[400px] z-50 bg-white dark:bg-slate-900 shadow-2xl transition-all duration-500 ease-in-out transform border-l border-slate-200 dark:border-slate-800",
                isAiOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="h-full flex flex-col">
                    {/* Drawer Header Controls */}
                    <div className="absolute left-[-48px] top-24 hidden lg:block">
                        {!isAiOpen && (
                            <Button
                                onClick={() => setIsAiOpen(true)}
                                className="h-12 w-12 rounded-l-2xl rounded-r-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl animate-pulse-subtle"
                            >
                                <Sparkles className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden h-full">
                        <AiChat datasetId={id} onClose={() => setIsAiOpen(false)} />
                    </div>
                </div>
            </div>

            {/* Backdrop for mobile */}
            {isAiOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden"
                    onClick={() => setIsAiOpen(false)}
                />
            )}
        </div>
    );
};

export default DatasetDetails;
