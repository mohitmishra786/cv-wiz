/**
 * Audit Log API Routes
 * GET /api/audit - Get audit logs (admin only)
 * For compliance and security monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
    getUserAuditLogs, 
    getRecentAuditLogs, 
    getAuditStats,
    cleanupOldAuditLogs,
    type AuditAction,
    type EntityType,
} from '@/lib/audit';
import { createRequestLogger, getOrCreateRequestId } from '@/lib/logger';

// Admin check - verifies user has admin role
async function isAdmin(userId: string): Promise<boolean> {
    // Check user role in database
    const { default: prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    
    return user?.role === 'ADMIN';
}

/**
 * GET /api/audit
 * Query params:
 * - userId: Filter by user (optional)
 * - entityType: Filter by entity type (optional)
 * - entityId: Filter by entity ID (optional)
 * - actions: Comma-separated list of actions (optional)
 * - limit: Number of records to return (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - startDate: Start date filter (ISO format)
 * - endDate: End date filter (ISO format)
 * - stats: If 'true', return statistics instead of logs
 */
export async function GET(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('audit:get');

    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            logger.warn('Audit fetch failed - no session', { requestId });
            return NextResponse.json(
                { error: 'Unauthorized', requestId },
                { status: 401 }
            );
        }

        const currentUserId = session.user.id;

        // Check admin access
        const admin = await isAdmin(currentUserId);
        if (!admin) {
            logger.warn('Audit fetch failed - not admin', { requestId, userId: currentUserId });
            return NextResponse.json(
                { error: 'Forbidden - Admin access required', requestId },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);

        // Check if stats requested
        if (searchParams.get('stats') === 'true') {
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            logger.info('Fetching audit statistics', { requestId });

            const stats = await getAuditStats(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined
            );

            logger.endOperation('audit:get');
            return NextResponse.json({ stats, requestId });
        }

        // Parse query parameters
        const userId = searchParams.get('userId') || undefined;
        const entityType = searchParams.get('entityType') as EntityType | undefined;
        const entityId = searchParams.get('entityId') || undefined;
        const actionsParam = searchParams.get('actions');
        const actions = actionsParam ? actionsParam.split(',') as AuditAction[] : undefined;
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        logger.info('Fetching audit logs', {
            requestId,
            userId,
            entityType,
            entityId,
            actions,
            limit,
            offset,
        });

        let logs;
        let total;

        if (userId) {
            // Get logs for specific user
            const result = await getUserAuditLogs(userId, {
                limit,
                offset,
                actions,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });
            logs = result.logs;
            total = result.total;
        } else if (entityType && entityId) {
            // Get logs for specific entity
            const { getEntityAuditLogs } = await import('@/lib/audit');
            const result = await getEntityAuditLogs(entityType, entityId, {
                limit,
                offset,
                actions,
            });
            logs = result.logs;
            total = result.total;
        } else {
            // Get recent logs
            logs = await getRecentAuditLogs({
                limit,
                actions,
                entityTypes: entityType ? [entityType] : undefined,
            });
            total = logs.length;
        }

        logger.info('Audit logs fetched successfully', {
            requestId,
            count: logs.length,
            total,
        });

        logger.endOperation('audit:get');

        return NextResponse.json({
            logs,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + logs.length < total,
            },
            requestId,
        });
    } catch (error) {
        logger.failOperation('audit:get', error);
        logger.error('Audit GET error details', {
            requestId,
            error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            { error: 'Internal server error', requestId },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/audit
 * Clean up old audit logs (admin only)
 * Query params:
 * - retentionDays: Number of days to retain (default: 365)
 * - dryRun: If 'true', return count without deleting
 */
export async function DELETE(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('audit:cleanup');

    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            logger.warn('Audit cleanup failed - no session', { requestId });
            return NextResponse.json(
                { error: 'Unauthorized', requestId },
                { status: 401 }
            );
        }

        const currentUserId = session.user.id;

        // Check admin access
        const admin = await isAdmin(currentUserId);
        if (!admin) {
            logger.warn('Audit cleanup failed - not admin', { requestId, userId: currentUserId });
            return NextResponse.json(
                { error: 'Forbidden - Admin access required', requestId },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const retentionDays = parseInt(searchParams.get('retentionDays') || '365', 10);
        const dryRun = searchParams.get('dryRun') === 'true';

        logger.info('Cleaning up old audit logs', {
            requestId,
            retentionDays,
            dryRun,
            userId: currentUserId,
        });

        if (dryRun) {
            // In dry run mode, just calculate what would be deleted
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            // Import prisma to count
            const { default: prisma } = await import('@/lib/prisma');
            const count = await prisma.auditLog.count({
                where: {
                    createdAt: {
                        lt: cutoffDate,
                    },
                },
            });

            logger.info('Audit cleanup dry run completed', { requestId, wouldDelete: count });

            return NextResponse.json({
                dryRun: true,
                wouldDelete: count,
                retentionDays,
                cutoffDate: cutoffDate.toISOString(),
                requestId,
            });
        }

        const deletedCount = await cleanupOldAuditLogs(retentionDays);

        logger.info('Audit cleanup completed', { requestId, deletedCount });

        // Log the cleanup action
        const { auditAuth } = await import('@/lib/audit');
        await auditAuth(
            request,
            'LOGIN', // Using LOGIN as a generic admin action
            currentUserId,
            true,
            { action: 'audit_cleanup', deletedCount, retentionDays }
        );

        logger.endOperation('audit:cleanup');

        return NextResponse.json({
            deleted: deletedCount,
            retentionDays,
            requestId,
        });
    } catch (error) {
        logger.failOperation('audit:cleanup', error);
        logger.error('Audit DELETE error details', {
            requestId,
            error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            { error: 'Internal server error', requestId },
            { status: 500 }
        );
    }
}
