import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { updateUserProfile, changePassword, updateTenantSettings, api } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { User, Lock, Save, Loader2, ShieldCheck, Mail, Sparkles, Key, Info } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const Settings: React.FC = () => {
    const { user, setUser, tenant } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // AI Config State
    const [openaiKey, setOpenaiKey] = useState('');

    useEffect(() => {
        if (tenant?.id) {
            loadTenantDetails();
        }
    }, [tenant?.id]);

    const loadTenantDetails = async () => {
        try {
            // Use metadata endpoint to see if key is set or fetch it
            // For security, the actual key might not be returned, but let's assume we can fetch it for now if we're admin
            const { data } = await api.get(`/tenants/${tenant?.id}/metadata`);
            // The metadata endpoint doesn't currently return the openai key, let's fix that or just assume it's hidden.
            // If we want the user to see it's set:
            if (data.hasCustomApiKey) {
                setOpenaiKey('••••••••••••••••');
            }
        } catch (e) {
            console.error('Failed to load tenant metadata');
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await updateUserProfile({ name });
            setUser(response.user);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            await changePassword({ currentPassword, newPassword });
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handleAIConfigUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant?.id) return;
        setLoading(true);
        setMessage(null);

        try {
            await updateTenantSettings(tenant.id, { openaiApiKey: openaiKey });
            setMessage({ type: 'success', text: 'AI Configuration updated successfully' });
            if (openaiKey) setOpenaiKey('••••••••••••••••');
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to update AI configuration' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Account Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your profile, security, and AI preferences.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
                <nav className="flex flex-col space-y-1">
                    <Button variant={activeTab === 'profile' ? 'default' : 'ghost'} className="justify-start gap-2" onClick={() => setActiveTab('profile')}>
                        <User className="h-4 w-4" /> Profile
                    </Button>
                    <Button variant={activeTab === 'security' ? 'default' : 'ghost'} className="justify-start gap-2" onClick={() => setActiveTab('security')}>
                        <Lock className="h-4 w-4" /> Security
                    </Button>
                    <Button variant={activeTab === 'ai' ? 'default' : 'ghost'} className="justify-start gap-2 text-indigo-600 dark:text-indigo-400" onClick={() => setActiveTab('ai')}>
                        <Sparkles className="h-4 w-4" /> AI Configuration
                    </Button>
                </nav>

                <div className="space-y-6">
                    {activeTab === 'profile' && (
                        <Card>
                            <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Update your personal info.</CardDescription></CardHeader>
                            <form onSubmit={handleProfileUpdate}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" value={user?.email || ''} disabled className="bg-slate-50 text-slate-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                                    </div>
                                </CardContent>
                                <CardFooter><Button type="submit" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Profile</Button></CardFooter>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card>
                            <CardHeader><CardTitle>Security</CardTitle><CardDescription>Update password.</CardDescription></CardHeader>
                            <form onSubmit={handlePasswordChange}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
                                    <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                                </CardContent>
                                <CardFooter><Button type="submit" disabled={loading}>Update Password</Button></CardFooter>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'ai' && (
                        <Card className="border-indigo-100 dark:border-indigo-900/30 shadow-indigo-500/5">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CardTitle>AI Provider Settings</CardTitle>
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 text-[10px]">PREMIUM</Badge>
                                </div>
                                <CardDescription>Project IDA uses Gemini (Google) as the primary engine. You can also connect your own OpenAI key.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleAIConfigUpdate}>
                                <CardContent className="space-y-6">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-sm font-bold">Standard: Project IDA AI</span>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">ACTIVE</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500">Powered by <b>Gemini Pro</b>. High accuracy data reasoning provided by platform.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Key className="h-4 w-4 text-slate-400" /> Custom OpenAI API Key
                                            </Label>
                                            {openaiKey.includes('•') && <Badge variant="secondary" className="text-[10px]">CONFIGURED</Badge>}
                                        </div>
                                        <Input
                                            placeholder="sk-..."
                                            type="password"
                                            value={openaiKey}
                                            onChange={(e) => setOpenaiKey(e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                        <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                            <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                            <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                                When a custom key is provided, IDA will use <b>GPT-4 Turbo</b> and requests will <b>not count</b> against your monthly platform token quota.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                    <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        Save AI Configuration
                                    </Button>
                                    <p className="text-[10px] text-slate-400">Keys are encrypted at rest.</p>
                                </CardFooter>
                            </form>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
