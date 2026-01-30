
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/landing/PublicNavbar';
import PublicFooter from '../components/landing/PublicFooter';
import PipelineVisualization from '../components/landing/PipelineVisualization';
import { Button } from '../components/ui/button';
import { ArrowRight, BarChart3, Database, Lock, Zap, CheckCircle2, Globe2, Code2 } from 'lucide-react';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <PublicNavbar />

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] -z-10" />

                    <div className="container px-4 md:px-6 text-center">
                        <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300 mb-8 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
                            v1.0 is now live
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent mb-6">
                            Data Analysis <br className="hidden md:block" />
                            <span className="text-white">Reimagined for Speed</span>
                        </h1>

                        <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
                            Project IDA transforms how teams process, analyze, and visualize data.
                            Automated pipelines, intelligent insights, and enterprise-grade security
                            in one unified platform.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                className="h-12 px-8 text-base bg-white text-black hover:bg-slate-200"
                                onClick={() => navigate('/register')}
                            >
                                Start for Free
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-12 px-8 text-base border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                                onClick={() => navigate('/how-it-works')}
                            >
                                How it Works
                            </Button>
                        </div>

                        {/* Hero Image / Dynamic Pipeline */}
                        <div className="mt-20 relative mx-auto max-w-5xl">
                            <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-2 md:p-3 shadow-2xl">
                                <div className="rounded-xl border border-white/5 bg-slate-900/50 aspect-[16/10] sm:aspect-[21/9] md:aspect-[2.5/1] overflow-hidden relative group">
                                    <PipelineVisualization />
                                </div>
                            </div>

                            {/* Decorative Glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-[2rem] blur-3xl -z-10 animate-pulse" />
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-neutral-950">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Powerful tools designed for developers, data scientists, and business analysts.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Database className="h-6 w-6 text-indigo-400" />}
                                title="Unified Data Lake"
                                description="Connect to any data source. Upload CSV, Parquet, or connect directly to your database."
                            />
                            <FeatureCard
                                icon={<Zap className="h-6 w-6 text-yellow-400" />}
                                title="Instant EDA"
                                description="Get automated Exploratory Data Analysis reports in seconds, not hours."
                            />
                            <FeatureCard
                                icon={<Globe2 className="h-6 w-6 text-blue-400" />}
                                title="Global Availability"
                                description="Deployed on the edge for low-latency access from anywhere in the world."
                            />
                            <FeatureCard
                                icon={<Lock className="h-6 w-6 text-emerald-400" />}
                                title="Enterprise Security"
                                description="SOC2 compliant infrastructure with role-based access control and encryption at rest."
                            />
                            <FeatureCard
                                icon={<Code2 className="h-6 w-6 text-purple-400" />}
                                title="API First"
                                description="Full programmatic access to all platform features. easy integration."
                            />
                            <FeatureCard
                                icon={<BarChart3 className="h-6 w-6 text-pink-400" />}
                                title="Advanced Visualization"
                                description="Interactive charts and dashboards that tell a compelling story with your data."
                            />
                        </div>
                    </div>
                </section>

                {/* Trust / Social Proof */}
                <section className="py-24 border-y border-white/5 bg-black/50">
                    <div className="container px-4 md:px-6 text-center">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">
                            Trusted by innovative teams
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholder Logos */}
                            <div className="text-2xl font-bold text-white">GENEVA</div>
                            <div className="text-2xl font-bold text-white">NEXUS</div>
                            <div className="text-2xl font-bold text-white">STRATOS</div>
                            <div className="text-2xl font-bold text-white">ORBITAL</div>
                            <div className="text-2xl font-bold text-white">QUANTA</div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-900/10" />
                    <div className="container px-4 md:px-6 relative text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to transform your data?</h2>
                        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
                            Join thousands of users who are making better decisions with Project IDA.
                            Start your free trial today.
                        </p>
                        <Button
                            size="lg"
                            className="h-14 px-10 text-lg bg-white text-black hover:bg-slate-200 rounded-full"
                            onClick={() => navigate('/register')}
                        >
                            Get Started for Free
                        </Button>
                        <p className="mt-4 text-xs text-slate-500">No credit card required for free tier.</p>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
        <div className="mb-4 p-3 bg-black/50 rounded-lg w-fit border border-white/10">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
);

export default Landing;
