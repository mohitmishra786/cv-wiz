/**
 * Experiences API Routes
 * CRUD operations for work experiences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';

/**
 * GET /api/profile/experiences
 */
export async function GET(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('experiences:list');

    try {
        logger.info('Authenticating user for experiences list', { requestId });
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Experiences list failed - no session', { requestId });
            logAuthOperation('experiences:list:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        logger.info('Fetching experiences', { requestId, userId });
        logDbOperation('findMany', 'Experience', { userId });

        const experiences = await prisma.experience.findMany({
            where: { userId },
            orderBy: [{ current: 'desc' }, { startDate: 'desc' }],
        });

        logger.info('Experiences fetched successfully', {
            requestId,
            userId,
            count: experiences.length,
            currentCount: experiences.filter(e => e.current).length,
        });

        logger.endOperation('experiences:list');
        return NextResponse.json({ data: experiences, requestId });
    } catch (error) {
        logger.failOperation('experiences:list', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

/**
 * POST /api/profile/experiences
 */
export async function POST(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('experiences:create');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Experience create failed - no session', { requestId });
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { company, title, location, startDate, endDate, current, description, highlights, keywords } = body;

        logger.info('Creating experience', {
            requestId,
            userId,
            company: company || 'missing',
            title: title || 'missing',
            current: !!current,
        });

        // Validate required fields
        if (!company || !title || !startDate || !description) {
            logger.warn('Experience create validation failed', {
                requestId,
                userId,
                missingFields: [
                    !company && 'company',
                    !title && 'title',
                    !startDate && 'startDate',
                    !description && 'description',
                ].filter(Boolean),
            });
            return NextResponse.json(
                { error: 'Company, title, start date, and description are required', requestId },
                { status: 400 }
            );
        }

        logDbOperation('create', 'Experience', { userId, company, title });

        const experience = await prisma.experience.create({
            data: {
                userId,
                company,
                title,
                location: location || null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                current: current || false,
                description,
                highlights: highlights || [],
                keywords: keywords || [],
            },
        });

        logger.info('Experience created successfully', {
            requestId,
            userId,
            experienceId: experience.id,
            company: experience.company,
        });

        logger.endOperation('experiences:create');
        return NextResponse.json({ data: experience, requestId }, { status: 201 });
    } catch (error) {
        logger.failOperation('experiences:create', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

/**
 * PUT /api/profile/experiences
 */
export async function PUT(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('experiences:update');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Experience update failed - no session', { requestId });
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            logger.warn('Experience update failed - no ID', { requestId, userId });
            return NextResponse.json({ error: 'Experience ID is required', requestId }, { status: 400 });
        }

        logger.info('Verifying experience ownership', { requestId, userId, experienceId: id });
        logDbOperation('findFirst', 'Experience', { userId, id });

        const existing = await prisma.experience.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            logger.warn('Experience not found or not owned', { requestId, userId, experienceId: id });
            return NextResponse.json({ error: 'Experience not found', requestId }, { status: 404 });
        }

        logger.info('Updating experience', {
            requestId,
            userId,
            experienceId: id,
            fields: Object.keys(data),
        });
        logDbOperation('update', 'Experience', { userId, id, fields: Object.keys(data) });

        const experience = await prisma.experience.update({
            where: { id },
            data: {
                ...(data.company && { company: data.company }),
                ...(data.title && { title: data.title }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.startDate && { startDate: new Date(data.startDate) }),
                ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
                ...(data.current !== undefined && { current: data.current }),
                ...(data.description && { description: data.description }),
                ...(data.highlights && { highlights: data.highlights }),
                ...(data.keywords && { keywords: data.keywords }),
            },
        });

        logger.info('Experience updated successfully', {
            requestId,
            userId,
            experienceId: id,
        });

        logger.endOperation('experiences:update');
        return NextResponse.json({ data: experience, requestId });
    } catch (error) {
        logger.failOperation('experiences:update', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

/**
 * DELETE /api/profile/experiences
 */
export async function DELETE(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('experiences:delete');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Experience delete failed - no session', { requestId });
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            logger.warn('Experience delete failed - no ID', { requestId, userId });
            return NextResponse.json({ error: 'Experience ID is required', requestId }, { status: 400 });
        }

        logger.info('Verifying experience ownership for delete', { requestId, userId, experienceId: id });
        logDbOperation('findFirst', 'Experience', { userId, id });

        const existing = await prisma.experience.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            logger.warn('Experience not found or not owned for delete', { requestId, userId, experienceId: id });
            return NextResponse.json({ error: 'Experience not found', requestId }, { status: 404 });
        }

        logger.info('Deleting experience', { requestId, userId, experienceId: id });
        logDbOperation('delete', 'Experience', { userId, id });

        await prisma.experience.delete({ where: { id } });

        logger.info('Experience deleted successfully', { requestId, userId, experienceId: id });
        logger.endOperation('experiences:delete');

        return NextResponse.json({ message: 'Experience deleted', requestId });
    } catch (error) {
        logger.failOperation('experiences:delete', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}
