/**
 * BILLING & SUBSCRIPTION PAGE
 * Fully functional with Stripe integration
 */

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Check,
    TrendingUp,
    Calendar,
    AlertCircle,
    ChevronRight,
    Download,
    FileText,
    Settings,
    Shield,
    Users,
    Database,
    Activity,
    BarChart3,
    Clock,
    Loader2,
    ExternalLink
} from 'lucide-react';
import { PageHeader } from '../components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface PricingPlan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    description: string;
    icon: React.ElementType;
    popular?: boolean;
    features: string[];
}

interface Subscription {
    plan: string;
    status: string;
    billingInterval: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
}

interface Usage {
    datasets: { current: number; limit: number | string };
    storage: { current: number; limit: number | string; unit: string };
    apiCalls: { current: number; limit: number | string };
    users: { current: number; limit: number | string };
}

interface PaymentMethod {
    id: string;
    type: string;
    brand?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    status: string;
    amount: number;
    currency: string;
    periodStart: string;
    periodEnd: string;
    paidAt: string | null;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
}

const Billing: React.FC = () => {
    // const { user } = useAuthStore(); // Unused
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [upgrading, setUpgrading] = useState(false);

    const plans: PricingPlan[] = [
        {
            id: 'FREE',
            name: 'Free',
            price: 0,
            interval: 'month',
            description: 'Perfect for getting started',
            icon: BarChart3,
            features: [
                '5 datasets',
                '1 GB storage',
                'Basic EDA analysis',
                'Community support',
                'Export to CSV'
            ]
        },
        {
            id: 'PRO',
            name: 'Professional',
            price: billingInterval === 'month' ? 49 : 470,
            interval: billingInterval,
            description: 'For growing teams',
            icon: Activity,
            popular: true,
            features: [
                '100 datasets',
                '50 GB storage',
                'Advanced EDA & preprocessing',
                'Priority support',
                'API access',
                'Custom exports',
                'Collaboration tools'
            ]
        },
        {
            id: 'ENTERPRISE',
            name: 'Enterprise',
            price: billingInterval === 'month' ? 199 : 1990,
            interval: billingInterval,
            description: 'For large organizations',
            icon: TrendingUp,
            features: [
                'Unlimited datasets',
                'Unlimited storage',
                'White-label options',
                'Dedicated support',
                'Custom integrations',
                'SLA guarantee',
                'Advanced security',
                'Unlimited users'
            ]
        }
    ];

    useEffect(() => {
        loadBillingData();
    }, []);

    const loadBillingData = async () => {
        try {
            setLoading(true);
            const [subRes, usageRes, pmRes, invRes] = await Promise.all([
                api.get('/billing/subscription'),
                api.get('/billing/usage'),
                api.get('/billing/payment-methods'),
                api.get('/billing/invoices')
            ]);

            setSubscription(subRes.data);
            setUsage(usageRes.data);
            setPaymentMethods(pmRes.data);
            setInvoices(invRes.data);
        } catch (error: any) {
            console.error('Failed to load billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan: string) => {
        try {
            setUpgrading(true);
            const response = await api.post('/billing/create-checkout-session', {
                plan,
                billingInterval: billingInterval.toUpperCase()
            });

            // Redirect to Stripe Checkout
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error: any) {
            console.error('Failed to create checkout session:', error);
            alert('Failed to start upgrade process. Please try again.');
        } finally {
            setUpgrading(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            const response = await api.post('/billing/create-portal-session');
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error: any) {
            console.error('Failed to create portal session:', error);
            alert('Failed to open subscription management. Please try again.');
        }
    };

    const getUsagePercentage = (current: number, limit: number | string) => {
        if (!limit || limit === 'unlimited') return 0;
        const numLimit = typeof limit === 'string' ? parseInt(limit) : limit;
        if (isNaN(numLimit) || numLimit === 0) return 0;
        return Math.min((current / numLimit) * 100, 100);
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'text-red-600 dark:text-red-400';
        if (percentage >= 75) return 'text-amber-600 dark:text-amber-400';
        return 'text-emerald-600 dark:text-emerald-400';
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 75) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        );
    }

    const currentPlan = subscription?.plan || 'FREE';
    const isCurrentPlan = (planId: string) => planId === currentPlan;

    console.log('Billing Debug:', { subscription, currentPlan });

    return (
        <div className="space-y-8 animate-fade-in pb-8">
            <PageHeader
                title="Billing & Subscription"
                description="Manage your subscription, usage, and payment methods"
            />

            {/* Current Plan Overview */}
            <Card className="border-l-4 border-l-slate-700 dark:border-l-slate-500 bg-slate-50 dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-lg bg-slate-700 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                                <Activity className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()} Plan
                                    </h3>
                                    <Badge className="bg-slate-700 dark:bg-slate-600 text-white">
                                        {subscription?.status || 'Active'}
                                    </Badge>
                                </div>
                                {subscription?.currentPeriodEnd && (
                                    <p className="text-slate-600 dark:text-slate-400">
                                        Next billing date: <span className="font-semibold">
                                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                        </span>
                                    </p>
                                )}
                                {currentPlan !== 'FREE' && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        <span className="font-bold text-2xl text-slate-900 dark:text-slate-100">
                                            {formatCurrency(plans.find(p => p.id === currentPlan)?.price || 0)}
                                        </span>
                                        <span className="text-slate-500 dark:text-slate-500">
                                            /{subscription?.billingInterval.toLowerCase()}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {currentPlan !== 'FREE' && (
                                <Button variant="outline" className="gap-2" onClick={handleManageSubscription}>
                                    <Settings className="h-4 w-4" />
                                    Manage Plan
                                </Button>
                            )}
                            {currentPlan !== 'ENTERPRISE' && (
                                <Button variant="default" className="gap-2" onClick={() => handleUpgrade(currentPlan === 'FREE' ? 'PRO' : 'ENTERPRISE')}>
                                    <TrendingUp className="h-4 w-4" />
                                    Upgrade
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Statistics */}
            {usage && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Current Usage</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Datasets */}
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-5 w-5 text-slate-500" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Datasets</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {usage.datasets.current}/{usage.datasets.limit}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("text-2xl font-bold", getUsageColor(getUsagePercentage(usage.datasets.current, usage.datasets.limit)))}>
                                            {usage.datasets.current}
                                        </span>
                                        <span className="text-sm text-slate-500">of {usage.datasets.limit}</span>
                                    </div>
                                    {usage.datasets.limit !== 'unlimited' && (
                                        <Progress
                                            value={getUsagePercentage(usage.datasets.current, usage.datasets.limit)}
                                            className="h-2"
                                            indicatorClassName={getProgressColor(getUsagePercentage(usage.datasets.current, usage.datasets.limit))}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Storage */}
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-slate-500" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Storage</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {usage.storage.current} {usage.storage.unit}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("text-2xl font-bold", getUsageColor(getUsagePercentage(usage.storage.current, usage.storage.limit)))}>
                                            {usage.storage.current}
                                        </span>
                                        <span className="text-sm text-slate-500">of {usage.storage.limit} GB</span>
                                    </div>
                                    {usage.storage.limit !== 'unlimited' && (
                                        <Progress
                                            value={getUsagePercentage(usage.storage.current, usage.storage.limit)}
                                            className="h-2"
                                            indicatorClassName={getProgressColor(getUsagePercentage(usage.storage.current, usage.storage.limit))}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* API Calls */}
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-slate-500" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">API Calls</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {usage.apiCalls.current.toLocaleString()}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("text-2xl font-bold", getUsageColor(getUsagePercentage(usage.apiCalls.current, usage.apiCalls.limit)))}>
                                            {usage.apiCalls.limit === 'unlimited' ? usage.apiCalls.current.toLocaleString() : `${(usage.apiCalls.current / 1000).toFixed(1)}k`}
                                        </span>
                                        {usage.apiCalls.limit !== 'unlimited' && (
                                            <span className="text-sm text-slate-500">of {(usage.apiCalls.limit as number / 1000)}k</span>
                                        )}
                                    </div>
                                    {usage.apiCalls.limit !== 'unlimited' && (
                                        <Progress
                                            value={getUsagePercentage(usage.apiCalls.current, usage.apiCalls.limit)}
                                            className="h-2"
                                            indicatorClassName={getProgressColor(getUsagePercentage(usage.apiCalls.current, usage.apiCalls.limit))}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Team Members */}
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-slate-500" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Team Members</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {usage.users.current}/{usage.users.limit}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("text-2xl font-bold", getUsageColor(getUsagePercentage(usage.users.current, usage.users.limit)))}>
                                            {usage.users.current}
                                        </span>
                                        <span className="text-sm text-slate-500">of {usage.users.limit}</span>
                                    </div>
                                    {usage.users.limit !== 'unlimited' && (
                                        <Progress
                                            value={getUsagePercentage(usage.users.current, usage.users.limit)}
                                            className="h-2"
                                            indicatorClassName={getProgressColor(getUsagePercentage(usage.users.current, usage.users.limit))}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Pricing Plans */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Available Plans</h2>
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Button
                            variant={billingInterval === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setBillingInterval('month')}
                            className="text-xs"
                        >
                            Monthly
                        </Button>
                        <Button
                            variant={billingInterval === 'year' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setBillingInterval('year')}
                            className="text-xs"
                        >
                            Yearly
                            <Badge className="ml-2 bg-emerald-500 text-white text-[10px]">Save 20%</Badge>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = isCurrentPlan(plan.id);

                        return (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "relative overflow-hidden transition-all duration-300",
                                    plan.popular && "border-2 border-slate-700 dark:border-slate-500 shadow-lg scale-105",
                                    isCurrent && "ring-2 ring-slate-600 dark:ring-slate-500"
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-slate-700 dark:bg-slate-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        RECOMMENDED
                                    </div>
                                )}
                                {isCurrent && (
                                    <div className="absolute top-0 left-0 bg-slate-700 dark:bg-slate-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                                        ACTIVE
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-lg flex items-center justify-center",
                                            plan.popular ? "bg-slate-700 dark:bg-slate-600" : "bg-slate-200 dark:bg-slate-700"
                                        )}>
                                            <Icon className={cn("h-6 w-6", plan.popular ? "text-white" : "text-slate-600 dark:text-slate-300")} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                                            <CardDescription className="text-xs">{plan.description}</CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                                            ${plan.price}
                                        </span>
                                        <span className="text-slate-500">/{plan.interval}</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        className={cn(
                                            "w-full gap-2",
                                            plan.popular && "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700",
                                            isCurrent && "bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600"
                                        )}
                                        disabled={isCurrent || upgrading}
                                        onClick={() => plan.id !== 'FREE' && handleUpgrade(plan.id)}
                                    >
                                        {upgrading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : isCurrent ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Current Plan
                                            </>
                                        ) : plan.id === 'ENTERPRISE' ? (
                                            <>
                                                Contact Sales
                                                <ChevronRight className="h-4 w-4" />
                                            </>
                                        ) : (
                                            <>
                                                {/* Correctly determine Upgrade vs Downgrade */}
                                                {(plan.id === 'FREE' && currentPlan !== 'FREE') ? 'Downgrade' :
                                                    (plan.id === 'PRO' && currentPlan === 'ENTERPRISE') ? 'Downgrade' :
                                                        'Upgrade'}
                                                <ChevronRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Payment Method & Billing History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Method */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Payment Method
                            </CardTitle>
                            {currentPlan !== 'FREE' && (
                                <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                                    Update
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {paymentMethods.length > 0 ? (
                            <div className="space-y-3">
                                {paymentMethods.map((pm) => (
                                    <div key={pm.id} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                                        <div className="h-12 w-12 rounded-lg bg-slate-700 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                                            <CreditCard className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {pm.brand} •••• {pm.last4}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Expires {pm.expiryMonth}/{pm.expiryYear}
                                            </p>
                                        </div>
                                        {pm.isDefault && (
                                            <Badge variant="outline" className="text-xs">Default</Badge>
                                        )}
                                        <Shield className="h-5 w-5 text-emerald-500" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No payment method on file</p>
                                {currentPlan !== 'FREE' && (
                                    <Button variant="outline" size="sm" className="mt-3" onClick={handleManageSubscription}>
                                        Add Payment Method
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Billing History */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Billing History
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {invoices.length > 0 ? (
                            <div className="space-y-3">
                                {invoices.slice(0, 5).map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</p>
                                                <p className="text-sm text-slate-500">{new Date(invoice.periodStart).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {formatCurrency(invoice.amount, invoice.currency.toUpperCase())}
                                                </p>
                                                <Badge variant="outline" className={cn(
                                                    "text-xs",
                                                    invoice.status === 'PAID' && "text-emerald-600 border-emerald-600"
                                                )}>
                                                    {invoice.status}
                                                </Badge>
                                            </div>
                                            {invoice.invoicePdf && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No billing history</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Help Section */}
            <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-slate-700 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Need help with billing?</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                Our support team is here to assist you with any billing questions or concerns.
                            </p>
                            <Button variant="outline" className="gap-2">
                                Contact Support
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default Billing;
