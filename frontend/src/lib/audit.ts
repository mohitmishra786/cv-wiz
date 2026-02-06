/**
 * Audit Logging Utilities
 * Provides comprehensive audit logging for data modifications
 */

import { prisma } from './prisma';
import { logger } from './logger';
import type { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'VIEW'
    | 'EXPORT'
    | 'IMPORT'
    | 'SHARE'
    | 'REGISTER'
    | 'PASSWORD_CHANGE'
    | 'PASSWORD_RESET'
    | 'SETTINGS_UPDATE';

export type EntityType =
    | 'User'
    | 'Experience'
    | 'Skill'
    | 'Education'
    | 'Project'
    | 'Publication'
    | 'CoverLetter'
    | 'UserSettings'
    | 'Feedback'
    | 'Profile';

export interface AuditLogData {
    userId?: string;
    action: AuditAction;
    entityType: EntityType;
    entityId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Core Audit Functions
// ============================================================================

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                oldValues: data.oldValues ? JSON.parse(JSON.stringify(data.oldValues)) : null,
                newValues: data.newValues ? JSON.parse(JSON.stringify(data.newValues)) : null,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                requestId: data.requestId,
                metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
            },
        });
    } catch (error) {
        // Silently fail - audit logs are not critical
        logger.warn('[Audit] Failed to create audit log', { error });
    }
}

/**
 * Create audit log from request context
 */
export async function auditFromRequest(
    request: NextRequest,
    data: Omit<AuditLogData, 'ipAddress' | 'userAgent' | 'requestId'>
): Promise<void> {
    const headers = request.headers;

    await createAuditLog({
        ...data,
        ipAddress: getClientIp(request),
        userAgent: headers.get('user-agent') || undefined,
        requestId: headers.get('x-request-id') || undefined,
    });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string | undefined {
    const headers = request.headers;

    // Check for forwarded headers (when behind proxy)
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to socket remote address
    // Note: In Next.js edge runtime, this might not be available
    return undefined;
}

/**
 * Sanitize sensitive data before logging
 * Removes passwords, tokens, and other sensitive information
 */
export function sanitizeForAudit(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
        'password',
        'passwordHash',
        'token',
        'accessToken',
        'refreshToken',
        'secret',
        'apiKey',
        'creditCard',
        'ssn',
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // Check if field is sensitive
        if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeForAudit(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Calculate diff between old and new values
 * Returns only changed fields
 */
export function calculateDiff(
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
): { oldValues: Record<string, unknown>; newValues: Record<string, unknown> } {
    const changedOld: Record<string, unknown> = {};
    const changedNew: Record<string, unknown> = {};

    // Check for changed and added fields
    for (const key of Object.keys(newValues)) {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
            changedOld[key] = oldValues[key];
            changedNew[key] = newValues[key];
        }
    }

    // Check for removed fields
    for (const key of Object.keys(oldValues)) {
        if (!(key in newValues)) {
            changedOld[key] = oldValues[key];
            changedNew[key] = undefined;
        }
    }

    return { oldValues: changedOld, newValues: changedNew };
}

// ============================================================================
// Audit Middleware Helpers
// ============================================================================

/**
 * Audit log for entity creation
 */
export async function auditCreate(
    request: NextRequest,
    userId: string | undefined,
    entityType: EntityType,
    entityId: string,
    newValues: Record<string, unknown>,
    metadata?: Record<string, unknown>
): Promise<void> {
    await auditFromRequest(request, {
        userId,
        action: 'CREATE',
        entityType,
        entityId,
        newValues: sanitizeForAudit(newValues),
        metadata,
    });
}

/**
 * Audit log for entity update
 */
export async function auditUpdate(
    request: NextRequest,
    userId: string | undefined,
    entityType: EntityType,
    entityId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    metadata?: Record<string, unknown>
): Promise<void> {
    const diff = calculateDiff(oldValues, newValues);

    await auditFromRequest(request, {
        userId,
        action: 'UPDATE',
        entityType,
        entityId,
        oldValues: sanitizeForAudit(diff.oldValues),
        newValues: sanitizeForAudit(diff.newValues),
        metadata,
    });
}

/**
 * Audit log for entity deletion
 */
export async function auditDelete(
    request: NextRequest,
    userId: string | undefined,
    entityType: EntityType,
    entityId: string,
    oldValues: Record<string, unknown>,
    metadata?: Record<string, unknown>
): Promise<void> {
    await auditFromRequest(request, {
        userId,
        action: 'DELETE',
        entityType,
        entityId,
        oldValues: sanitizeForAudit(oldValues),
        metadata,
    });
}

/**
 * Audit log for authentication events
 */
export async function auditAuth(
    request: NextRequest,
    action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET',
    userId?: string,
    success: boolean = true,
    metadata?: Record<string, unknown>
): Promise<void> {
    await auditFromRequest(request, {
        userId,
        action,
        entityType: 'User',
        entityId: userId,
        metadata: {
            ...metadata,
            success,
        },
    });
}

/**
 * Audit log for data export
 */
export async function auditExport(
    request: NextRequest,
    userId: string,
    entityType: EntityType,
    format: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    await auditFromRequest(request, {
        userId,
        action: 'EXPORT',
        entityType,
        metadata: {
            ...metadata,
            format,
        },
    });
}

/**
 * Audit log for data import
 */
export async function auditImport(
    request: NextRequest,
    userId: string,
    entityType: EntityType,
    source: string,
    recordCount: number,
    metadata?: Record<string, unknown>
): Promise<void> {
    await auditFromRequest(request, {
        userId,
        action: 'IMPORT',
        entityType,
        metadata: {
            ...metadata,
            source,
            recordCount,
        },
    });
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
    entityType: EntityType,
    entityId: string,
    options: {
        limit?: number;
        offset?: number;
        actions?: AuditAction[];
    } = {}
) {
    const { limit = 50, offset = 0, actions } = options;

    const where: Prisma.AuditLogWhereInput = {
        entityType,
        entityId,
    };

    if (actions?.length) {
        where.action = { in: actions };
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
    userId: string,
    options: {
        limit?: number;
        offset?: number;
        actions?: AuditAction[];
        startDate?: Date;
        endDate?: Date;
    } = {}
) {
    const { limit = 50, offset = 0, actions, startDate, endDate } = options;

    const where: Prisma.AuditLogWhereInput = {
        userId,
    };

    if (actions?.length) {
        where.action = { in: actions };
    }

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(
    options: {
        limit?: number;
        actions?: AuditAction[];
        entityTypes?: EntityType[];
    } = {}
) {
    const { limit = 100, actions, entityTypes } = options;

    const where: Prisma.AuditLogWhereInput = {};

    if (actions?.length) {
        where.action = { in: actions };
    }

    if (entityTypes?.length) {
        where.entityType = { in: entityTypes };
    }

    return prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

/**
 * Get audit statistics
 */
export async function getAuditStats(
    startDate?: Date,
    endDate?: Date
) {
    const where: Prisma.AuditLogWhereInput = {};

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const [totalCount, actionCounts, entityTypeCounts] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
            by: ['action'],
            where,
            _count: { action: true },
        }),
        prisma.auditLog.groupBy({
            by: ['entityType'],
            where,
            _count: { entityType: true },
        }),
    ]);

    return {
        totalCount,
        actionCounts: actionCounts.map(c => ({
            action: c.action,
            count: c._count.action,
        })),
        entityTypeCounts: entityTypeCounts.map(c => ({
            entityType: c.entityType,
            count: c._count.entityType,
        })),
    };
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean up old audit logs
 * Retains logs for the specified number of days
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    return result.count;
}

/**
 * Archive old audit logs (export before delete)
 * Returns the archived records for external storage
 */
export async function archiveOldAuditLogs(retentionDays: number = 365): Promise<unknown[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Get old logs
    const oldLogs = await prisma.auditLog.findMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    // Delete them
    await prisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    return oldLogs;
}
