/**
 * Education API Routes
 * CRUD operations for education entries with pagination and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import prisma from '@/lib/prisma';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';
import { parsePaginationParams, createPaginatedResponse, calculateSkip } from '@/lib/pagination';

export async function GET(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('educations:list');

    try {
        logger.info('Authenticating user for educations list');
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Educations list failed - no session');
            logAuthOperation('educations:list:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        
        // Parse pagination parameters
        const { searchParams } = new URL(request.url);
        const pagination = parsePaginationParams(searchParams);
        const skip = calculateSkip(pagination.page, pagination.limit);
        
        logger.info('Fetching educations with pagination', {
            requestId,
            userId,
            page: pagination.page,
            limit: pagination.limit,
            search: pagination.search
        });
        
        // Build where clause with search
        const where: { userId: string; OR?: Array<{ [key: string]: { contains: string; mode: 'insensitive' } }> } = { userId };
        if (pagination.search) {
            where.OR = [
                { institution: { contains: pagination.search, mode: 'insensitive' } },
                { degree: { contains: pagination.search, mode: 'insensitive' } },
                { field: { contains: pagination.search, mode: 'insensitive' } },
            ];
        }
        
        logDbOperation('findMany', 'Education', { userId, ...pagination });
        
        // Get total count for pagination
        const total = await prisma.education.count({ where });
        
        // Fetch paginated educations
        const educations = await prisma.education.findMany({
            where,
            orderBy: { startDate: 'desc' },
            skip,
            take: pagination.limit,
        });

        logger.info('Educations fetched successfully', {
            requestId,
            userId,
            count: educations.length,
            total,
            degrees: educations.map(e => e.degree),
        });

        logger.endOperation('educations:list');
        
        const response = createPaginatedResponse(educations, total, pagination);
        return NextResponse.json({ ...response, requestId });
    } catch (error) {
        logger.failOperation('educations:list', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('educations:create');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Education create failed - no session');
            logAuthOperation('educations:create:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { institution, degree, field, startDate, endDate, gpa, honors } = body;

        logger.info('Creating education', {
            requestId,
            userId,
            institution: institution || 'missing',
            degree: degree || 'missing',
            field: field || 'missing',
        });

        if (!institution || !degree || !field || !startDate) {
            logger.warn('Education create validation  failed', {
                requestId,
                userId,
                missingFields: [
                    !institution && 'institution',
                    !degree && 'degree',
                    !field && 'field',
                    !startDate && 'startDate',
                ].filter(Boolean),
            });
            return NextResponse.json(
                { error: 'Institution, degree, field, and start date are required', requestId },
                { status: 400 }
            );
        }

        logDbOperation('create', 'Education', { userId, institution, degree, field });

        const education = await prisma.education.create({
            data: {
                userId,
                institution,
                degree,
                field,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                gpa: gpa || null,
                honors: honors || [],
            },
        });

        logger.info('Education created successfully', {
            requestId,
            userId,
            educationId: education.id,
            institution: education.institution,
            degree: education.degree,
        });

        logger.endOperation('educations:create');
        return NextResponse.json({ data: education, requestId }, { status: 201 });
    } catch (error) {
        logger.failOperation('educations:create', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('educations:update');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Education update failed - no session');
            logAuthOperation('educations:update:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            logger.warn('Education update failed - no ID', { requestId, userId });
            return NextResponse.json({ error: 'Education ID is required', requestId }, { status: 400 });
        }

        logger.info('Verifying education ownership', { requestId, userId, educationId: id });
        logDbOperation('findFirst', 'Education', { userId, id });

        const existing = await prisma.education.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            logger.warn('Education not found or not owned', { requestId, userId, educationId: id });
            return NextResponse.json({ error: 'Education not found', requestId }, { status: 404 });
        }

        logger.info('Updating education', {
            requestId,
            userId,
            educationId: id,
            fields: Object.keys(data),
        });
        logDbOperation('update', 'Education', { userId, id, fields: Object.keys(data) });

        const education = await prisma.education.update({
            where: { id },
            data: {
                ...(data.institution && { institution: data.institution }),
                ...(data.degree && { degree: data.degree }),
                ...(data.field && { field: data.field }),
                ...(data.startDate && { startDate: new Date(data.startDate) }),
                ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
                ...(data.gpa !== undefined && { gpa: data.gpa }),
                ...(data.honors && { honors: data.honors }),
            },
        });

        logger.info('Education updated successfully', { requestId, userId, educationId: id });
        logger.endOperation('educations:update');
        return NextResponse.json({ data: education, requestId });
    } catch (error) {
        logger.failOperation('educations:update', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('educations:delete');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Education delete failed - no session');
            logAuthOperation('educations:delete:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            logger.warn('Education delete failed - no ID', { requestId, userId });
            return NextResponse.json({ error: 'Education ID is required', requestId }, { status: 400 });
        }

        logger.info('Verifying education ownership for delete', { requestId, userId, educationId: id });
        logDbOperation('findFirst', 'Education', { userId, id });

        const existing = await prisma.education.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            logger.warn('Education not found or not owned for delete', { requestId, userId, educationId: id });
            return NextResponse.json({ error: 'Education not found', requestId }, { status: 404 });
        }

        logger.info('Deleting education', { requestId, userId, educationId: id, institution: existing.institution });
        logDbOperation('delete', 'Education', { userId, id });

        await prisma.education.delete({ where: { id } });

        logger.info('Education deleted successfully', { requestId, userId, educationId: id });
        logger.endOperation('educations:delete');

        return NextResponse.json({ message: 'Education deleted', requestId });
    } catch (error) {
        logger.failOperation('educations:delete', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}
