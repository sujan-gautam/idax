/**
 * PROJECT IDA - PROJECTS PAGE
 * Professional projects management interface
 * Design: Linear + Vercel inspired
 */

import React, { useEffect, useState } from 'react';
import { Plus, Search, FolderTree } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PageHeader, EmptyState, LoadingState } from '../components/common';
import { ProjectCard, CreateProjectDialog } from '../components/project';

interface Project {
    id: string;
    name: string;
    description?: string;
    datasetCount?: number;
    createdAt: string;
    updatedAt: string;
}

const Projects: React.FC = () => {
    const { tenant } = useAuthStore();

    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    useEffect(() => {
        loadProjects();
    }, [tenant?.id]);

    useEffect(() => {
        // Filter projects based on search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            setFilteredProjects(
                projects.filter(
                    (project) =>
                        project.name.toLowerCase().includes(query) ||
                        project.description?.toLowerCase().includes(query)
                )
            );
        } else {
            setFilteredProjects(projects);
        }
    }, [searchQuery, projects]);

    const loadProjects = async () => {
        if (!tenant?.id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await api.get('/projects', {
                headers: { 'x-tenant-id': tenant.id },
            });

            setProjects(response.data);
        } catch (err: any) {
            console.error('Failed to load projects:', err);
            setError(err.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (name: string, description?: string) => {
        if (!tenant?.id) return;

        const response = await api.post(
            '/projects',
            { name, description },
            { headers: { 'x-tenant-id': tenant.id } }
        );

        // Add new project to list
        setProjects([response.data, ...projects]);
    };

    const handleDeleteProject = async (id: string) => {
        if (!tenant?.id) return;

        try {
            await api.delete(`/projects/${id}`, {
                headers: { 'x-tenant-id': tenant.id },
            });

            // Remove from list
            setProjects(projects.filter((p) => p.id !== id));
        } catch (err: any) {
            console.error('Failed to delete project:', err);
            alert('Failed to delete project. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="skeleton h-12 w-64" />
                <div className="skeleton h-10 w-full max-w-md" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton h-48 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <EmptyState
                icon={FolderTree}
                title="Failed to Load Projects"
                description={error}
                action={{
                    label: 'Retry',
                    onClick: loadProjects,
                }}
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <PageHeader
                title="Projects"
                description="Organize your datasets and analysis workflows into projects"
                actions={
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                }
            />

            {/* Search and Filters */}
            {projects.length > 0 && (
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <Input
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="font-medium">{filteredProjects.length}</span>
                        <span>
                            {filteredProjects.length === 1 ? 'project' : 'projects'}
                        </span>
                    </div>
                </div>
            )}

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <EmptyState
                    icon={FolderTree}
                    title={
                        searchQuery
                            ? 'No projects found'
                            : 'No projects yet'
                    }
                    description={
                        searchQuery
                            ? 'Try adjusting your search query'
                            : 'Create your first project to get started with organizing your data analysis workflows'
                    }
                    action={
                        !searchQuery
                            ? {
                                label: 'Create Project',
                                onClick: () => setCreateDialogOpen(true),
                            }
                            : undefined
                    }
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onDelete={handleDeleteProject}
                        />
                    ))}
                </div>
            )}

            {/* Create Project Dialog */}
            <CreateProjectDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCreateProject={handleCreateProject}
            />
        </div>
    );
};

export default Projects;
