/**
 * AUDIT LOGS COMPONENT
 * Complete audit trail of all system actions
 */

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Search,
    Filter,
    Download,
    Loader2,
    Calendar,
    User,
    FileText,
    Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    ip: string | null;
    userAgent: string | null;
    diffJson: any;
    createdAt: string;
    actorUser: {
        id: string;
        email: string;
        name: string | null;
    } | null;
}

const ACTION_COLORS: Record<string, string> = {
    USER_CREATED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    USER_UPDATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    USER_DELETED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    FEATURE_FLAGS_UPDATED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    QUOTAS_UPDATED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    TENANT_UPDATED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    API_KEY_REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export const AuditLogs: React.FC = () => {
    const { tenant } = useAuthStore();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, entityTypeFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
                ...(actionFilter !== 'all' && { action: actionFilter }),
                ...(entityTypeFilter !== 'all' && { entityType: entityTypeFilter })
            });

            const response = await api.get(`/admin/audit-logs?${params}`, {
                headers: { 'x-tenant-id': tenant?.id }
            });

            setLogs(response.data.logs);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setShowDetailsModal(true);
    };

    const handleExport = async () => {
        try {
            // In a real implementation, this would download a CSV/JSON file
            const dataStr = JSON.stringify(logs, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit-logs-${new Date().toISOString()}.json`;
            link.click();
        } catch (error) {
            console.error('Failed to export logs:', error);
        }
    };

    const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
    const uniqueEntityTypes = Array.from(new Set(logs.map(log => log.entityType)));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-600" />
                        Audit Logs
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Complete audit trail of all system actions
                    </p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Logs
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {uniqueActions.map(action => (
                                    <SelectItem key={action} value={action}>
                                        {action.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by entity type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Entity Types</SelectItem>
                                {uniqueEntityTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No audit logs found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Entity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Details
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-800'}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                        {log.entityType}
                                                    </div>
                                                    <div className="text-slate-500 font-mono text-xs">
                                                        {log.entityId.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.actorUser ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-slate-400" />
                                                        <div className="text-sm">
                                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                {log.actorUser.name || 'Unnamed'}
                                                            </div>
                                                            <div className="text-slate-500 text-xs">
                                                                {log.actorUser.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-500">System</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-slate-500">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this audit event
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Action</label>
                                    <p className="text-sm font-medium mt-1">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Entity Type</label>
                                    <p className="text-sm font-medium mt-1">{selectedLog.entityType}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Entity ID</label>
                                    <p className="text-sm font-mono mt-1">{selectedLog.entityId}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Timestamp</label>
                                    <p className="text-sm mt-1">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                </div>
                                {selectedLog.actorUser && (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">User</label>
                                            <p className="text-sm mt-1">{selectedLog.actorUser.name || 'Unnamed'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                            <p className="text-sm mt-1">{selectedLog.actorUser.email}</p>
                                        </div>
                                    </>
                                )}
                                {selectedLog.ip && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">IP Address</label>
                                        <p className="text-sm font-mono mt-1">{selectedLog.ip}</p>
                                    </div>
                                )}
                            </div>
                            {selectedLog.diffJson && Object.keys(selectedLog.diffJson).length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Changes</label>
                                    <pre className="mt-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs overflow-auto max-h-64">
                                        {JSON.stringify(selectedLog.diffJson, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {selectedLog.userAgent && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">User Agent</label>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-all">
                                        {selectedLog.userAgent}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
