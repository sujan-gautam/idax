import React from 'react';
import { useFeatureStore } from '../store/useFeatureStore';

interface FeatureGateProps {
    children: React.ReactNode;
    feature: string;
    fallback?: React.ReactNode;
    /**
     * If true, shows a message explaining why feature is hidden.
     * Use sparingly - prefer complete hiding.
     */
    showDisabledMessage?: boolean;
}

/**
 * FeatureGate - Server-driven feature flag control
 * 
 * Completely hides features that are disabled by backend.
 * UI auto-adapts to available capabilities.
 * 
 * @example
 * <FeatureGate feature="advancedCleansing">
 *   <Button>AI Data Cleansing</Button>
 * </FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
    children,
    feature,
    fallback = null,
    showDisabledMessage = false,
}) => {
    const { isFeatureEnabled } = useFeatureStore();

    if (isFeatureEnabled(feature)) {
        return <>{children}</>;
    }

    if (showDisabledMessage) {
        return (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                    This feature is not available on your current plan.
                </p>
            </div>
        );
    }

    return <>{fallback}</>;
};

/**
 * Hook to check feature availability in logic
 */
export const useFeatureFlag = (feature: string): boolean => {
    const { isFeatureEnabled } = useFeatureStore();
    return isFeatureEnabled(feature);
};
