
import React from 'react';
import PublicNavbar from '../components/landing/PublicNavbar';
import PublicFooter from '../components/landing/PublicFooter';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Database,
    Zap,
    ShieldCheck,
    Cpu,
    Users,
    Cloud,
    FileJson,
    Layers,
    ArrowRight
} from 'lucide-react';

const Features: React.FC = () => {
    const navigate = useNavigate();

    const featureGroups = [
        {
            title: "Data Management",
            description: "Seamlessly ingest and manage your data at any scale.",
            features: [
                {
                    icon: <Database className="h-5 w-5" />,
                    title: "Universal Connector",
                    description: "Supports CSV, Parquet, Excel, and direct SQL database connections."
                },
                {
                    icon: <Layers className="h-5 w-5" />,
                    title: "Dataset Versioning",
                    description: "Track changes to your data over time with automatic version control."
                },
                {
                    icon: <FileJson className="h-5 w-5" />,
                    title: "Schema Inference",
                    description: "Automatically detects data types and validates schema on upload."
                }
            ]
        },
        {
            title: "Analysis & Intelligence",
            description: "Go beyond basic charts with automated insights.",
            features: [
                {
                    icon: <Zap className="h-5 w-5" />,
                    title: "Instant EDA",
                    description: "Exploratory Data Analysis reports generated in milliseconds."
                },
                {
                    icon: <Cpu className="h-5 w-5" />,
                    title: "AI Suggestions",
                    description: "Smart recommendations for data cleaning and feature engineering."
                },
                {
                    icon: <BarChart3 className="h-5 w-5" />,
                    title: "Interactive Profiling",
                    description: "Deep dive into distributions, correlations, and outliers."
                }
            ]
        },
        {
            title: "Enterprise Readiness",
            description: "Built for teams that demand security and reliability.",
            features: [
                {
                    icon: <ShieldCheck className="h-5 w-5" />,
                    title: "RBAC Security",
                    description: "Fine-grained role-based access control for your entire team."
                },
                {
                    icon: <Cloud className="h-5 w-5" />,
                    title: "Hybrid Cloud",
                    description: "Execute workloads on our managed cloud or your own VPC."
                },
                {
                    icon: <Users className="h-5 w-5" />,
                    title: "Collaboration",
                    description: "Shared workspaces, comments, and collaborative pipelines."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <PublicNavbar />

            <main>
                {/* Header */}
                <section className="py-24 border-b border-white/5 bg-gradient-to-b from-indigo-500/5 to-transparent">
                    <div className="container px-4 md:px-6 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">Built for Modern Analytics</h1>
                        <p className="text-slate-400 text-lg max-w-3xl mx-auto">
                            A comprehensive suite of tools designed to help you understand your data
                            faster and more accurately than ever before.
                        </p>
                    </div>
                </section>

                {/* Feature Sections */}
                {featureGroups.map((group, idx) => (
                    <section key={group.title} className={`py-24 ${idx % 2 === 1 ? 'bg-neutral-950' : 'bg-black'}`}>
                        <div className="container px-4 md:px-6">
                            <div className="flex flex-col md:flex-row gap-12 items-start">
                                <div className="md:w-1/3">
                                    <h2 className="text-3xl font-bold mb-4">{group.title}</h2>
                                    <p className="text-slate-400 mb-8">{group.description}</p>
                                    <Button variant="outline" className="border-slate-800" onClick={() => navigate('/register')}>
                                        Get Started
                                    </Button>
                                </div>
                                <div className="md:w-2/3 grid sm:grid-cols-2 gap-8">
                                    {group.features.map((feature) => (
                                        <div key={feature.title} className="p-6 rounded-xl border border-white/5 bg-white/5 hover:border-indigo-500/30 transition-colors">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                                                {feature.icon}
                                            </div>
                                            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                                            <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                ))}

                {/* CTA */}
                <section className="py-32">
                    <div className="container px-4 md:px-6">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 relative">Ready to experience the future?</h2>
                            <p className="text-indigo-100 mb-10 text-lg max-w-2xl mx-auto relative">
                                Start your 14-day free trial of Project IDA Professional today.
                            </p>
                            <div className="flex justify-center gap-4 relative">
                                <Button size="lg" className="bg-white text-black hover:bg-slate-200" onClick={() => navigate('/register')}>
                                    Claim Free Trial
                                </Button>
                                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/pricing')}>
                                    View Pricing
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
};

export default Features;
