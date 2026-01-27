import React, { useState, useEffect } from 'react';
import {
    History,
    RotateCcw,
    Download,
    FileCheck,
    User,
    Calendar,
    Database,
    Loader2,
    ChevronRight,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface VersionsTabProps {
    datasetId: string;
}

const VersionsTab: React.FC<VersionsTabProps> = ({ datasetId }) => {
    const { tenant } = useAuthStore();
    const [dataset, setDataset] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVersions();
    }, [datasetId, tenant?.id]);

    const loadVersions = async () => {
        if (!tenant?.id) return;
        try {
            setLoading(true);
            const response = await api.get(`/datasets/${datasetId}`, {
                headers: { 'x-tenant-id': tenant.id }
            });
            setDataset(response.data);
        } catch (error) {
            console.error('Failed to load versions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const versions = dataset?.versions || [];

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight">Version Timeline</h2>
                    <p className="text-sm text-slate-500">Immutable audit trail of your dataset lifecycle.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Export History
                    </Button>
                </div>
            </div>

            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
                {versions.length === 0 ? (
                    <div className="pl-12 py-12 text-center text-slate-500 italic text-sm">
                        No versions recorded yet.
                    </div>
                ) : (
                    versions.map((version: any, idx: number) => (
                        <div key={version.id} className="relative pl-12 group">
                            {/* Timeline dot */}
                            <div className={cn(
                                "absolute left-0 h-10 w-10 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center z-10 transition-colors shadow-sm",
                                idx === 0 ? "bg-primary text-primary-foreground" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-200"
                            )}>
                                {idx === 0 ? <Zap className="h-5 w-5 fill-current" /> : <History className="h-5 w-5" />}
                            </div>

                            <Card className={cn(
                                "border-none shadow-sm transition-all overflow-hidden",
                                idx === 0 ? "ring-1 ring-primary/20 bg-primary/5 dark:bg-primary/10 shadow-md" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}>
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row md:items-center p-5 gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-lg font-bold">v{version.versionNumber}</span>
                                                {idx === 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-primary text-[10px] font-black uppercase text-primary-foreground tracking-widest shadow-sm">
                                                        LIVE
                                                    </span>
                                                )}
                                                <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {version.rowCount?.toLocaleString() || 0} rows · {version.columnCount || 0} columns
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(version.createdAt).toLocaleString()}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <User className="h-3.5 w-3.5" />
                                                    {version.createdBy || 'Automated Pipeline'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Database className="h-3.5 w-3.5" />
                                                    {version.sourceType || 'S3 Artifact'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 overflow-hidden">
                                                    <FileCheck className="h-3.5 w-3.5" />
                                                    <span className="truncate">{version.artifactS3Key.split('/').pop()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col gap-2 shrink-0">
                                            {idx > 0 && (
                                                <Button variant="outline" size="sm" className="h-8">
                                                    <RotateCcw className="mr-2 h-4 w-4" /> Rollback
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="h-8">
                                                <Download className="mr-2 h-4 w-4" /> Download
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20 border-dashed text-center space-y-3">
                <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto" />
                <div className="space-y-1">
                    <h4 className="text-sm font-bold">Immutable Storage Enabled</h4>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto">
                        All artifact versions are stored securely in AWS S3 with SHA-256 content hashing.
                        Version history cannot be modified after creation to ensure full audit compliance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VersionsTab;
