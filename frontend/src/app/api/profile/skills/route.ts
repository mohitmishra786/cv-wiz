/**
 * Skills API Routes
 * CRUD operations for skills
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';

export async function GET(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('skills:list');

    try {
        logger.info('Authenticating user for skills list');
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Skills list failed - no session');
            logAuthOperation('skills:list:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        logger.info('Fetching skills', { requestId, userId });
        logDbOperation('findMany', 'Skill', { userId });

        const skills = await prisma.skill.findMany({
            where: { userId },
            orderBy: [{ category: 'asc' }, { order: 'asc' }],
        });

        // Group by category for logging
        const categoryCounts = skills.reduce((acc, skill) => {
            acc[skill.category] = (acc[skill.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        logger.info('Skills fetched successfully', {
            requestId,
            userId,
            totalCount: skills.length,
            categoryCounts,
        });

        logger.endOperation('skills:list');
        return NextResponse.json({ data: skills, requestId });
    } catch (error) {
        logger.failOperation('skills:list', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('skills:create');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Skill create failed - no session');
            logAuthOperation('skills:create:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { name, category, proficiency, yearsExp } = body;

        logger.info('Creating skill', {
            requestId,
            userId,
            name: name || 'missing',
            category: category || 'missing',
            proficiency,
        });

        if (!name || !category) {
            logger.warn('Skill create validation failed', {
                requestId,
                userId,
                missingFields: [!name && 'name', !category && 'category'].filter(Boolean),
            });
            return NextResponse.json(
                { error: 'Name and category are required', requestId },
                { status: 400 }
            );
        }

        // Check for duplicate skill
        logger.debug('Checking for duplicate skill', { requestId, userId, name });
        logDbOperation('findFirst', 'Skill', { userId, name });

        const existing = await prisma.skill.findFirst({
            where: { userId, name },
        });

        if (existing) {
            logger.warn('Skill already exists', { requestId, userId, name, existingId: existing.id });
            return NextResponse.json(
                { error: 'Skill already exists', requestId },
                { status: 409 }
            );
        }

        logDbOperation('create', 'Skill', { userId, name, category });

        const skill = await prisma.skill.create({
            data: {
                userId,
                name,
                category,
                proficiency: proficiency || null,
                yearsExp: yearsExp || null,
            },
        });

        logger.info('Skill created successfully', {
            requestId,
            userId,
            skillId: skill.id,
            name: skill.name,
            category: skill.category,
        });

        logger.endOperation('skills:create');
        return NextResponse.json({ data: skill, requestId }, { status: 201 });
    } catch (error) {
        logger.failOperation('skills:create', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('skills:update');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Skill update failed - no session');
            logAuthOperation('skills:update:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            logger.warn('Skill update failed - no ID', { requestId, userId });
            return NextResponse.json({ error: 'Skill ID is required', requestId }, { status: 400 });
        }

        logger.info('Verifying skill ownership', { requestId, userId, skillId: id });
        logDbOperation('findFirst', 'Skill', { userId, id });

        const existing = await prisma.skill.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            logger.warn('Skill not found or not owned', { requestId, userId, skillId: id });
            return NextResponse.json({ error: 'Skill not found', requestId }, { status: 404 });
        }

        logger.info('Updating skill', {
            requestId,
            userId,
            skillId: id,
            fields: Object.keys(data),
        });
        logDbOperation('update', 'Skill', { userId, id, fields: Object.keys(data) });

        const skill = await prisma.skill.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.category && { category: data.category }),
                ...(data.proficiency !== undefined && { proficiency: data.proficiency }),
                ...(data.yearsExp !== undefined && { yearsExp: data.yearsExp }),
            },
        });

        logger.info('Skill updated successfully', { requestId, userId, skillId: id });
        logger.endOperation('skills:update');
        return NextResponse.json({ data: skill, requestId });
    } catch (error) {
        logger.failOperation('skills:update', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('skills:delete');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Skill delete failed - no session');
            logAuthOperation('skills:delete:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            logger.warn('Skill delete failed - no ID', { requestId, userId });
            return NextResponse.json({ error: 'Skill ID is required', requestId }, { status: 400 });
        }

        logger.info('Verifying skill ownership for delete', { requestId, userId, skillId: id });
        logDbOperation('findFirst', 'Skill', { userId, id });

        const existing = await prisma.skill.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            logger.warn('Skill not found or not owned for delete', { requestId, userId, skillId: id });
            return NextResponse.json({ error: 'Skill not found', requestId }, { status: 404 });
        }

        logger.info('Deleting skill', { requestId, userId, skillId: id, name: existing.name });
        logDbOperation('delete', 'Skill', { userId, id });

        await prisma.skill.delete({ where: { id } });

        logger.info('Skill deleted successfully', { requestId, userId, skillId: id });
        logger.endOperation('skills:delete');

        return NextResponse.json({ message: 'Skill deleted', requestId });
    } catch (error) {
        logger.failOperation('skills:delete', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}
