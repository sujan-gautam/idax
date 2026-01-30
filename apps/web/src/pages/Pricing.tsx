
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/landing/PublicNavbar';
import PublicFooter from '../components/landing/PublicFooter';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
    const navigate = useNavigate();
    const [isAnnual, setIsAnnual] = useState(false);

    const plans = [
        {
            name: "Free",
            description: "Perfect for exploring the platform",
            price: 0,
            features: [
                "Up to 5 datasets",
                "1 GB cloud storage",
                "1,000 API calls / mo",
                "Basic EDA analysis",
                "Community support"
            ],
            buttonText: "Start for Free",
            buttonVariant: "outline" as const,
            highlight: false
        },
        {
            name: "Professional",
            description: "Ideal for growing teams and researchers",
            price: isAnnual ? 470 : 49,
            features: [
                "Up to 100 datasets",
                "50 GB cloud storage",
                "50,000 API calls / mo",
                "Advanced EDA & profiling",
                "Priority email support",
                "API access",
                "Collaboration tools (up to 5 users)"
            ],
            buttonText: "Upgrade to Pro",
            buttonVariant: "default" as const,
            highlight: true
        },
        {
            name: "Enterprise",
            description: "Scale with confidence and dedicated support",
            price: isAnnual ? 1990 : 199,
            features: [
                "Unlimited datasets",
                "Unlimited storage",
                "Unlimited API calls",
                "Unlimited users",
                "White-label options",
                "24/7 Dedicated support",
                "SSO & SLA guarantee"
            ],
            buttonText: "Contact Sales",
            buttonVariant: "outline" as const,
            highlight: false
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <PublicNavbar />

            <main className="py-24">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
                            Choose the plan that's right for your data needs. No hidden fees, cancel anytime.
                        </p>

                        {/* Toggle */}
                        <div className="flex items-center justify-center gap-4">
                            <span className={!isAnnual ? "text-white" : "text-slate-500"}>Monthly</span>
                            <button
                                onClick={() => setIsAnnual(!isAnnual)}
                                className="relative w-14 h-7 bg-slate-800 rounded-full transition-colors focus:outline-none"
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-indigo-500 rounded-full transition-transform ${isAnnual ? 'translate-x-[28px]' : ''}`} />
                            </button>
                            <span className={isAnnual ? "text-white" : "text-slate-500"}>
                                Annually <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded ml-1">Save 20%</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 hover:translate-y-[-4px] ${plan.highlight
                                    ? 'bg-gradient-to-b from-indigo-500/10 to-transparent border-indigo-500/50 shadow-[0_0_30px_-12px_rgba(99,102,241,0.5)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-sm text-slate-400">{plan.description}</p>
                                </div>

                                <div className="mb-8 items-baseline flex gap-1">
                                    <span className="text-4xl font-bold">${plan.price}</span>
                                    <span className="text-slate-500 text-sm">/{isAnnual ? 'year' : 'month'}</span>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                                            <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    variant={plan.buttonVariant}
                                    className={`w-full h-12 text-base ${plan.highlight ? 'bg-indigo-500 hover:bg-indigo-600 border-0' : 'border-slate-700 hover:bg-slate-800'
                                        }`}
                                    onClick={() => navigate(plan.price === 0 ? '/register' : '/billing')}
                                >
                                    {plan.buttonText}
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* FAQ / Trust section */}
                    <div className="mt-32 text-center max-w-3xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold mb-12">Frequently Asked Questions</h2>
                        <div className="grid gap-6 text-left">
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <h4 className="font-semibold mb-2">Can I switch plans later?</h4>
                                <p className="text-slate-400 text-sm">Absolutely. You can upgrade or downgrade your plan at any time from your account settings.</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <h4 className="font-semibold mb-2">Is there a long-term commitment?</h4>
                                <p className="text-slate-400 text-sm">No. You can pay monthly or annually. If you cancel, you'll have access until the end of your billing cycle.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default Pricing;
