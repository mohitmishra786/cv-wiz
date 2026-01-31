/**
 * Cover Letter API Route
 * GET /api/profile/cover-letter - Get all cover letters
 * POST /api/profile/cover-letter - Create a new cover letter
 * DELETE /api/profile/cover-letter - Delete a cover letter
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';
import { sanitizeCoverLetterData } from '@/lib/sanitization';

/**
 * GET /api/profile/cover-letter
 * Returns all cover letters for the authenticated user
 */
export async function GET(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('cover-letter:get');

    try {
        logger.info('Authenticating user for cover letter fetch', { requestId });
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Cover letter fetch failed - no session', { requestId });
            logAuthOperation('cover-letter:get:unauthorized', undefined, false);
            return NextResponse.json(
                { error: 'Unauthorized', requestId },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        logger.info('User authenticated', { requestId, userId });
        logAuthOperation('cover-letter:get:authenticated', userId, true);

        // Fetch cover letters
        logger.info('Fetching cover letters from database', { requestId, userId });
        logDbOperation('findMany', 'CoverLetter', { userId });

        const coverLetters = await prisma.coverLetter.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        logger.info('Cover letters fetched successfully', {
            requestId,
            userId,
            count: coverLetters.length,
        });

        logger.endOperation('cover-letter:get');

        return NextResponse.json({ coverLetters, requestId });
    } catch (error) {
        logger.failOperation('cover-letter:get', error);
        logger.error('Cover letter GET error details', {
            requestId,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                requestId,
                debug: process.env.NODE_ENV !== 'production' ? {
                    message: error instanceof Error ? error.message : String(error),
                } : undefined
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/profile/cover-letter
 * Create a new cover letter
 */
export async function POST(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('cover-letter:create');

    try {
        logger.info('Authenticating user for cover letter creation', { requestId });
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Cover letter creation failed - no session', { requestId });
            logAuthOperation('cover-letter:create:unauthorized', undefined, false);
            return NextResponse.json(
                { error: 'Unauthorized', requestId },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        logger.info('User authenticated for creation', { requestId, userId });
        logAuthOperation('cover-letter:create:authenticated', userId, true);

        const body = await request.json();

        // Sanitize input data
        const sanitizedData = sanitizeCoverLetterData(body);
        logger.debug('Cover letter creation request body', {
            requestId,
            userId,
            hasContent: 'content' in sanitizedData,
            contentLength: sanitizedData.content?.length,
            hasJobTitle: 'jobTitle' in sanitizedData,
            hasCompanyName: 'companyName' in sanitizedData,
        });

        const { content, jobTitle, companyName } = sanitizedData;

        if (!content || typeof content !== 'string' || !content.trim()) {
            logger.warn('Cover letter creation failed - no content', { requestId, userId });
            return NextResponse.json(
                { error: 'Content is required', requestId },
                { status: 400 }
            );
        }

        // Create cover letter
        logger.info('Creating cover letter in database', { requestId, userId });
        logDbOperation('create', 'CoverLetter', { userId, contentLength: content.length });

        const coverLetter = await prisma.coverLetter.create({
            data: {
                userId,
                content: content.trim(),
                jobTitle: jobTitle?.trim() || null,
                companyName: companyName?.trim() || null,
            },
        });

        logger.info('Cover letter created successfully', {
            requestId,
            userId,
            coverLetterId: coverLetter.id,
        });

        logger.endOperation('cover-letter:create');

        return NextResponse.json({ coverLetter, requestId });
    } catch (error) {
        logger.failOperation('cover-letter:create', error);
        logger.error('Cover letter POST error details', {
            requestId,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                requestId,
                debug: process.env.NODE_ENV !== 'production' ? {
                    message: error instanceof Error ? error.message : String(error),
                } : undefined
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/profile/cover-letter
 * Delete a cover letter by ID
 */
export async function DELETE(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('cover-letter:delete');

    try {
        logger.info('Authenticating user for cover letter deletion', { requestId });
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Cover letter deletion failed - no session', { requestId });
            logAuthOperation('cover-letter:delete:unauthorized', undefined, false);
            return NextResponse.json(
                { error: 'Unauthorized', requestId },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        logger.info('User authenticated for deletion', { requestId, userId });
        logAuthOperation('cover-letter:delete:authenticated', userId, true);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            logger.warn('Cover letter deletion failed - no ID', { requestId, userId });
            return NextResponse.json(
                { error: 'Cover letter ID is required', requestId },
                { status: 400 }
            );
        }

        // Verify ownership and delete
        logger.info('Deleting cover letter from database', { requestId, userId, coverLetterId: id });
        logDbOperation('delete', 'CoverLetter', { userId, id });

        const deleted = await prisma.coverLetter.deleteMany({
            where: {
                id,
                userId, // Ensure user owns this cover letter
            },
        });

        if (deleted.count === 0) {
            logger.warn('Cover letter not found or not owned by user', { requestId, userId, coverLetterId: id });
            return NextResponse.json(
                { error: 'Cover letter not found', requestId },
                { status: 404 }
            );
        }

        logger.info('Cover letter deleted successfully', {
            requestId,
            userId,
            coverLetterId: id,
        });

        logger.endOperation('cover-letter:delete');

        return NextResponse.json({ success: true, requestId });
    } catch (error) {
        logger.failOperation('cover-letter:delete', error);
        logger.error('Cover letter DELETE error details', {
            requestId,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                requestId,
                debug: process.env.NODE_ENV !== 'production' ? {
                    message: error instanceof Error ? error.message : String(error),
                } : undefined
            },
            { status: 500 }
        );
    }
}
