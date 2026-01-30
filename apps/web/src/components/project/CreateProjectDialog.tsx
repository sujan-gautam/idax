/**
 * PROJECT IDA - Create Project Dialog
 * Professional dialog for creating new projects
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateProject: (name: string, description?: string) => Promise<void>;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
    open,
    onOpenChange,
    onCreateProject,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Project name is required');
            return;
        }

        try {
            setIsLoading(true);
            await onCreateProject(name.trim(), description.trim() || undefined);

            // Reset form
            setName('');
            setDescription('');
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create project');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Projects help you organize your datasets and analysis workflows.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="alert alert-error">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="project-name">
                            Project name <span className="text-error-500">*</span>
                        </label>
                        <Input
                            id="project-name"
                            placeholder="My Data Analysis Project"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                            required
                            className="h-11"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="project-description">
                            Description <span className="text-neutral-500">(optional)</span>
                        </label>
                        <textarea
                            id="project-description"
                            placeholder="Describe the purpose of this project..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            rows={3}
                            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-offset-neutral-950"
                        />
                        <p className="form-helper">
                            Help your team understand what this project is for
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateProjectDialog;
