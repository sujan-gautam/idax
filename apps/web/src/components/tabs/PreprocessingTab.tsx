/**
 * PREPROCESSING TAB - Data Transformation & Cleaning
 * ENTERPRISE feature
 */

import React, { useState } from 'react';
import {
    Settings2,
    Wand2,
    ArrowRight,
    Table,
    Sparkles,
    ChevronRight,
    CheckCircle2,
    Loader2,
    AlertCircle,
    RotateCcw,
    Trash2,
    Type
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';

interface PreprocessingTabProps {
    datasetId: string;
}

interface CleanSummary {
    originalRows: number;
    droppedDuplicates: number;
    filledMissing: number;
    outliersCapped: number;
    textStandardized: number;
    finalRows: number;
}

export const PreprocessingTab: React.FC<PreprocessingTabProps> = ({ datasetId }) => {
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanResult, setCleanResult] = useState<CleanSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAutoClean = async () => {
        setIsCleaning(true);
        setError(null);
        try {
            const response = await api.post(`/datasets/${datasetId}/eda/clean`, {
                options: {
                    dropDuplicates: true,
                    fillMissing: true,
                    removeOutliers: true,
                    standardizeText: true
                }
            });
            setCleanResult(response.data.summary);
        } catch (err: any) {
            console.error('Clean failed:', err);
            setError(err.message || 'Auto-clean failed');
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">Data Preprocessing</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Sanitize, transform, and optimize your dataset for analysis.
                    </p>
                </div>
                {!cleanResult ? (
                    <Button
                        onClick={handleAutoClean}
                        disabled={isCleaning}
                        className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-105"
                    >
                        {isCleaning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        {isCleaning ? 'Cleaning Dataset...' : 'Auto-Clean Dataset'}
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        onClick={() => setCleanResult(null)}
                        className="gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset View
                    </Button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Clean Result Summary */}
            {cleanResult && (
                <Card className="border-none bg-indigo-600 text-white shadow-xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle2 className="h-32 w-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Auto-Clean Summary
                        </CardTitle>
                        <CardDescription className="text-indigo-100">
                            The following improvements were simulated on your dataset.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-200">Duplicates</div>
                                <div className="text-3xl font-bold">{cleanResult.droppedDuplicates}</div>
                                <div className="text-xs text-indigo-100">Rows removed</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-200">Missing Values</div>
                                <div className="text-3xl font-bold">{cleanResult.filledMissing}</div>
                                <div className="text-xs text-indigo-100">Cells imputed</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-200">Outliers</div>
                                <div className="text-3xl font-bold">{cleanResult.outliersCapped}</div>
                                <div className="text-xs text-indigo-100">Extreme values capped</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-200">Text Sync</div>
                                <div className="text-3xl font-bold">{cleanResult.textStandardized}</div>
                                <div className="text-xs text-indigo-100">Strings standardized</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Step 1: Parsing */}
                <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">Parser Logic</CardTitle>
                            <CardDescription>Format conversion</CardDescription>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                            <Table className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Dataset parsed into internal schema with type inference.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                Date normalization (ISO 8601)
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                UTF-8 Encoding verification
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2: Quality Cleaning */}
                <Card className={cn(
                    "border-none transition-all",
                    cleanResult ? "bg-white dark:bg-neutral-900 shadow-sm" : "bg-white dark:bg-neutral-900 opacity-60"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">Cleaning Engine</CardTitle>
                            <CardDescription>Missing & Duplicate handle</CardDescription>
                        </div>
                        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                            <Trash2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            {cleanResult ? 'Active cleaning rules applied to this pipeline.' : 'No cleaning rules currently active in this version.'}
                        </p>
                        {cleanResult && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    <ChevronRight className="h-3 w-3" />
                                    Median imputation for numbers
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    <ChevronRight className="h-3 w-3" />
                                    Exact duplicate row removal
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 3: Text Standardization */}
                <Card className={cn(
                    "border-none transition-all",
                    cleanResult ? "bg-white dark:bg-neutral-900 shadow-sm" : "bg-white dark:bg-neutral-900 opacity-60"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">Standardization</CardTitle>
                            <CardDescription>Text & Type consistency</CardDescription>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                            <Type className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Formatting rules for text columns and categorical consistency.
                        </p>
                        {cleanResult && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Trim leading/trailing spaces
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline Visualization */}
            <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <CardHeader className="bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                    <CardTitle className="text-base font-semibold">Active Transformation Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="p-12">
                    <div className="flex items-center justify-center gap-4">
                        <PipelineNode icon={<Table />} label="Data Source" color="neutral" />
                        <PipelineArrow active={true} />
                        <PipelineNode icon={<Settings2 />} label="Parser" color="orange" />
                        <PipelineArrow active={!!cleanResult} />
                        <PipelineNode icon={<Sparkles />} label="Auto-Clean" color="indigo" disabled={!cleanResult} />
                        <PipelineArrow active={true} />
                        <PipelineNode icon={<Wand2 />} label="Final Output" color="blue" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const PipelineNode = ({ icon, label, color, disabled }: { icon: any, label: string, color: string, disabled?: boolean }) => {
    const colors: any = {
        neutral: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700",
        orange: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
        indigo: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
        blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    };

    return (
        <div className={cn("flex flex-col items-center gap-2 transition-all duration-500", disabled && "opacity-30 grayscale")}>
            <div className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl border-2 shadow-sm transition-all",
                colors[color]
            )}>
                {React.cloneElement(icon, { size: 28 })}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</span>
        </div>
    );
};

const PipelineArrow = ({ active }: { active: boolean }) => (
    <div className={cn("flex items-center px-2 transition-all duration-500", !active && "opacity-20")}>
        <div className={cn(
            "h-[2px] w-12",
            active ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-neutral-300"
        )} />
        <ChevronRight className={cn(
            "h-4 w-4 -ml-2",
            active ? "text-indigo-500" : "text-neutral-300"
        )} />
    </div>
);
