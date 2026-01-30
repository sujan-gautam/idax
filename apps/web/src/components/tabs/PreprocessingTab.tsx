/**
 * PREPROCESSING TAB - Data Transformation & Cleaning
 * ENTERPRISE feature
 */

import React, { useState } from 'react';
import {
    Settings2,
    Wand2,
    Table,
    Sparkles,
    ChevronRight,
    CheckCircle2,
    Loader2,
    AlertCircle,
    RotateCcw,
    Trash2,
    Shield,
    FileSearch,
    History,
    FileWarning,
    Activity,
    BrainCircuit,
    Info,
    Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';

interface PreprocessingTabProps {
    datasetId: string;
}

interface CleanLog {
    timestamp: string;
    action: string;
    reason: string;
    count: number;
    affectedColumns?: string[];
}

interface CleanSummary {
    originalRows: number;
    finalRows: number;
    droppedDuplicates: number;
    filledMissing: number;
    outliersCapped: number;
    textStandardized: number;
    beforeQualityScore: number;
    afterQualityScore: number;
    logs: CleanLog[];
    intents: Record<string, string>;
    schemaValidation: {
        isValid: boolean;
        errors: string[];
    };
}

export const PreprocessingTab: React.FC<PreprocessingTabProps> = ({ datasetId }) => {
    const [isCleaning, setIsCleaning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [cleanResult, setCleanResult] = useState<CleanSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [protectedCols, setProtectedCols] = useState<string[]>([]);

    // Fetch schema to allow protected column selection
    const { data: overview } = useQuery({
        queryKey: ['eda-overview', datasetId],
        queryFn: async () => {
            const EDA_SERVICE_URL = 'http://localhost:8004';
            const response = await fetch(`${EDA_SERVICE_URL}/eda/overview?datasetId=${datasetId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'x-tenant-id': JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.tenant?.id || ''
                }
            });
            if (!response.ok) throw new Error('Failed to fetch overview');
            return response.json();
        }
    });

    const columns = overview?.columns || [];

    const handleAutoClean = async () => {
        setIsCleaning(true);
        setError(null);
        try {
            // Call EDA service (port 8004) via proxy
            const EDA_SERVICE_URL = 'http://localhost:8004';
            const response = await fetch(`${EDA_SERVICE_URL}/eda/clean`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'x-tenant-id': JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.tenant?.id || ''
                },
                body: JSON.stringify({
                    datasetId,
                    options: {
                        dropDuplicates: true,
                        fillMissing: true,
                        removeOutliers: true,
                        standardizeText: true,
                        protectedColumns: protectedCols,
                        validateSchema: true,
                        detectIntent: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Clean failed: ${response.statusText}`);
            }

            const data = await response.json();
            setCleanResult(data.summary);
        } catch (err: any) {
            console.error('Clean failed:', err);
            setError(err.message || 'Auto-clean failed');
        } finally {
            setIsCleaning(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // Call EDA service (port 8004) via proxy
            const EDA_SERVICE_URL = 'http://localhost:8004';
            const response = await fetch(`${EDA_SERVICE_URL}/eda/clean`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'x-tenant-id': JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.tenant?.id || ''
                },
                body: JSON.stringify({
                    datasetId,
                    save: true,
                    options: {
                        dropDuplicates: true,
                        fillMissing: true,
                        removeOutliers: true,
                        standardizeText: true,
                        protectedColumns: protectedCols,
                        validateSchema: true,
                        detectIntent: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Save failed: ${response.statusText}`);
            }

            // Reset to initial state after save
            setCleanResult(null);
        } catch (err: any) {
            console.error('Save failed:', err);
            setError(err.message || 'Failed to save version');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleProtected = (col: string) => {
        setProtectedCols(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
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
                        {isCleaning ? 'Processing Dataset...' : 'Run Auto-Clean'}
                    </Button>
                ) : (

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setCleanResult(null)}
                            disabled={isSaving}
                            className="gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Discard
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none transition-all hover:scale-105"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isSaving ? 'Saving Version...' : 'Save New Version'}
                        </Button>
                    </div>
                )
                }
            </div >

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {
                !cleanResult ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Protected Columns Selector */}
                        <Card className="md:col-span-1 border-none bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                            <CardHeader className="bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-500">
                                    <Shield className="h-4 w-4" />
                                    Protected Columns
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <p className="text-xs text-neutral-500 mb-4">Selected columns will be excluded from imputation and outlier capping.</p>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {columns.map((col: any) => (
                                        <label
                                            key={col.name}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border-2",
                                                protectedCols.includes(col.name)
                                                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10"
                                                    : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={protectedCols.includes(col.name)}
                                                    onChange={() => toggleProtected(col.name)}
                                                />
                                                <span className="text-sm font-medium">{col.name}</span>
                                            </div>
                                            <span className="text-[10px] text-neutral-400 uppercase">{col.type}</span>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 border-none bg-white dark:bg-neutral-900 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-600" />
                                    Active Clean Options
                                </CardTitle>
                                <CardDescription>Intelligent defaults are pre-configured for your dataset.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { icon: <BrainCircuit />, title: "Intent Detection", desc: "Senses IDs, Categories, and Temporary data for specialized handling." },
                                    { icon: <Trash2 />, title: "Deduplication", desc: "Removes exact duplicate rows causing data skew." },
                                    { icon: <History />, title: "Imputation", desc: "Smart-fills missing numbers with median values." },
                                    { icon: <FileSearch />, title: "Schema Validation", desc: "Cross-checks dataset structure against registry." }
                                ].map((opt, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 h-fit">
                                            {React.cloneElement(opt.icon as any, { size: 20 })}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold">{opt.title}</h4>
                                            <p className="text-xs text-neutral-500">{opt.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Quality Improvement Section */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-none bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl">
                                <CardContent className="pt-6">
                                    <div className="text-xs font-bold uppercase tracking-widest text-indigo-200">Before Score</div>
                                    <div className="text-4xl font-black mt-2">{cleanResult.beforeQualityScore}%</div>
                                    <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white" style={{ width: `${cleanResult.beforeQualityScore}%` }} />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xl">
                                <CardContent className="pt-6">
                                    <div className="text-xs font-bold uppercase tracking-widest text-emerald-200">After Score</div>
                                    <div className="text-4xl font-black mt-2">{cleanResult.afterQualityScore}%</div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                                            +{Math.round((cleanResult.afterQualityScore - cleanResult.beforeQualityScore) * 10) / 10}% IMPROVEMENT
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Rows Processed</div>
                                    <div className="text-4xl font-black mt-2">{cleanResult.originalRows}</div>
                                    <div className="text-xs text-neutral-500 mt-2">Final shape: {cleanResult.finalRows} rows</div>
                                </CardContent>
                            </Card>
                            <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Intent Mappings</div>
                                    <div className="text-4xl font-black mt-2 text-indigo-600">{Object.keys(cleanResult.intents).length}</div>
                                    <div className="text-xs text-neutral-500 mt-2">Semantic analysis applied</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Explain-Why Logs */}
                            <Card className="lg:col-span-2 border-none bg-white dark:bg-neutral-900 shadow-sm">
                                <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <History className="h-5 w-5 text-indigo-600" />
                                        Transparency Logs: Explain-Why
                                    </CardTitle>
                                    <CardDescription>Traceable record of all transformations applied.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {cleanResult.logs.map((log, i) => (
                                            <div key={i} className="p-4 flex gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                                    <div className="text-[10px] font-bold">{i + 1}</div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-0">{log.action}</h4>
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                                                            {log.count} Affected
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-500 mt-1">{log.reason}</p>
                                                    <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1">
                                                        <Info className="h-3 w-3" />
                                                        Executed at {new Date(log.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                {/* Intent Detection Results */}
                                <Card className="border-none bg-white dark:bg-neutral-900 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base">Column Intents</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-2">
                                        {Object.entries(cleanResult.intents).slice(0, 8).map(([col, intent]) => (
                                            <div key={col} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                                <span className="text-xs font-medium truncate max-w-[120px]">{col}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold uppercase">
                                                    {intent.replace('_', ' ')}
                                                </span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Schema Validation */}
                                <Card className={cn(
                                    "border-none shadow-sm",
                                    cleanResult.schemaValidation.isValid ? "bg-emerald-50 dark:bg-emerald-900/10" : "bg-red-50 dark:bg-red-900/10"
                                )}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            {cleanResult.schemaValidation.isValid ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <FileWarning className="h-5 w-5 text-red-600" />
                                            )}
                                            Schema Health
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {cleanResult.schemaValidation.isValid ? (
                                            <p className="text-xs text-emerald-700 dark:text-emerald-400">Your dataset perfectly matches the registered schema definition.</p>
                                        ) : (
                                            <ul className="space-y-1">
                                                {cleanResult.schemaValidation.errors.map((err, i) => (
                                                    <li key={i} className="text-xs text-red-600 dark:text-red-400 flex gap-2">
                                                        <span className="font-bold">•</span>
                                                        {err}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Pipeline Visualization */}
            {
                !cleanResult && (
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
                )
            }
        </div >
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
