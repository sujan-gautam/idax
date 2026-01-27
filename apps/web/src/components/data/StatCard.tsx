/**
 * PROJECT IDA - Stat Card Component
 * Professional metric/statistic card for dashboards
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../ui/card';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ComponentType<{ className?: string }>;
    trend?: {
        value: string;
        positive: boolean;
    };
    onClick?: () => void;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    onClick,
    className,
}) => {
    return (
        <Card
            className={cn(
                'border-none bg-white shadow-sm transition-all duration-200 dark:bg-neutral-900',
                onClick && 'cursor-pointer hover:shadow-md',
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                        <p className="stat-label">{title}</p>
                        <p className="stat-value">{value}</p>
                        {subtitle && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {subtitle}
                            </p>
                        )}
                        {trend && (
                            <div className={cn('stat-change', trend.positive ? 'positive' : 'negative')}>
                                {trend.positive ? (
                                    <TrendingUp className="h-3.5 w-3.5" />
                                ) : (
                                    <TrendingDown className="h-3.5 w-3.5" />
                                )}
                                <span>{trend.value}</span>
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
                            <Icon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default StatCard;
