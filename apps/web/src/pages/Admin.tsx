import React, { useState } from 'react';
import {
    ShieldCheck,
    Settings2,
    CreditCard,
    Users,
    Activity,
    Lock,
    Zap,
    Save,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFeatureStore } from '../store/useFeatureStore';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';

const Admin: React.FC = () => {
    const { tenant } = useAuthStore();
    const { flags, quotas, fetchMetadata } = useFeatureStore();
    const [localFlags, setLocalFlags] = useState<any>(flags || {});
    const [localQuotas, setLocalQuotas] = useState<any>(quotas || {});
    const [isSaving, setIsSaving] = useState(false);

    // Sync from store when loaded
    React.useEffect(() => {
        if (flags) setLocalFlags(flags);
        if (quotas) setLocalQuotas(quotas);
    }, [flags, quotas]);

    const handleSaveFlags = async () => {
        if (!tenant?.id) return;
        try {
            setIsSaving(true);
            await api.post(`/tenants/${tenant.id}/flags`, {
                flags: localFlags
            }, {
                headers: { 'x-tenant-id': tenant.id }
            });
            await fetchMetadata();
            alert('Feature flags updated successfully');
        } catch (error) {
            console.error('Failed to save flags:', error);
            alert('Failed to update flags');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleFlag = (key: string) => {
        setLocalFlags((prev: any) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Control Room</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        System-level configuration for {tenant?.name}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-100 dark:border-amber-900/30">
                        <Lock className="h-3 w-3" /> RESTRICTED ACCESS
                    </div>
                </div>
            </div>

            <Tabs defaultValue="features" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="quotas">Limits</TabsTrigger>
                    <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Card className="border-none shadow-sm h-full">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-indigo-500" />
                                    Feature Flags
                                </CardTitle>
                                <CardDescription>Enable or disable advanced system capabilities.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Auto-EDA</p>
                                        <p className="text-xs text-slate-500">Enable automatic exploratory data analysis on every upload.</p>
                                    </div>
                                    <Switch
                                        checked={localFlags.autoEDA ?? false}
                                        onCheckedChange={() => toggleFlag('autoEDA')}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Statistical Distributions</p>
                                        <p className="text-xs text-slate-500">Enable histogram and frequency analysis tabs.</p>
                                    </div>
                                    <Switch
                                        checked={localFlags.distributions ?? false}
                                        onCheckedChange={() => toggleFlag('distributions')}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Relationship Correlations</p>
                                        <p className="text-xs text-slate-500">Enable heatmaps and linear dependency matrix.</p>
                                    </div>
                                    <Switch
                                        checked={localFlags.correlations ?? false}
                                        onCheckedChange={() => toggleFlag('correlations')}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Outlier Detection</p>
                                        <p className="text-xs text-slate-500">Identify extreme statistical anomalies for manual review.</p>
                                    </div>
                                    <Switch
                                        checked={localFlags.outliers ?? false}
                                        onCheckedChange={() => toggleFlag('outliers')}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Data Quality Scores</p>
                                        <p className="text-xs text-slate-500">Show health assessment metrics and recommendations.</p>
                                    </div>
                                    <Switch
                                        checked={localFlags.quality ?? false}
                                        onCheckedChange={() => toggleFlag('quality')}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Advanced Cleansing</p>
                                        <p className="text-xs text-slate-500">Access to AI-driven data imputation techniques.</p>
                                    </div>
                                    <Switch
                                        checked={localFlags.advancedCleansing ?? false}
                                        onCheckedChange={() => toggleFlag('advancedCleansing')}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 opacity-50">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Export to Snowflake</p>
                                        <p className="text-xs text-slate-500">Direct warehouse synchronization.</p>
                                    </div>
                                    <div className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-black uppercase">Coming Soon</div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-6">
                                <Button onClick={handleSaveFlags} disabled={isSaving} className="w-full">
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" /> Save Configuration
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="border-none shadow-sm h-full flex flex-col justify-center items-center text-center p-12 bg-slate-50 dark:bg-slate-900/50">
                            <ShieldCheck className="h-16 w-16 text-slate-200 mb-4" />
                            <h3 className="text-lg font-bold">Policy Enforcement</h3>
                            <p className="text-sm text-slate-500 max-w-xs">
                                Feature flags are applied instantly across all organization members. Changing these might affect active user sessions.
                            </p>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="quotas" className="mt-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-emerald-500" />
                                Resource Quotas
                            </CardTitle>
                            <CardDescription>Manage and monitor resource consumption limits.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Max Projects</span>
                                    <span className="font-bold">{quotas?.currentProjects || 0} / {quotas?.maxProjects || 5}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${((quotas?.currentProjects || 0) / (quotas?.maxProjects || 5)) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Monthly Uploads</span>
                                    <span className="font-bold">0 / {quotas?.maxUploadsPerMonth || 50}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '5%' }} />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Plan</p>
                                    <p className="text-xl font-black">{tenant?.plan || 'FREE'}</p>
                                </div>
                                <Button className="bg-white text-slate-900 hover:bg-slate-100">Upgrade to Pro</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audit" className="mt-6">
                    <Card className="border-none shadow-sm py-24 text-center">
                        <CardContent className="flex flex-col items-center gap-4">
                            <Activity className="h-12 w-12 text-slate-200" />
                            <h3 className="text-lg font-bold">Audit Logging</h3>
                            <p className="text-sm text-slate-500">Full tamper-proof audit trails for all system actions.</p>
                            <Button variant="outline" disabled>View Logs</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Admin;
