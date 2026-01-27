import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

interface PermissionGateProps {
    children: React.ReactNode;
    requiredRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    fallback?: React.ReactNode;
}

/**
 * PermissionGate - Enterprise role-based access control
 * 
 * Hides UI elements based on user role.
 * NO disabled buttons - if user can't perform action, don't show it.
 * 
 * @example
 * <PermissionGate requiredRole="ADMIN">
 *   <Button>Delete Project</Button>
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
    children,
    requiredRole = 'MEMBER',
    fallback = null,
}) => {
    const { user } = useAuthStore();

    if (!user) {
        return <>{fallback}</>;
    }

    const roleHierarchy = {
        VIEWER: 0,
        MEMBER: 1,
        ADMIN: 2,
        OWNER: 3,
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] ?? 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel >= requiredLevel) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
