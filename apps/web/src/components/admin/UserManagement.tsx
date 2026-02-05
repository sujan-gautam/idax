/**
 * USER MANAGEMENT COMPONENT
 * Complete user CRUD operations with role-based access control
 */

import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Shield,
    Eye,
    Ban,
    CheckCircle,
    XCircle,
    Loader2,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    createdAt: string;
    lastLoginAt: string | null;
}

export const UserManagement: React.FC = () => {
    const { tenant } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'MEMBER' as User['role']
    });

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter, statusFilter, searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(searchTerm && { search: searchTerm }),
                ...(roleFilter !== 'all' && { role: roleFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter })
            });

            const response = await api.get(`/admin/users?${params}`, {
                headers: { 'x-tenant-id': tenant?.id }
            });

            setUsers(response.data.users);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        try {
            await api.post('/admin/users', formData, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setShowCreateModal(false);
            setFormData({ email: '', name: '', password: '', role: 'MEMBER' });
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create user');
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        try {
            await api.patch(`/admin/users/${selectedUser.id}`, {
                name: formData.name,
                role: formData.role
            }, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update user');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await api.delete(`/admin/users/${selectedUser.id}`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleStatusChange = async (userId: string, newStatus: User['status']) => {
        try {
            await api.patch(`/admin/users/${userId}`, { status: newStatus }, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update status');
        }
    };

    const getRoleBadgeColor = (role: User['role']) => {
        switch (role) {
            case 'OWNER': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
            case 'ADMIN': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'MEMBER': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'VIEWER': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getStatusBadge = (status: User['status']) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" /> Active
                </Badge>;
            case 'INACTIVE':
                return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                    <XCircle className="h-3 w-3 mr-1" /> Inactive
                </Badge>;
            case 'SUSPENDED':
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <Ban className="h-3 w-3 mr-1" /> Suspended
                </Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-indigo-600" />
                        User Management
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage users, roles, and permissions
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="OWNER">Owner</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Last Login
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                        {user.name || 'Unnamed User'}
                                                    </div>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={getRoleBadgeColor(user.role)}>
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(user.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {user.lastLoginAt
                                                    ? new Date(user.lastLoginAt).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedUser(user);
                                                            setFormData({
                                                                email: user.email,
                                                                name: user.name || '',
                                                                password: '',
                                                                role: user.role
                                                            });
                                                            setShowEditModal(true);
                                                        }}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {user.status === 'ACTIVE' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'SUSPENDED')}>
                                                                <Ban className="h-4 w-4 mr-2" />
                                                                Suspend
                                                            </DropdownMenuItem>
                                                        )}
                                                        {user.status === 'SUSPENDED' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'ACTIVE')}>
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Activate
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowDeleteModal(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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

            {/* Create User Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to your organization
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <Label htmlFor="role">Role</Label>
                            <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MEMBER">Member</SelectItem>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateUser}>Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information and permissions
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MEMBER">Member</SelectItem>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
