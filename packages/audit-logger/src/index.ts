import { prisma } from '@project-ida/db';
import { logger } from '@project-ida/logger';

export interface AuditLogEntry {
    tenantId: string;
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    ip?: string;
    userAgent?: string;
    diffJson?: any;
    correlationId?: string;
}

/**
 * PRODUCTION AUDIT LOGGING
 * Records ALL state-changing operations
 * Required for compliance, security, and debugging
 */
export class AuditLogger {
    /**
     * Log a single audit event
     */
    static async log(entry: AuditLogEntry): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    tenantId: entry.tenantId,
                    actorUserId: entry.actorUserId,
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    ip: entry.ip,
                    userAgent: entry.userAgent,
                    diffJson: entry.diffJson,
                    correlationId: entry.correlationId
                }
            });

            logger.info({
                correlationId: entry.correlationId,
                tenantId: entry.tenantId,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId
            }, 'Audit log created');
        } catch (error: any) {
            // CRITICAL: Audit logging failure should be logged but not block operations
            logger.error({
                correlationId: entry.correlationId,
                error: error.message,
                entry
            }, 'CRITICAL: Audit log creation failed');
        }
    }

    /**
     * Log dataset creation
     */
    static async logDatasetCreated(
        tenantId: string,
        userId: string,
        datasetId: string,
        metadata: any,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: 'dataset.created',
            entityType: 'Dataset',
            entityId: datasetId,
            diffJson: { metadata },
            correlationId
        });
    }

    /**
     * Log dataset version creation
     */
    static async logDatasetVersionCreated(
        tenantId: string,
        userId: string,
        datasetId: string,
        versionId: string,
        source: string,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: 'dataset_version.created',
            entityType: 'DatasetVersion',
            entityId: versionId,
            diffJson: { datasetId, source },
            correlationId
        });
    }

    /**
     * Log dataset rollback
     */
    static async logDatasetRollback(
        tenantId: string,
        userId: string,
        datasetId: string,
        fromVersionId: string,
        toVersionId: string,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: 'dataset.rollback',
            entityType: 'Dataset',
            entityId: datasetId,
            diffJson: { fromVersionId, toVersionId },
            correlationId
        });
    }

    /**
     * Log recipe application
     */
    static async logRecipeApplied(
        tenantId: string,
        userId: string,
        recipeId: string,
        datasetId: string,
        approved: boolean,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: 'recipe.applied',
            entityType: 'Recipe',
            entityId: recipeId,
            diffJson: { datasetId, approved },
            correlationId
        });
    }

    /**
     * Log recipe approval/denial
     */
    static async logRecipeApproval(
        tenantId: string,
        userId: string,
        recipeId: string,
        approved: boolean,
        reason?: string,
        correlationId?: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: approved ? 'recipe.approved' : 'recipe.denied',
            entityType: 'Recipe',
            entityId: recipeId,
            diffJson: { approved, reason },
            correlationId
        });
    }

    /**
     * Log user creation
     */
    static async logUserCreated(
        tenantId: string,
        actorUserId: string,
        newUserId: string,
        email: string,
        role: string,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId,
            action: 'user.created',
            entityType: 'User',
            entityId: newUserId,
            diffJson: { email, role },
            correlationId
        });
    }

    /**
     * Log user role change
     */
    static async logUserRoleChanged(
        tenantId: string,
        actorUserId: string,
        targetUserId: string,
        oldRole: string,
        newRole: string,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId,
            action: 'user.role_changed',
            entityType: 'User',
            entityId: targetUserId,
            diffJson: { oldRole, newRole },
            correlationId
        });
    }

    /**
     * Log user suspension
     */
    static async logUserSuspended(
        tenantId: string,
        actorUserId: string,
        targetUserId: string,
        reason: string,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId,
            action: 'user.suspended',
            entityType: 'User',
            entityId: targetUserId,
            diffJson: { reason },
            correlationId
        });
    }

    /**
     * Log feature flag change
     */
    static async logFeatureFlagChanged(
        tenantId: string,
        actorUserId: string,
        featureName: string,
        oldValue: boolean,
        newValue: boolean,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId,
            action: 'feature_flag.changed',
            entityType: 'FeatureFlag',
            entityId: featureName,
            diffJson: { oldValue, newValue },
            correlationId
        });
    }

    /**
     * Log quota change
     */
    static async logQuotaChanged(
        tenantId: string,
        actorUserId: string,
        quotaType: string,
        oldValue: number,
        newValue: number,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId,
            action: 'quota.changed',
            entityType: 'Quota',
            entityId: quotaType,
            diffJson: { oldValue, newValue },
            correlationId
        });
    }

    /**
     * Log API key creation
     */
    static async logApiKeyCreated(
        tenantId: string,
        userId: string,
        keyId: string,
        name: string,
        scopes: string[],
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: 'api_key.created',
            entityType: 'ApiKey',
            entityId: keyId,
            diffJson: { name, scopes },
            correlationId
        });
    }

    /**
     * Log API key revocation
     */
    static async logApiKeyRevoked(
        tenantId: string,
        userId: string,
        keyId: string,
        reason: string,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: 'api_key.revoked',
            entityType: 'ApiKey',
            entityId: keyId,
            diffJson: { reason },
            correlationId
        });
    }

    /**
     * Log job cancellation
     */
    static async logJobCancelled(
        tenantId: string,
        userId: string,
        jobId: string,
        reason: string,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: 'job.cancelled',
            entityType: 'Job',
            entityId: jobId,
            diffJson: { reason },
            correlationId
        });
    }

    /**
     * Log job retry
     */
    static async logJobRetried(
        tenantId: string,
        userId: string,
        jobId: string,
        correlationId: string
    ): Promise<void> {
        await this.log({
            tenantId,
            actorUserId: userId,
            action: 'job.retried',
            entityType: 'Job',
            entityId: jobId,
            diffJson: {},
            correlationId
        });
    }
}
