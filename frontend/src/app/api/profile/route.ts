/**
 * Profile API Routes
 * GET /api/profile - Get current user's profile
 * PUT /api/profile - Update profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';
import { sanitizeProfileData } from '@/lib/sanitization';

function sanitizeError(error: unknown): { message: string; code: string } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string }).code || 'UNKNOWN_ERROR';

    const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /api[_-]?key/i,
        /credential/i,
        /connection string/i,
        /database/i,
        /prisma/i,
        /at\s+.*\.ts:?\d*/,
        /\/[a-zA-Z0-9_/-]+\.(ts|js):\d+:\d+/,
    ];

    if (sensitivePatterns.some(pattern => pattern.test(errorMessage))) {
        return { message: 'An internal error occurred', code: errorCode };
    }

    return { message: 'An internal error occurred', code: errorCode };
}

/**
 * GET /api/profile
 * Returns the complete profile for the authenticated user
 */
export async function GET(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('profile:get');

    try {
        logger.info('Authenticating user for profile fetch', { requestId });
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Profile fetch failed - no session', { requestId });
            logAuthOperation('profile:get:unauthorized', undefined, false);
            return NextResponse.json(
                { error: 'Unauthorized', requestId },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        logger.info('User authenticated', { requestId, userId });
        logAuthOperation('profile:get:authenticated', userId, true);

        // Fetch complete profile with all relations
        logger.info('Fetching profile from database', { requestId, userId });
        logDbOperation('findUnique', 'User', { userId, includeRelations: true });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                experiences: {
                    orderBy: [{ current: 'desc' }, { startDate: 'desc' }],
                },
                projects: {
                    orderBy: { order: 'asc' },
                },
                educations: {
                    orderBy: { startDate: 'desc' },
                },
                skills: {
                    orderBy: [{ category: 'asc' }, { order: 'asc' }],
                },
                publications: {
                    orderBy: { date: 'desc' },
                },
                settings: true,
            },
        });

        if (!user) {
            logger.error('User not found in database', { requestId, userId });
            return NextResponse.json(
                { error: 'User not found', requestId },
                { status: 404 }
            );
        }

        logger.info('Profile fetched successfully', {
            requestId,
            userId,
            experiencesCount: user.experiences.length,
            projectsCount: user.projects.length,
            educationsCount: user.educations.length,
            skillsCount: user.skills.length,
            publicationsCount: user.publications.length,
            hasSettings: !!user.settings,
        });

        // Transform to API response format
        const profile = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            experiences: user.experiences,
            projects: user.projects,
            educations: user.educations,
            skills: user.skills,
            publications: user.publications,
            settings: user.settings,
        };

        logger.endOperation('profile:get');

        return NextResponse.json({ ...profile, requestId });
    } catch (error) {
        logger.failOperation('profile:get', error);
        logger.error('Profile GET error occurred', { requestId });

        const sanitized = sanitizeError(error);

        return NextResponse.json(
            {
                error: sanitized.message,
                code: sanitized.code,
                requestId,
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/profile
 * Update user profile fields
 */
export async function PUT(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('profile:update');

    try {
        logger.info('Authenticating user for profile update', { requestId });
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Profile update failed - no session', { requestId });
            logAuthOperation('profile:update:unauthorized', undefined, false);
            return NextResponse.json(
                { error: 'Unauthorized', requestId },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        logger.info('User authenticated for update', { requestId, userId });
        logAuthOperation('profile:update:authenticated', userId, true);

        const body = await request.json();
        logger.debug('Profile update request body', {
            requestId,
            userId,
            fields: Object.keys(body),
            hasName: 'name' in body,
            hasImage: 'image' in body,
        });

        // Sanitize input data
        const sanitizedData = sanitizeProfileData(body);
        logger.debug('Profile data sanitized', { requestId, userId });

        // Extract updateable fields
        const { name, image } = sanitizedData;

        // Update user
        logger.info('Updating user in database', { requestId, userId, fields: { name: !!name, image: !!image } });
        logDbOperation('update', 'User', { userId, fields: Object.keys(body) });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name !== undefined && { name }),
                ...(image !== undefined && { image }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                updatedAt: true,
            },
        });

        logger.info('Profile updated successfully', {
            requestId,
            userId,
            updatedFields: Object.keys(body),
        });

        logger.endOperation('profile:update');

        return NextResponse.json({ ...updatedUser, requestId });
    } catch (error) {
        logger.failOperation('profile:update', error);
        logger.error('Profile PUT error occurred', { requestId });

        const sanitized = sanitizeError(error);

        return NextResponse.json(
            {
                error: sanitized.message,
                code: sanitized.code,
                requestId,
            },
            { status: 500 }
        );
    }
}
