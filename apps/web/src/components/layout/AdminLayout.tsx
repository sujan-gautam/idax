/**
 * ADMIN LAYOUT
 * Completely separate layout for admin panel
 * No connection to user dashboard
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    Shield,
    Users,
    Zap,
    CreditCard,
    Activity,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Moon,
    Sun,
    Home,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';

import { useTheme } from '../../context/ThemeContext';

interface AdminNavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
}

const adminNavItems: AdminNavItem[] = [
    { id: 'statistics', label: 'Statistics', icon: Activity, path: '/admin/statistics' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'features', label: 'Features', icon: Zap, path: '/admin/features' },
    { id: 'quotas', label: 'Quotas', icon: CreditCard, path: '/admin/quotas' },
    { id: 'audit', label: 'Audit Logs', icon: FileText, path: '/admin/audit' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, tenant, logout } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavLink: React.FC<{ item: AdminNavItem }> = ({ item }) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
            <Link
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                    isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
            >
                <Icon className={cn('h-5 w-5 shrink-0')} />
                <span>{item.label}</span>
            </Link>
        );
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Admin Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Sidebar Header */}
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900 dark:text-white">Admin Panel</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Control Center</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                    >
                        <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                    {adminNavItems.map((item) => (
                        <NavLink key={item.id} item={item} />
                    ))}
                </nav>

                {/* Back to Dashboard */}
                <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        <Home className="h-5 w-5" />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>

                {/* Tenant Info */}
                <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                    <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Organization</p>
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {tenant?.name || 'Default Org'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {tenant?.plan || 'FREE'} Plan
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-6">
                    {/* Left: Mobile Menu */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="rounded-md p-2 hover:bg-slate-800 lg:hidden"
                        >
                            <Menu className="h-5 w-5 text-slate-400" />
                        </button>

                        {/* Admin Badge */}
                        <div className="flex items-center gap-2 rounded-full bg-indigo-600/20 px-3 py-1.5 text-xs font-bold text-indigo-400">
                            <Shield className="h-3 w-3" />
                            ADMIN ACCESS
                        </div>
                    </div>

                    {/* Right: Actions + User Menu */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="rounded-md p-2 hover:bg-slate-800"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-4 w-4 text-slate-400" />
                            ) : (
                                <Moon className="h-4 w-4 text-slate-400" />
                            )}
                        </button>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-xs font-semibold text-white">
                                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        <p className="text-xs font-bold text-indigo-600">
                                            {user?.role}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                                    <Home className="mr-2 h-4 w-4" />
                                    User Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
