/**
 * PREPROCESSING TAB - Data Transformation & Cleaning
 * ENTERPRISE feature
 */

import React from 'react';
import { Settings2, Wand2, ArrowRight, Table, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export const PreprocessingTab: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">Active Transformations</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        View and manage cleaning steps applied to this dataset version
                    </p>
                </div>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Sparkles className="h-4 w-4" />
                    Auto-Clean Dataset
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-none bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Parser Logic</CardTitle>
                        <Table className="h-5 w-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Original file format converted to internal JSON representation with schema inference.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                                <ChevronRight className="h-3 w-3" />
                                Date normalization (ISO 8601)
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                                <ChevronRight className="h-3 w-3" />
                                Trimmed whitespace from strings
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-white dark:bg-neutral-900 opacity-60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Missing Value Handling</CardTitle>
                        <Wand2 className="h-5 w-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            No active imputation detected. Missing values are currently preserved as nulls.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none bg-white dark:bg-neutral-900 opacity-60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Feature Scaling</CardTitle>
                        <Settings2 className="h-5 w-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            No scaling (Standard/Min-Max) transformations applied to this version.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline Visualization */}
            <Card className="border-none bg-white dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Transformation Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 py-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                                <Table className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Source</span>
                        </div>

                        <ArrowRight className="h-5 w-5 text-neutral-300" />

                        <div className="flex flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50">
                                <Settings2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Parser</span>
                        </div>

                        <ArrowRight className="h-5 w-5 text-neutral-300" />

                        <div className="flex flex-col items-center gap-2">
                            <div className="flex h-12 w-24 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Active Ver.</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Output</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
