
import React, { useState, useEffect } from 'react';
import {
    Database,
    Zap,
    Cpu,
    BarChart3,
    CheckCircle2,
    Activity,
    Shield,
    Search,
    ArrowRight,
    Server
} from 'lucide-react';
import { cn } from '../../lib/utils';

const PipelineVisualization: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(0);

    const steps = [
        { name: "Ingestion", icon: <Database className="h-5 w-5" />, status: "active", detail: "Connecting to S3/Cloud Storage" },
        { name: "Validation", icon: <Shield className="h-5 w-5" />, status: "pending", detail: "Schema checking & security audit" },
        { name: "Processing", icon: <Server className="h-5 w-5" />, status: "pending", detail: "Parsing & normalization" },
        { name: "AI Insight", icon: <Cpu className="h-5 w-5" />, status: "pending", detail: "Anomaly detection & pattern mining" },
        { name: "Distribution", icon: <Zap className="h-5 w-5" />, status: "pending", detail: "Generating edge-cached results" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    setActiveStep((step) => (step + 1) % steps.length);
                    return 0;
                }
                return prev + 1;
            });
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-[#0a0a0a] rounded-lg overflow-hidden flex flex-col p-3 md:p-6 font-sans relative">
            {/* Header / Metrics Bar */}
            <div className="flex items-center justify-between mb-4 md:mb-10 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 md:h-5 md:w-5 text-indigo-500 animate-pulse" />
                    <span className="text-slate-300 text-[9px] md:text-sm font-mono tracking-wider uppercase">Pipeline Context</span>
                </div>
                <div className="flex gap-3 md:gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[7px] md:text-[10px] text-slate-500 uppercase font-bold">Flow</span>
                        <span className="text-[10px] md:text-sm text-indigo-400 font-mono">1.2 GB/s</span>
                    </div>
                </div>
            </div>

            {/* Nodes Section - Wrapped in a container that handles center alignment */}
            <div className="flex-1 flex flex-col justify-center relative min-h-[140px] md:min-h-0">
                <div className="flex items-center justify-around w-full relative z-10 px-0 md:px-4">
                    {/* Connecting Line Background - Now relative to the flex container */}
                    <div className="absolute top-1/2 left-4 right-4 h-px bg-white/5 -translate-y-[22px] md:-translate-y-[28px]" />

                    {steps.map((step, index) => {
                        const isActive = index === activeStep;
                        const isCompleted = index < activeStep;

                        return (
                            <div key={step.name} className="flex flex-col items-center relative">
                                {/* Connection Pulse (Animated Line) */}
                                {index < steps.length - 1 && (
                                    <div className="absolute top-[20px] md:top-[28px] left-1/2 w-full h-px overflow-hidden pointer-events-none -z-10 translate-y-[-0.5px]">
                                        <div
                                            className={cn(
                                                "h-full bg-gradient-to-r from-indigo-500 to-transparent transition-all duration-300",
                                                isActive ? "w-full animate-shimmer" : "w-0"
                                            )}
                                        />
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        "h-9 w-9 md:h-14 md:w-14 rounded-lg md:rounded-2xl border flex items-center justify-center transition-all duration-500 shadow-2xl relative z-20",
                                        isActive
                                            ? "bg-indigo-600 border-indigo-400 text-white scale-110 ring-2 md:ring-4 ring-indigo-500/20"
                                            : isCompleted
                                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                                : "bg-neutral-900 border-white/10 text-slate-500"
                                    )}
                                >
                                    {isCompleted ? <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6" /> : React.cloneElement(step.icon as React.ReactElement<any>, { className: "h-4 w-4 md:h-6 md:w-6" })}
                                </div>

                                <div className="mt-2 md:mt-4">
                                    <span className={cn(
                                        "text-[7px] md:text-xs font-bold transition-colors duration-300 whitespace-nowrap",
                                        isActive ? "text-white" : "text-slate-500"
                                    )}>
                                        {step.name}
                                    </span>
                                </div>

                                {/* Tooltip / Status Popup - Positioned to not cover other nodes easily */}
                                {isActive && (
                                    <div className="absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2 w-28 md:w-44 bg-neutral-900 border border-white/10 rounded-lg p-1.5 md:p-3 shadow-2xl animate-fade-in z-30 pointer-events-none">
                                        <div className="flex items-center justify-between mb-1 md:mb-2">
                                            <span className="text-[6px] md:text-[10px] text-indigo-400 font-bold uppercase">Active</span>
                                            <span className="text-[6px] md:text-[10px] text-slate-500 font-mono">{progress}%</span>
                                        </div>
                                        <div className="h-0.5 md:h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 transition-all duration-75" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Terminal Output */}
            <div className="mt-4 md:mt-10 bg-black/40 border border-white/5 rounded-md p-2 md:p-4 font-mono text-[7px] md:text-[11px] h-16 md:h-28 overflow-hidden relative shrink-0">
                <div className="space-y-0.5 md:space-y-1">
                    <p className="text-slate-600 truncate">[{new Date().toISOString().split('T')[1].split('.')[0]}] <span className="text-emerald-500 font-bold">INFO</span>: System ready</p>
                    <p className="text-slate-300 animate-pulse truncate">_ EXEC: {steps[activeStep].name.toLowerCase()}_process</p>
                    <p className="text-slate-500 hidden sm:block">[{new Date().toISOString().split('T')[1].split('.')[0]}] <span className="text-slate-400">STATUS</span>: Optimized</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-4 md:h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

export default PipelineVisualization;
