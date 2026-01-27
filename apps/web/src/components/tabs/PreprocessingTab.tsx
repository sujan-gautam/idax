import React from 'react';
import {
    Wand2,
    Play,
    History,
    CheckCircle2,
    Sparkles,
    Zap,
    Info,
    ShieldCheck,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface PreprocessingTabProps {
    datasetId: string;
}

const PreprocessingTab: React.FC<PreprocessingTabProps> = ({ datasetId }) => {
    const recipes = [
        {
            id: 1,
            name: 'Impute Missing Features',
            description: 'Automatically fill missing numerical values using Median and categorical using Mode.',
            impact: 'Affects 240 rows',
            type: 'CLEANING',
            confidence: 98
        },
        {
            id: 2,
            name: 'Encoding Pipeline',
            description: 'Convert categorical strings into machine-learning ready numeric encodings.',
            impact: 'Adds 12 new features',
            type: 'FEATURE_ENG',
            confidence: 94
        },
        {
            id: 3,
            name: 'Outlier Clipping',
            description: 'Cap extreme values at the 1st and 99th percentiles to reduce model noise.',
            impact: 'Modifies 15 outliers',
            type: 'STABILIZATION',
            confidence: 91
        },
    ];

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight">Preprocessing Recipes</h2>
                    <p className="text-sm text-slate-500">Apply AI-driven transformations to prepare your data for modeling.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <History className="mr-2 h-4 w-4" /> Audit Log
                    </Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <Zap className="mr-2 h-4 w-4" /> Run All Recipes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Recipe List */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
                            <Sparkles className="h-32 w-32" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wand2 className="h-5 w-5" />
                                Smart Recommendations
                            </CardTitle>
                            <CardDescription className="text-indigo-100">
                                IDA has analyzed your dataset quality and suggests these recipes to improve model performance.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="space-y-3">
                        {recipes.map((recipe) => (
                            <Card key={recipe.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="w-full md:w-1.5 bg-indigo-500" />
                                        <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{recipe.name}</h4>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold uppercase tracking-tighter text-slate-500">
                                                        {recipe.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
                                                    {recipe.description}
                                                </p>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                                        <CheckCircle2 className="h-3 w-3" /> {recipe.impact}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                                                        <ShieldCheck className="h-3 w-3" /> {recipe.confidence}% Confidence
                                                    </div>
                                                </div>
                                            </div>
                                            <Button className="shrink-0">
                                                <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Apply
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Recipe Summary / Custom Recipe */}
                <div className="space-y-4">
                    <Card className="border-none shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Recipe Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Applied Steps</span>
                                    <span className="font-bold">0</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Pending Approvals</span>
                                    <span className="font-bold">3</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Est. Accuracy Gain</span>
                                    <span className="font-bold text-emerald-500">+4.2%</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t space-y-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider">Custom Transformation</h5>
                                <p className="text-xs text-slate-500">Define your own python or SQL based transformations.</p>
                                <Button variant="outline" className="w-full justify-between">
                                    Create Custom Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border flex items-start gap-3">
                                <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    All transformations create a new immutable version of your dataset. You can rollback at any time from the Versions tab.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PreprocessingTab;
