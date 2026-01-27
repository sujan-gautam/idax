/**
 * PROJECT IDA - Status Indicator Component
 * Professional status badges and indicators
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'processing';

interface StatusIndicatorProps {
    status: StatusType;
    label?: string;
    showDot?: boolean;
    className?: string;
}

const statusConfig: Record<StatusType, { color: string; bgColor: string; dotColor: string }> = {
    success: {
        color: 'text-success-700 dark:text-success-300',
        bgColor: 'bg-success-100 dark:bg-success-900/30',
        dotColor: 'bg-success-500',
    },
    warning: {
        color: 'text-warning-700 dark:text-warning-300',
        bgColor: 'bg-warning-100 dark:bg-warning-900/30',
        dotColor: 'bg-warning-500',
    },
    error: {
        color: 'text-error-700 dark:text-error-300',
        bgColor: 'bg-error-100 dark:bg-error-900/30',
        dotColor: 'bg-error-500',
    },
    info: {
        color: 'text-info-700 dark:text-info-300',
        bgColor: 'bg-info-100 dark:bg-info-900/30',
        dotColor: 'bg-info-500',
    },
    neutral: {
        color: 'text-neutral-700 dark:text-neutral-300',
        bgColor: 'bg-neutral-100 dark:bg-neutral-800',
        dotColor: 'bg-neutral-400',
    },
    processing: {
        color: 'text-primary-700 dark:text-primary-300',
        bgColor: 'bg-primary-100 dark:bg-primary-900/30',
        dotColor: 'bg-primary-500 animate-pulse',
    },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
    status,
    label,
    showDot = true,
    className,
}) => {
    const config = statusConfig[status];

    if (!label) {
        return (
            <span className={cn('status-dot', config.dotColor, className)} />
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                config.bgColor,
                config.color,
                className
            )}
        >
            {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />}
            {label}
        </span>
    );
};

export default StatusIndicator;
