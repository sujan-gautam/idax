/**
 * DATASETS LIBRARY PAGE
 * View all datasets across all projects
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Table as TableIcon,
    Calendar,
    ArrowUpRight,
    MoreVertical,
    ExternalLink,
    Trash2,
    Plus,
    Loader2,
    Database
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PageHeader, EmptyState } from '../components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import UploadComponent from '../components/UploadComponent';

interface Dataset {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    projectId?: string;
    // _count not included in list endpoint yet
}

const Datasets: React.FC = () => {
    const { tenant } = useAuthStore();
    const navigate = useNavigate();

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        loadDatasets();
    }, [tenant?.id]);

    useEffect(() => {
        // Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            setFilteredDatasets(
                datasets.filter((d) => d.name.toLowerCase().includes(query))
            );
        } else {
            setFilteredDatasets(datasets);
        }
    }, [searchQuery, datasets]);

    const loadDatasets = async () => {
        if (!tenant?.id) return;
        try {
            setLoading(true);
            setError(null);
            // Calls GET /datasets
            const response = await api.get('/datasets');
            setDatasets(response.data);
        } catch (err: any) {
            console.error('Failed to load datasets:', err);
            setError(err.message || 'Failed to load datasets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) return;

        try {
            await api.delete(`/datasets/${id}`);

            // Remove locally to feel instant
            setDatasets(datasets.filter(d => d.id !== id));
            setFilteredDatasets(filteredDatasets.filter(d => d.id !== id));
        } catch (error) {
            console.error('Failed to delete dataset:', error);
            alert('Failed to delete dataset. It may be in use by other resources.');
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <EmptyState
                icon={Database}
                title="Failed to Load Datasets"
                description={error}
                action={{
                    label: 'Retry',
                    onClick: loadDatasets,
                }}
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Datasets Library"
                description="Manage all your data assets in one place"
                actions={
                    <Button onClick={() => setIsUploadOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Dataset
                    </Button>
                }
            />

            {/* Search */}
            {datasets.length > 0 && (
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <Input
                            placeholder="Search datasets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-10"
                        />
                    </div>
                </div>
            )}

            {/* Grid */}
            {filteredDatasets.length === 0 ? (
                <EmptyState
                    icon={Database}
                    title={searchQuery ? 'No datasets found' : 'No datasets yet'}
                    description={searchQuery ? 'Try adjusting your search query' : 'Upload your first dataset to get started'}
                    action={!searchQuery ? {
                        label: 'Upload Dataset',
                        onClick: () => setIsUploadOpen(true)
                    } : undefined}
                />
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
                                        <Calendar className="h-3 w-3" />
                                        {new Date(dataset.createdAt).toLocaleDateString()}
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
                                        <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(dataset.id, e)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="flex-1 py-4">
                                <div className="text-sm text-slate-500 line-clamp-2">
                                    {dataset.description || "No description provided."}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t">
                                <span>Project: {dataset.projectId || 'Default'}</span>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle>Upload Dataset</DialogTitle>
                        <DialogDescription>
                            Upload data to your Global Library (will be assigned to Default Project)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <UploadComponent
                            onUploadComplete={() => {
                                setIsUploadOpen(false);
                                loadDatasets();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Datasets;
