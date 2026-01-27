/**
 * PROJECT IDA - Metric Card Component
 * Compact metric display for data analysis
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
    label: string;
    value: string | number;
    unit?: string;
    description?: string;
    variant?: 'default' | 'highlight' | 'muted';
    className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    unit,
    description,
    variant = 'default',
    className,
}) => {
    return (
        <div
            className={cn(
                'rounded-lg border p-4',
                variant === 'default' && 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
                variant === 'highlight' && 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950',
                variant === 'muted' && 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900',
                className
            )}
        >
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    {label}
                </p>
                <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                        {value}
                    </p>
                    {unit && (
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            {unit}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
};

export default MetricCard;
