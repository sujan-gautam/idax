import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Database,
    Upload,
    Plus,
    Table as TableIcon,
    Search,
    MoreVertical,
    Trash2,
    ExternalLink,
    Calendar,
    History,
    Loader2,
    ChevronLeft,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import UploadComponent from '../components/UploadComponent';
import { cn } from '../lib/utils';

interface Dataset {
    id: string;
    name: string;
    createdAt: string;
    _count?: {
        versions: number;
    };
}

interface Project {
    id: string;
    name: string;
    description?: string;
    datasets: Dataset[];
}

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { tenant } = useAuthStore();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProject();
    }, [id, tenant?.id]);

    const loadProject = async () => {
        if (!id || !tenant?.id) return;
        try {
            setLoading(true);
            const response = await api.get(`/projects/${id}`, {
                headers: { 'x-tenant-id': tenant.id }
            });
            setProject(response.data);
        } catch (error) {
            console.error('Failed to load project:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Project not found</h2>
                <Button variant="outline" onClick={() => navigate('/projects')}>
                    Back to Projects
                </Button>
            </div>
        );
    }

    const filteredDatasets = project.datasets.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-primary transition-colors mb-2"
                    >
                        <ChevronLeft className="h-3 w-3" />
                        Back to Projects
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                            {project.name.charAt(0)}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {project.name}
                        </h1>
                    </div>
                    <p className="text-slate-500 max-w-2xl px-1">
                        {project.description || 'No description provided for this project.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => loadProject()}>
                        Refresh
                    </Button>
                    <Button onClick={() => setIsUploadOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Dataset
                    </Button>
                </div>
            </div>

            {/* Dataset Filter */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search within this project..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="font-medium underline decoration-primary decoration-2 underline-offset-4">Recent Datasets</span>
                    <span className="opacity-50 hover:opacity-100 cursor-pointer">Pipelines</span>
                    <span className="opacity-50 hover:opacity-100 cursor-pointer">Settings</span>
                </div>
            </div>

            {/* Dataset Grid */}
            {filteredDatasets.length === 0 ? (
                <Card className="border-dashed py-24 text-center bg-transparent">
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <TableIcon className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold">No datasets found</h3>
                            <p className="text-sm text-slate-500">
                                {searchQuery ? "No results match your search." : "This project doesn't have any datasets yet."}
                            </p>
                        </div>
                        {!searchQuery && (
                            <Button onClick={() => setIsUploadOpen(true)}>
                                Upload your first dataset
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredDatasets.map((dataset) => (
                        <Card key={dataset.id} className="group hover:shadow-lg transition-all border-none bg-white dark:bg-slate-900 cursor-pointer overflow-hidden flex flex-col" onClick={() => navigate(`/datasets/${dataset.id}`)}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                                        {dataset.name}
                                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        <History className="h-3 w-3" />
                                        {dataset._count?.versions || 1} versions released
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigate(`/datasets/${dataset.id}`)}>
                                            <ExternalLink className="mr-2 h-4 w-4" /> Open
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="flex-1 py-4">
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t">
                                <span>System Ready</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </CardFooter>
                        </Card>
                    ))}

                    {/* Quick Add Card */}
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all gap-3 text-slate-400 hover:text-primary group"
                    >
                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest">Add Dataset</span>
                    </button>
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>File Intelligence Upload</DialogTitle>
                        <DialogDescription>
                            Upload CSV, JSON or Excel files. Our system will automatically parse and analyze the data.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <UploadComponent
                            onUploadComplete={() => {
                                setIsUploadOpen(false);
                                loadProject();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectDetail;
