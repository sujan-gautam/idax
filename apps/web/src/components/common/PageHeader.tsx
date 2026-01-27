/**
 * PROJECT IDA - Page Header Component
 * Professional page header with title, description, and actions
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    breadcrumbs?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    actions,
    breadcrumbs,
    className,
}) => {
    return (
        <div className={cn('page-header', className)}>
            {breadcrumbs && (
                <div className="mb-4">
                    {breadcrumbs}
                </div>
            )}

            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                    <h1 className="page-title">{title}</h1>
                    {description && (
                        <p className="page-description">{description}</p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
