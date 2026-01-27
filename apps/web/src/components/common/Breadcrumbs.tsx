/**
 * PROJECT IDA - Breadcrumbs Component
 * Professional breadcrumb navigation
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    showHome?: boolean;
    className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    items,
    showHome = true,
    className,
}) => {
    return (
        <nav className={cn('breadcrumbs', className)} aria-label="Breadcrumb">
            {showHome && (
                <>
                    <Link
                        to="/"
                        className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                    >
                        <Home className="h-4 w-4" />
                    </Link>
                    {items.length > 0 && (
                        <ChevronRight className="h-4 w-4 breadcrumb-separator" />
                    )}
                </>
            )}

            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {item.href ? (
                        <Link
                            to={item.href}
                            className="hover:text-neutral-900 dark:hover:text-neutral-50"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-medium text-neutral-900 dark:text-neutral-50">
                            {item.label}
                        </span>
                    )}
                    {index < items.length - 1 && (
                        <ChevronRight className="h-4 w-4 breadcrumb-separator" />
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
