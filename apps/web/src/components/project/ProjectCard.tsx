/**
 * PROJECT IDA - Project Card Component
 * Professional project card for grid/list views
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Database, Calendar, MoreVertical, Trash2, Settings } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { StatusIndicator } from '../common';
import { cn } from '../../lib/utils';

interface ProjectCardProps {
    project: {
        id: string;
        name: string;
        description?: string;
        datasetCount?: number;
        createdAt: string;
        updatedAt?: string;
    };
    onDelete?: (id: string) => void;
    className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    onDelete,
    className,
}) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/projects/${project.id}`);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete && confirm(`Are you sure you want to delete "${project.name}"?`)) {
            onDelete(project.id);
        }
    };

    return (
        <Card
            className={cn(
                'group cursor-pointer border-neutral-200 bg-white transition-all duration-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900',
                className
            )}
            onClick={handleCardClick}
        >
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-primary-100 p-2.5 dark:bg-primary-900/30">
                                <FolderTree className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                    {project.name}
                                </h3>
                                {project.description && (
                                    <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-error-600 focus:text-error-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                            <Database className="h-4 w-4" />
                            <span>{project.datasetCount || 0} datasets</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <StatusIndicator status="success" label="Active" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProjectCard;
