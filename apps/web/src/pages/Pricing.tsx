/**
 * PRICING PAGE - Subscription Plans
 * Professional pricing table with Stripe integration
 */

import React, { useState } from 'react';
import { Check, Crown, Zap, Rocket } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const PLANS = {
    FREE: {
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        description: 'Perfect for trying out Project IDA',
        icon: Zap,
        features: [
            '1 dataset',
            '100 MB storage',
            'Overview analysis',
            'Limited preview (100 rows)',
            '10 EDA runs/month',
            'Community support',
        ],
        cta: 'Get Started',
        highlighted: false,
    },
    PRO: {
        name: 'Pro',
        price: { monthly: 19, yearly: 190 },
        description: 'For professionals and small teams',
        icon: Crown,
        priceIds: {
            monthly: 'price_1SrMhiIscbXq4baSfGQ1Hbnu',
            yearly: 'price_1SrMmwIscbXq4baS1BDK8RA3',
        },
        features: [
            '10 datasets',
            '10 GB storage',
            'All analysis features',
            'Distributions & correlations',
            'Outlier detection',
            'Data preprocessing',
            'Export capabilities',
            '100 EDA runs/month',
            'Email support',
        ],
        cta: 'Start Pro Trial',
        highlighted: true,
        savings: '17% savings',
    },
    PREMIUM: {
        name: 'Premium',
        price: { monthly: 49, yearly: 490 },
        description: 'For enterprises and power users',
        icon: Rocket,
        priceIds: {
            monthly: 'price_1SrMoaIscbXq4baS3xo5ihEs',
            yearly: 'price_1SrMpbIscbXq4baSFK5A1wmv',
        },
        features: [
            'Unlimited datasets',
            '100 GB storage',
            'All Pro features',
            'Data quality reports',
            'Version control',
            'API access',
            'Approval workflows',
            'Audit logs',
            'Unlimited EDA runs',
            'Priority support',
            'Custom integrations',
        ],
        cta: 'Start Premium Trial',
        highlighted: false,
        savings: '17% savings',
    },
};

const Pricing: React.FC = () => {
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubscribe = async (plan: string) => {
        if (plan === 'FREE') {
            navigate('/register');
            return;
        }

        setLoading(plan);

        try {
            const priceId = PLANS[plan as keyof typeof PLANS].priceIds?.[billingInterval];

            const response = await api.post('/billing/checkout', {
                plan,
                interval: billingInterval,
                success_url: `${window.location.origin}/dashboard?checkout=success`,
                cancel_url: `${window.location.origin}/pricing`,
                trial_days: 14, // 14-day free trial
            });

            // Redirect to Stripe Checkout
            window.location.href = response.data.url;
        } catch (error) {
            console.error('Failed to create checkout session:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-0 sm:text-5xl">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
                        Choose the plan that's right for you. All plans include a 14-day free trial.
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="mt-8 flex justify-center">
                    <div className="inline-flex rounded-lg bg-neutral-200 p-1 dark:bg-neutral-800">
                        <button
                            onClick={() => setBillingInterval('monthly')}
                            className={cn(
                                'rounded-md px-6 py-2 text-sm font-medium transition-all',
                                billingInterval === 'monthly'
                                    ? 'bg-white text-neutral-900 shadow dark:bg-neutral-900 dark:text-neutral-0'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-0'
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingInterval('yearly')}
                            className={cn(
                                'rounded-md px-6 py-2 text-sm font-medium transition-all',
                                billingInterval === 'yearly'
                                    ? 'bg-white text-neutral-900 shadow dark:bg-neutral-900 dark:text-neutral-0'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-0'
                            )}
                        >
                            Yearly
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                Save 17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="mt-12 grid gap-8 lg:grid-cols-3">
                    {Object.entries(PLANS).map(([key, plan]) => {
                        const Icon = plan.icon;
                        const price = plan.price[billingInterval];
                        const isHighlighted = plan.highlighted;

                        return (
                            <Card
                                key={key}
                                className={cn(
                                    'relative border-2 transition-all hover:shadow-xl',
                                    isHighlighted
                                        ? 'border-indigo-600 shadow-lg dark:border-indigo-500'
                                        : 'border-neutral-200 dark:border-neutral-800'
                                )}
                            >
                                {isHighlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 text-sm font-semibold text-white">
                                            <Crown className="h-4 w-4" />
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <CardContent className="p-8">
                                    {/* Plan Header */}
                                    <div className="mb-6">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Icon className={cn(
                                                'h-6 w-6',
                                                isHighlighted ? 'text-indigo-600' : 'text-neutral-600'
                                            )} />
                                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-0">
                                                {plan.name}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {plan.description}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-bold text-neutral-900 dark:text-neutral-0">
                                                ${price}
                                            </span>
                                            <span className="text-neutral-600 dark:text-neutral-400">
                                                /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                                            </span>
                                        </div>
                                        {billingInterval === 'yearly' && key !== 'FREE' && (
                                            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                                {plan.savings}
                                            </p>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    <Button
                                        onClick={() => handleSubscribe(key)}
                                        disabled={loading === key}
                                        className={cn(
                                            'mb-6 w-full',
                                            isHighlighted
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                                                : ''
                                        )}
                                    >
                                        {loading === key ? 'Loading...' : plan.cta}
                                    </Button>

                                    {/* Features */}
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <Check className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-16 text-center">
                    <p className="text-neutral-600 dark:text-neutral-400">
                        All plans include a 14-day free trial. No credit card required.
                    </p>
                    <p className="mt-2 text-sm text-neutral-500">
                        Questions? Contact us at{' '}
                        <a href="mailto:support@projectida.com" className="text-indigo-600 hover:underline">
                            support@projectida.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
