/**
 * PROJECT IDA - APP SHELL
 * Enterprise-grade application layout
 * Inspired by: Stripe Dashboard, Vercel, Linear
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderTree,
    Database,
    GitBranch,
    Settings,
    CreditCard,
    ShieldCheck,
    Code2,
    ChevronLeft,
    Menu,
    X,
    Bell,
    Search,
    User,
    LogOut,
    Moon,
    Sun,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useFeatureStore } from '../../store/useFeatureStore';
import { PermissionGate } from '../PermissionGate';
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

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    badge?: string;
    requiredRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'projects', label: 'Projects', icon: FolderTree, path: '/projects' },
    { id: 'datasets', label: 'Datasets', icon: Database, path: '/datasets' },
    { id: 'jobs', label: 'Jobs & Pipelines', icon: GitBranch, path: '/jobs' },
];

const systemNavItems: NavItem[] = [
    { id: 'developer', label: 'Developer', icon: Code2, path: '/developer' },
    { id: 'billing', label: 'Billing', icon: CreditCard, path: '/billing' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    // Admin is accessed separately at /admin - not shown in user dashboard
];

const AppShell: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, tenant, logout } = useAuthStore();
    const { fetchMetadata } = useFeatureStore();
    const { theme, toggleTheme } = useTheme();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Fetch feature flags and quotas on mount
    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata, tenant?.id]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;

        return (
            <Link
                to={item.path}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                        ? 'bg-neutral-900 text-neutral-0 dark:bg-neutral-0 dark:text-neutral-900'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-0'
                )}
            >
                <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-neutral-0 dark:text-neutral-900')} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
                {item.badge && !isSidebarCollapsed && (
                    <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-xs font-medium text-white">
                        {item.badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-900 lg:static',
                    isSidebarCollapsed ? 'w-16' : 'w-60',
                    isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Sidebar Header */}
                <div className="flex h-14 items-center border-b border-neutral-200 px-4 dark:border-neutral-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 font-mono text-sm font-bold text-white dark:bg-neutral-0 dark:text-neutral-900">
                            IDA
                        </div>
                        {!isSidebarCollapsed && (
                            <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-0">
                                Project IDA
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="ml-auto hidden rounded-md p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:block"
                    >
                        <ChevronLeft
                            className={cn(
                                'h-4 w-4 transition-transform',
                                isSidebarCollapsed && 'rotate-180'
                            )}
                        />
                    </button>
                    <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="ml-auto rounded-md p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-thin">
                    {/* Main Navigation */}
                    <div className="space-y-1">
                        {!isSidebarCollapsed && (
                            <h6 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                Main
                            </h6>
                        )}
                        {mainNavItems.map((item) => (
                            <NavLink key={item.id} item={item} />
                        ))}
                    </div>

                    {/* System Navigation */}
                    <div className="space-y-1">
                        {!isSidebarCollapsed && (
                            <h6 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                System
                            </h6>
                        )}
                        {systemNavItems.map((item) => {
                            if (item.requiredRole) {
                                return (
                                    <PermissionGate key={item.id} requiredRole={item.requiredRole}>
                                        <NavLink item={item} />
                                    </PermissionGate>
                                );
                            }
                            return <NavLink key={item.id} item={item} />;
                        })}
                    </div>
                </nav>

                {/* Sidebar Footer - Tenant Info */}
                <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                    {!isSidebarCollapsed ? (
                        <div className="rounded-md bg-neutral-100 p-3 dark:bg-neutral-800">
                            <p className="text-xs font-medium text-neutral-500">Organization</p>
                            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-0">
                                {tenant?.name || 'Default Org'}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                                {tenant?.plan || 'FREE'} Plan
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900 lg:px-6">
                    {/* Left: Mobile Menu + Breadcrumbs */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="rounded-md p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {/* Breadcrumbs - Simple for now */}
                        <div className="hidden text-sm font-medium text-neutral-600 dark:text-neutral-400 lg:block">
                            {location.pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}
                        </div>
                    </div>

                    {/* Right: Actions + User Menu */}
                    <div className="flex items-center gap-2">
                        {/* Global Search - Future enhancement */}
                        <button className="hidden rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 md:block">
                            <Search className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                        </button>

                        {/* Notifications - Future enhancement */}
                        <button className="relative rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <Bell className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                            ) : (
                                <Moon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                            )}
                        </button>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-0 dark:text-neutral-900">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Role: {user?.role}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/billing')}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Billing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
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
                <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 scrollbar-thin dark:bg-neutral-950 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppShell;
