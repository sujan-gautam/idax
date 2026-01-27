/**
 * PROJECT IDA - Empty State Component
 * Professional empty state with icon, title, description, and CTA
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface EmptyStateProps {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className,
}) => {
    return (
        <div className={cn('empty-state', className)}>
            {Icon && <Icon className="empty-state-icon" />}
            <h3 className="empty-state-title">{title}</h3>
            {description && (
                <p className="empty-state-description">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
