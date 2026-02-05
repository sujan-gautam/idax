/**
 * FEATURE FLAGS MANAGEMENT COMPONENT
 * Enable/disable features across the entire platform
 */

import React, { useState, useEffect } from 'react';
import {
    Zap,
    Save,
    Loader2,
    ToggleLeft,
    ToggleRight,
    Info,
    Sparkles,
    Shield,
    Database,
    BarChart3,
    Brain,
    Webhook,
    Calendar,
    FileDown,
    Key,
    Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useFeatureStore } from '../../store/useFeatureStore';

interface FeatureFlag {
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    category: 'analytics' | 'ai' | 'integration' | 'enterprise' | 'core';
    planRequired?: 'PRO' | 'ENTERPRISE';
}

const FEATURE_FLAGS: FeatureFlag[] = [
    // Core Features
    {
        key: 'autoEDA',
        label: 'Auto-EDA',
        description: 'Automatically run exploratory data analysis on every dataset upload',
        icon: <Sparkles className="h-4 w-4" />,
        category: 'core'
    },
    {
        key: 'dataExport',
        label: 'Data Export',
        description: 'Allow users to export processed datasets in multiple formats',
        icon: <FileDown className="h-4 w-4" />,
        category: 'core'
    },
    {
        key: 'auditLogs',
        label: 'Audit Logging',
        description: 'Track all user actions and system events for compliance',
        icon: <Shield className="h-4 w-4" />,
        category: 'core'
    },

    // Analytics Features
    {
        key: 'distributions',
        label: 'Statistical Distributions',
        description: 'Enable histogram and frequency distribution analysis',
        icon: <BarChart3 className="h-4 w-4" />,
        category: 'analytics'
    },
    {
        key: 'correlations',
        label: 'Correlation Analysis',
        description: 'Show relationship heatmaps and dependency matrices',
        icon: <Database className="h-4 w-4" />,
        category: 'analytics'
    },
    {
        key: 'outliers',
        label: 'Outlier Detection',
        description: 'Identify and flag statistical anomalies in datasets',
        icon: <BarChart3 className="h-4 w-4" />,
        category: 'analytics'
    },
    {
        key: 'quality',
        label: 'Data Quality Scores',
        description: 'Calculate and display data health metrics',
        icon: <Shield className="h-4 w-4" />,
        category: 'analytics'
    },
    {
        key: 'advancedAnalytics',
        label: 'Advanced Analytics',
        description: 'Time series analysis, forecasting, and predictive models',
        icon: <BarChart3 className="h-4 w-4" />,
        category: 'analytics',
        planRequired: 'ENTERPRISE'
    },

    // AI Features
    {
        key: 'aiAssistant',
        label: 'AI Analytics Assistant',
        description: 'RAG-based AI chat for natural language data exploration',
        icon: <Brain className="h-4 w-4" />,
        category: 'ai',
        planRequired: 'PRO'
    },
    {
        key: 'advancedCleansing',
        label: 'AI Data Cleansing',
        description: 'ML-powered data imputation and transformation',
        icon: <Sparkles className="h-4 w-4" />,
        category: 'ai',
        planRequired: 'PRO'
    },

    // Integration Features
    {
        key: 'apiAccess',
        label: 'API Access',
        description: 'Enable REST API for programmatic data operations',
        icon: <Key className="h-4 w-4" />,
        category: 'integration',
        planRequired: 'PRO'
    },
    {
        key: 'webhooks',
        label: 'Webhooks',
        description: 'Send real-time notifications to external systems',
        icon: <Webhook className="h-4 w-4" />,
        category: 'integration',
        planRequired: 'ENTERPRISE'
    },
    {
        key: 'scheduledReports',
        label: 'Scheduled Reports',
        description: 'Automatically generate and email reports on a schedule',
        icon: <Calendar className="h-4 w-4" />,
        category: 'integration',
        planRequired: 'ENTERPRISE'
    },

    // Enterprise Features
    {
        key: 'ssoEnabled',
        label: 'SSO Authentication',
        description: 'Single Sign-On with SAML/OAuth providers',
        icon: <Shield className="h-4 w-4" />,
        category: 'enterprise',
        planRequired: 'ENTERPRISE'
    },
    {
        key: 'customBranding',
        label: 'Custom Branding',
        description: 'White-label the platform with your own logo and colors',
        icon: <Palette className="h-4 w-4" />,
        category: 'enterprise',
        planRequired: 'ENTERPRISE'
    }
];

export const FeatureFlagsManagement: React.FC = () => {
    const { tenant } = useAuthStore();
    const { fetchMetadata } = useFeatureStore();
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchFlags();
    }, []);

    const fetchFlags = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/feature-flags', {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setFlags(response.data.flagsJson || {});
        } catch (error) {
            console.error('Failed to fetch feature flags:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFlag = (key: string) => {
        setFlags(prev => ({ ...prev, [key]: !prev[key] }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put('/admin/feature-flags', { flags }, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            await fetchMetadata();
            setHasChanges(false);
            alert('Feature flags updated successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update feature flags');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        fetchFlags();
        setHasChanges(false);
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'core': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'analytics': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
            case 'ai': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
            case 'integration': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'enterprise': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const groupedFlags = FEATURE_FLAGS.reduce((acc, flag) => {
        if (!acc[flag.category]) acc[flag.category] = [];
        acc[flag.category].push(flag);
        return acc;
    }, {} as Record<string, FeatureFlag[]>);

    const categoryLabels = {
        core: 'Core Features',
        analytics: 'Analytics & Insights',
        ai: 'AI & Machine Learning',
        integration: 'Integrations',
        enterprise: 'Enterprise Features'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="h-6 w-6 text-indigo-600" />
                        Feature Flags
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Control which features are enabled for your organization
                    </p>
                </div>
                <div className="flex gap-2">
                    {hasChanges && (
                        <Button variant="outline" onClick={handleReset}>
                            Reset
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="gap-2"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/20">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                            <p className="font-medium mb-1">Feature flags control platform capabilities</p>
                            <p className="text-blue-700 dark:text-blue-300">
                                Changes take effect immediately for all users. Some features require specific subscription plans.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Feature Flags by Category */}
            {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
                <Card key={category}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                {categoryLabels[category as keyof typeof categoryLabels]}
                            </CardTitle>
                            <Badge className={getCategoryColor(category)}>
                                {categoryFlags.length} features
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categoryFlags.map((flag) => {
                            const isEnabled = flags[flag.key] ?? false;
                            const isPlanRestricted = flag.planRequired && tenant?.plan !== flag.planRequired && tenant?.plan !== 'ENTERPRISE';

                            return (
                                <div
                                    key={flag.key}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isEnabled
                                            ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-900/20'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                        } ${isPlanRestricted ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${isEnabled
                                                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {flag.icon}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    {flag.label}
                                                    {flag.planRequired && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {flag.planRequired}
                                                        </Badge>
                                                    )}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {flag.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isEnabled ? (
                                            <ToggleRight className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <ToggleLeft className="h-5 w-5 text-slate-400" />
                                        )}
                                        <Switch
                                            checked={isEnabled}
                                            onCheckedChange={() => toggleFlag(flag.key)}
                                            disabled={isPlanRestricted}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}

            {/* Summary Stats */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                                {Object.values(flags).filter(Boolean).length}
                            </div>
                            <div className="text-sm text-slate-500">Enabled Features</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-600">
                                {FEATURE_FLAGS.length}
                            </div>
                            <div className="text-sm text-slate-500">Total Features</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {FEATURE_FLAGS.filter(f => f.planRequired === 'PRO').length}
                            </div>
                            <div className="text-sm text-slate-500">PRO Features</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600">
                                {FEATURE_FLAGS.filter(f => f.planRequired === 'ENTERPRISE').length}
                            </div>
                            <div className="text-sm text-slate-500">Enterprise Features</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
