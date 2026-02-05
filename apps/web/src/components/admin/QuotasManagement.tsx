/**
 * QUOTAS & LIMITS MANAGEMENT COMPONENT
 * Manage resource quotas and usage limits
 */

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Save,
    Loader2,
    Database,
    Upload,
    Zap,
    Brain,
    TrendingUp,
    AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface Quotas {
    id: string;
    tenantId: string;
    maxProjects: number;
    maxStorageBytes: string;
    maxUploadsPerMonth: number;
    maxApiCallsPerMonth: number;
    maxAiTokensPerMonth: number;
    currentProjects: number;
    currentUploads: number;
}

export const QuotasManagement: React.FC = () => {
    const { tenant } = useAuthStore();
    const [quotas, setQuotas] = useState<Quotas | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [formData, setFormData] = useState({
        maxProjects: 5,
        maxStorageBytes: 1073741824,
        maxUploadsPerMonth: 50,
        maxApiCallsPerMonth: 1000,
        maxAiTokensPerMonth: 50000
    });

    useEffect(() => {
        fetchQuotas();
    }, []);

    const fetchQuotas = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/quotas', {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setQuotas(response.data);
            setFormData({
                maxProjects: response.data.maxProjects,
                maxStorageBytes: parseInt(response.data.maxStorageBytes),
                maxUploadsPerMonth: response.data.maxUploadsPerMonth,
                maxApiCallsPerMonth: response.data.maxApiCallsPerMonth,
                maxAiTokensPerMonth: response.data.maxAiTokensPerMonth
            });
        } catch (error) {
            console.error('Failed to fetch quotas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put('/admin/quotas', formData, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            await fetchQuotas();
            setHasChanges(false);
            alert('Quotas updated successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update quotas');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (quotas) {
            setFormData({
                maxProjects: quotas.maxProjects,
                maxStorageBytes: parseInt(quotas.maxStorageBytes),
                maxUploadsPerMonth: quotas.maxUploadsPerMonth,
                maxApiCallsPerMonth: quotas.maxApiCallsPerMonth,
                maxAiTokensPerMonth: quotas.maxAiTokensPerMonth
            });
            setHasChanges(false);
        }
    };

    const handleChange = (field: string, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const formatBytes = (bytes: number) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(2)} GB`;
    };

    const getUsagePercentage = (current: number, max: number) => {
        return Math.min((current / max) * 100, 100);
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 75) return 'bg-amber-500';
        return 'bg-green-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!quotas) return null;

    const projectUsage = getUsagePercentage(quotas.currentProjects, formData.maxProjects);
    const uploadUsage = getUsagePercentage(quotas.currentUploads, formData.maxUploadsPerMonth);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-indigo-600" />
                        Quotas & Limits
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage resource quotas and usage limits
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

            {/* Current Plan */}
            <Card className="border-none bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-indigo-100">Current Plan</p>
                            <p className="text-3xl font-black mt-1">{tenant?.plan || 'FREE'}</p>
                        </div>
                        <div className="p-4 bg-white/20 rounded-full">
                            <TrendingUp className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Database className="h-4 w-4 text-indigo-600" />
                            Project Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                                {quotas.currentProjects} / {formData.maxProjects}
                            </span>
                            <Badge className={projectUsage >= 90 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                {projectUsage.toFixed(0)}% Used
                            </Badge>
                        </div>
                        <Progress
                            value={projectUsage}
                            className="h-3"
                            indicatorClassName={getUsageColor(projectUsage)}
                        />
                        {projectUsage >= 90 && (
                            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Approaching project limit</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Upload className="h-4 w-4 text-purple-600" />
                            Monthly Uploads
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                                {quotas.currentUploads} / {formData.maxUploadsPerMonth}
                            </span>
                            <Badge className={uploadUsage >= 90 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                {uploadUsage.toFixed(0)}% Used
                            </Badge>
                        </div>
                        <Progress
                            value={uploadUsage}
                            className="h-3"
                            indicatorClassName={getUsageColor(uploadUsage)}
                        />
                        {uploadUsage >= 90 && (
                            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Approaching upload limit</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quota Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Resource Limits</CardTitle>
                    <CardDescription>
                        Configure maximum resource allocations for your organization
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="maxProjects" className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-indigo-600" />
                                Maximum Projects
                            </Label>
                            <Input
                                id="maxProjects"
                                type="number"
                                value={formData.maxProjects}
                                onChange={(e) => handleChange('maxProjects', parseInt(e.target.value))}
                                min={1}
                            />
                            <p className="text-xs text-slate-500">
                                Total number of projects allowed
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxStorageBytes" className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-purple-600" />
                                Maximum Storage
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="maxStorageBytes"
                                    type="number"
                                    value={formData.maxStorageBytes / (1024 * 1024 * 1024)}
                                    onChange={(e) => handleChange('maxStorageBytes', parseFloat(e.target.value) * 1024 * 1024 * 1024)}
                                    step={0.1}
                                    min={0.1}
                                />
                                <span className="flex items-center px-3 bg-slate-100 dark:bg-slate-800 rounded-md text-sm">
                                    GB
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Total storage capacity
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxUploadsPerMonth" className="flex items-center gap-2">
                                <Upload className="h-4 w-4 text-green-600" />
                                Monthly Uploads
                            </Label>
                            <Input
                                id="maxUploadsPerMonth"
                                type="number"
                                value={formData.maxUploadsPerMonth}
                                onChange={(e) => handleChange('maxUploadsPerMonth', parseInt(e.target.value))}
                                min={1}
                            />
                            <p className="text-xs text-slate-500">
                                Maximum uploads per month
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxApiCallsPerMonth" className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-600" />
                                Monthly API Calls
                            </Label>
                            <Input
                                id="maxApiCallsPerMonth"
                                type="number"
                                value={formData.maxApiCallsPerMonth}
                                onChange={(e) => handleChange('maxApiCallsPerMonth', parseInt(e.target.value))}
                                min={100}
                                step={100}
                            />
                            <p className="text-xs text-slate-500">
                                Maximum API requests per month
                            </p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="maxAiTokensPerMonth" className="flex items-center gap-2">
                                <Brain className="h-4 w-4 text-pink-600" />
                                Monthly AI Tokens
                            </Label>
                            <Input
                                id="maxAiTokensPerMonth"
                                type="number"
                                value={formData.maxAiTokensPerMonth}
                                onChange={(e) => handleChange('maxAiTokensPerMonth', parseInt(e.target.value))}
                                min={1000}
                                step={1000}
                            />
                            <p className="text-xs text-slate-500">
                                Maximum AI tokens (prompt + completion) per month
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Presets */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Quick Presets</CardTitle>
                    <CardDescription>Apply common quota configurations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            className="h-auto flex-col items-start p-4"
                            onClick={() => {
                                setFormData({
                                    maxProjects: 5,
                                    maxStorageBytes: 1073741824,
                                    maxUploadsPerMonth: 50,
                                    maxApiCallsPerMonth: 1000,
                                    maxAiTokensPerMonth: 50000
                                });
                                setHasChanges(true);
                            }}
                        >
                            <span className="font-bold">Free Tier</span>
                            <span className="text-xs text-slate-500 mt-1">
                                5 projects • 1GB • 50 uploads/mo
                            </span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto flex-col items-start p-4"
                            onClick={() => {
                                setFormData({
                                    maxProjects: 25,
                                    maxStorageBytes: 10737418240,
                                    maxUploadsPerMonth: 500,
                                    maxApiCallsPerMonth: 10000,
                                    maxAiTokensPerMonth: 500000
                                });
                                setHasChanges(true);
                            }}
                        >
                            <span className="font-bold">Pro Tier</span>
                            <span className="text-xs text-slate-500 mt-1">
                                25 projects • 10GB • 500 uploads/mo
                            </span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto flex-col items-start p-4"
                            onClick={() => {
                                setFormData({
                                    maxProjects: 100,
                                    maxStorageBytes: 107374182400,
                                    maxUploadsPerMonth: 5000,
                                    maxApiCallsPerMonth: 100000,
                                    maxAiTokensPerMonth: 5000000
                                });
                                setHasChanges(true);
                            }}
                        >
                            <span className="font-bold">Enterprise Tier</span>
                            <span className="text-xs text-slate-500 mt-1">
                                100 projects • 100GB • 5000 uploads/mo
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
