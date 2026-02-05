/**
 * DEVELOPER PAGE
 * API documentation, API keys, webhooks, and developer tools
 */

import React, { useState, useEffect } from 'react';
import {
    Code2,
    Key,
    Webhook,
    BookOpen,
    Copy,
    Check,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    RefreshCw,
    Terminal,
    Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import { cn } from '../lib/utils';

interface ApiKey {
    id: string;
    name: string;
    key?: string;
    scopesJson: string[];
    status: 'ACTIVE' | 'REVOKED';
    createdAt: string;
    lastUsedAt?: string;
}

const Developer: React.FC = () => {
    const { tenant } = useAuthStore();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        loadApiKeys();
    }, [tenant?.id]);

    const loadApiKeys = async () => {
        if (!tenant?.id) return;

        try {
            setLoading(true);
            const response = await api.get('/admin/api-keys', {
                headers: { 'x-tenant-id': tenant.id }
            });
            setApiKeys(response.data || []);
        } catch (error) {
            console.error('Failed to load API keys:', error);
            setApiKeys([]);
        } finally {
            setLoading(false);
        }
    };

    const createApiKey = async () => {
        if (!tenant?.id || !newKeyName.trim()) return;

        try {
            const response = await api.post('/api-keys', {
                name: newKeyName,
                scopes: ['read', 'write']
            }, {
                headers: { 'x-tenant-id': tenant.id }
            });

            setCreatedKey(response.data.key);
            setNewKeyName('');
            loadApiKeys();
        } catch (error) {
            console.error('Failed to create API key:', error);
        }
    };

    const revokeApiKey = async (keyId: string) => {
        if (!tenant?.id) return;

        try {
            await api.delete(`/admin/api-keys/${keyId}`, {
                headers: { 'x-tenant-id': tenant.id }
            });
            loadApiKeys();
        } catch (error) {
            console.error('Failed to revoke API key:', error);
        }
    };

    const toggleKeyVisibility = (keyId: string) => {
        setVisibleKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(keyId)) {
                newSet.delete(keyId);
            } else {
                newSet.add(keyId);
            }
            return newSet;
        });
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const maskKey = (key: string) => {
        return `${key.substring(0, 8)}${'•'.repeat(24)}${key.substring(key.length - 4)}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-0">
                    Developer Tools
                </h1>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    API keys, documentation, and integration tools for developers
                </p>
            </div>

            <Tabs defaultValue="api-keys" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="api-keys">
                        <Key className="mr-2 h-4 w-4" />
                        API Keys
                    </TabsTrigger>
                    <TabsTrigger value="documentation">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Documentation
                    </TabsTrigger>
                    <TabsTrigger value="webhooks">
                        <Webhook className="mr-2 h-4 w-4" />
                        Webhooks
                    </TabsTrigger>
                    <TabsTrigger value="playground">
                        <Terminal className="mr-2 h-4 w-4" />
                        API Playground
                    </TabsTrigger>
                </TabsList>

                {/* API Keys Tab */}
                <TabsContent value="api-keys" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>API Keys</CardTitle>
                                    <CardDescription>
                                        Manage your API keys for programmatic access
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create API Key
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="skeleton h-20 rounded-lg" />
                                    ))}
                                </div>
                            ) : apiKeys.length === 0 ? (
                                <div className="text-center py-12">
                                    <Key className="mx-auto h-12 w-12 text-neutral-300" />
                                    <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-0">
                                        No API keys
                                    </h3>
                                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        Create your first API key to get started
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {apiKeys.map((key) => (
                                        <div
                                            key={key.id}
                                            className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-medium text-neutral-900 dark:text-neutral-0">
                                                        {key.name}
                                                    </h4>
                                                    <Badge
                                                        variant={key.status === 'ACTIVE' ? 'default' : 'secondary'}
                                                    >
                                                        {key.status}
                                                    </Badge>
                                                </div>
                                                {key.key && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <code className="rounded bg-neutral-100 px-2 py-1 text-sm font-mono dark:bg-neutral-800">
                                                            {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleKeyVisibility(key.id)}
                                                        >
                                                            {visibleKeys.has(key.id) ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(key.key!, key.id)}
                                                        >
                                                            {copiedKey === key.id ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                                    Created {new Date(key.createdAt).toLocaleDateString()}
                                                    {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => revokeApiKey(key.id)}
                                                disabled={key.status === 'REVOKED'}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Start Guide */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Start</CardTitle>
                            <CardDescription>Get started with the API in minutes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="mb-2 font-medium">1. Authentication</h4>
                                <pre className="rounded-lg bg-neutral-900 p-4 text-sm text-neutral-0 overflow-x-auto">
                                    {`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.projectida.com/v1/datasets`}
                                </pre>
                            </div>
                            <div>
                                <h4 className="mb-2 font-medium">2. Upload Dataset</h4>
                                <pre className="rounded-lg bg-neutral-900 p-4 text-sm text-neutral-0 overflow-x-auto">
                                    {`curl -X POST https://api.projectida.com/v1/datasets \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -F "file=@data.csv" \\
     -F "name=My Dataset"`}
                                </pre>
                            </div>
                            <div>
                                <h4 className="mb-2 font-medium">3. Run Analysis</h4>
                                <pre className="rounded-lg bg-neutral-900 p-4 text-sm text-neutral-0 overflow-x-auto">
                                    {`curl -X POST https://api.projectida.com/v1/jobs \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{"datasetId": "dataset_id", "type": "EDA"}'`}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Documentation Tab */}
                <TabsContent value="documentation" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    API Reference
                                </CardTitle>
                                <CardDescription>
                                    Complete API documentation with examples
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full">
                                    View Documentation
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code2 className="h-5 w-5" />
                                    SDKs & Libraries
                                </CardTitle>
                                <CardDescription>
                                    Official SDKs for popular languages
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Badge variant="outline">Python</Badge>
                                    <Badge variant="outline">JavaScript</Badge>
                                    <Badge variant="outline">Go</Badge>
                                    <Badge variant="outline">Ruby</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Tutorials
                                </CardTitle>
                                <CardDescription>
                                    Step-by-step guides and examples
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full">
                                    Browse Tutorials
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="h-5 w-5" />
                                    CLI Tool
                                </CardTitle>
                                <CardDescription>
                                    Command-line interface for Project IDA
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <code className="text-sm">npm install -g @project-ida/cli</code>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Webhooks Tab */}
                <TabsContent value="webhooks" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Webhooks</CardTitle>
                            <CardDescription>
                                Receive real-time notifications about events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <Webhook className="mx-auto h-12 w-12 text-neutral-300" />
                                <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-0">
                                    Webhooks Coming Soon
                                </h3>
                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    Configure webhooks to receive real-time notifications
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Playground Tab */}
                <TabsContent value="playground" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>API Playground</CardTitle>
                            <CardDescription>
                                Test API endpoints directly from your browser
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <Terminal className="mx-auto h-12 w-12 text-neutral-300" />
                                <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-0">
                                    API Playground Coming Soon
                                </h3>
                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    Interactive API testing environment
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create API Key Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>
                            Create a new API key for programmatic access
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="key-name">Key Name</Label>
                            <Input
                                id="key-name"
                                placeholder="Production API Key"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                            />
                        </div>
                        {createdKey && (
                            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                    Save this key - it won't be shown again!
                                </p>
                                <code className="mt-2 block rounded bg-white p-2 text-sm dark:bg-neutral-800">
                                    {createdKey}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => copyToClipboard(createdKey, 'new')}
                                >
                                    {copiedKey === 'new' ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Key
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowCreateDialog(false);
                            setCreatedKey(null);
                            setNewKeyName('');
                        }}>
                            {createdKey ? 'Done' : 'Cancel'}
                        </Button>
                        {!createdKey && (
                            <Button onClick={createApiKey} disabled={!newKeyName.trim()}>
                                Create Key
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Developer;
