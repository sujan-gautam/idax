/**
 * PROJECT IDA - Loading State Component
 * Professional loading states with skeletons and spinners
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
    variant?: 'spinner' | 'skeleton' | 'page';
    message?: string;
    className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    variant = 'spinner',
    message,
    className,
}) => {
    if (variant === 'page') {
        return (
            <div className={cn('flex min-h-[400px] items-center justify-center', className)}>
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
                    {message && (
                        <p className="mt-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'skeleton') {
        return (
            <div className={cn('space-y-3', className)}>
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
                <div className="skeleton h-4 w-4/6" />
            </div>
        );
    }

    return (
        <div className={cn('flex items-center justify-center', className)}>
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            {message && (
                <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {message}
                </span>
            )}
        </div>
    );
};

export default LoadingState;
