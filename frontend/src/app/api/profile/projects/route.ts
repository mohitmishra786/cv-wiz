/**
 * Projects API Routes
 * CRUD operations for projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';

export async function GET(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('projects:list');

    try {
        logger.info('Authenticating user for projects list', { requestId });
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Projects list failed - no session');
            logAuthOperation('projects:list:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        logger.info('Fetching projects', { requestId, userId });
        logDbOperation('findMany', 'Project', { userId });

        const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { order: 'asc' },
        });

        logger.info('Projects fetched successfully', {
            requestId,
            userId,
            count: projects.length,
        });

        logger.endOperation('projects:list');
        return NextResponse.json({ data: projects, requestId });
    } catch (error) {
        logger.failOperation('projects:list', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('projects:create');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Project create failed - no session');
            logAuthOperation('projects:create:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { name, description, url, startDate, endDate, technologies, highlights } = body;

        logger.info('Creating project', {
            requestId,
            userId,
            name: name || 'missing',
            hasTechnologies: !!technologies?.length,
        });

        if (!name || !description) {
            logger.warn('Project create validation failed', {
                requestId,
                userId,
                missingFields: [!name && 'name', !description && 'description'].filter(Boolean),
            });
            return NextResponse.json(
                { error: 'Name and description are required', requestId },
                { status: 400 }
            );
        }

        logDbOperation('create', 'Project', { userId, name });

        const project = await prisma.project.create({
            data: {
                userId,
                name,
                description,
                url: url || null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                technologies: technologies || [],
                highlights: highlights || [],
            },
        });

        logger.info('Project created successfully', {
            requestId,
            userId,
            projectId: project.id,
            name: project.name,
        });

        logger.endOperation('projects:create');
        return NextResponse.json({ data: project, requestId }, { status: 201 });
    } catch (error) {
        logger.failOperation('projects:create', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('projects:update');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Project update failed - no session');
            logAuthOperation('projects:update:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            logger.warn('Project update failed - no ID', { requestId, userId });
            return NextResponse.json({ error: 'Project ID is required', requestId }, { status: 400 });
        }

        logger.info('Verifying project ownership', { requestId, userId, projectId: id });
        logDbOperation('findFirst', 'Project', { userId, id });

        const existing = await prisma.project.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            logger.warn('Project not found or not owned', { requestId, userId, projectId: id });
            return NextResponse.json({ error: 'Project not found', requestId }, { status: 404 });
        }

        logger.info('Updating project', {
            requestId,
            userId,
            projectId: id,
            fields: Object.keys(data),
        });
        logDbOperation('update', 'Project', { userId, id, fields: Object.keys(data) });

        const project = await prisma.project.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description && { description: data.description }),
                ...(data.url !== undefined && { url: data.url }),
                ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
                ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
                ...(data.technologies && { technologies: data.technologies }),
                ...(data.highlights && { highlights: data.highlights }),
            },
        });

        logger.info('Project updated successfully', { requestId, userId, projectId: id });
        logger.endOperation('projects:update');
        return NextResponse.json({ data: project, requestId });
    } catch (error) {
        logger.failOperation('projects:update', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('projects:delete');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Project delete failed - no session');
            logAuthOperation('projects:delete:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            logger.warn('Project delete failed - no ID', { requestId, userId });
            return NextResponse.json({ error: 'Project ID is required', requestId }, { status: 400 });
        }

        logger.info('Verifying project ownership for delete', { requestId, userId, projectId: id });
        logDbOperation('findFirst', 'Project', { userId, id });

        const existing = await prisma.project.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            logger.warn('Project not found or not owned for delete', { requestId, userId, projectId: id });
            return NextResponse.json({ error: 'Project not found', requestId }, { status: 404 });
        }

        logger.info('Deleting project', { requestId, userId, projectId: id });
        logDbOperation('delete', 'Project', { userId, id });

        await prisma.project.delete({ where: { id } });

        logger.info('Project deleted successfully', { requestId, userId, projectId: id });
        logger.endOperation('projects:delete');

        return NextResponse.json({ message: 'Project deleted', requestId });
    } catch (error) {
        logger.failOperation('projects:delete', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}
