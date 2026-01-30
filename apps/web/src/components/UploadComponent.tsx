import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { uploadFile } from '../services/api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface UploadComponentProps {
    projectId?: string;
    onUploadComplete?: () => void;
    className?: string;
}

const UploadComponent: React.FC<UploadComponentProps> = ({
    projectId,
    onUploadComplete,
    className
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const navigate = useNavigate();
    const { tenant } = useAuthStore();

    const handleFiles = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            if (!tenant?.id) throw new Error('Tenant context not found');
            const tenantId = tenant.id;

            const result = await uploadFile(file, tenantId, projectId);

            if (onUploadComplete) {
                onUploadComplete();
            } else {
                navigate(`/datasets/${result.upload.datasetId}`);
            }

        } catch (err: any) {
            console.error(err);
            // Extract the actual message from the backend response if available
            const backendMessage = err.response?.data?.message || err.response?.data?.error;
            setError(backendMessage || err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    return (
        <div className={cn("grid gap-4", className)}>
            {/* Minimal Dropzone - Grey Background (Low Brightness) */}
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "group relative flex flex-col items-center justify-center gap-3 py-10 px-4 text-center rounded-xl border border-dashed transition-all cursor-pointer",
                    dragActive
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                        : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700",
                    uploading && "pointer-events-none opacity-50"
                )}
            >
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleFiles(e.target.files)}
                    accept=".csv,.xlsx,.json,.pdf,.parquet"
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">Processing...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 group-hover:text-primary-600 group-hover:scale-110 transition-all duration-300">
                            <Upload className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-primary-700 transition-colors">
                                <span className="font-semibold text-primary-600 hover:underline">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                CSV, Excel, JSON or Parquet (max 100MB)
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex flex-col gap-2 text-error-600 bg-error-50 dark:bg-error-950/30 px-3 py-3 rounded-lg text-xs border border-error-100 dark:border-error-900">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                                <span className="font-semibold block">Upload Failed</span>
                                <span>{error}</span>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setError(null); }}>
                            <X className="h-3.5 w-3.5 opacity-70 hover:opacity-100" />
                        </button>
                    </div>

                    {/* Show Upgrade Button if plan limit reached */}
                    {error.includes('limit') && (
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/billing');
                            }}
                        >
                            <Sparkles className="h-3 w-3 mr-2" />
                            Upgrade Plan
                        </Button>
                    )}
                </div>
            )}

            {/* Tiny Trust Badge - Darker background */}
            <div className="flex justify-center">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    <Sparkles className="h-2.5 w-2.5 text-slate-400" />
                    <span>Intelligent Analysis Pipeline Active</span>
                </div>
            </div>
        </div>
    );
};

export default UploadComponent;
