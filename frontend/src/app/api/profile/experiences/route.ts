/**
 * Experiences API Routes
 * CRUD operations for work experiences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/profile/experiences
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const experiences = await prisma.experience.findMany({
            where: { userId: session.user.id },
            orderBy: [{ current: 'desc' }, { startDate: 'desc' }],
        });

        return NextResponse.json(experiences);
    } catch (error) {
        console.error('Experiences GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/profile/experiences
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { company, title, location, startDate, endDate, current, description, highlights, keywords } = body;

        // Validate required fields
        if (!company || !title || !startDate || !description) {
            return NextResponse.json(
                { error: 'Company, title, start date, and description are required' },
                { status: 400 }
            );
        }

        const experience = await prisma.experience.create({
            data: {
                userId: session.user.id,
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

        return NextResponse.json(experience, { status: 201 });
    } catch (error) {
        console.error('Experiences POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/profile/experiences
 * Updates an existing experience (expects id in body)
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: 'Experience ID is required' }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.experience.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
        }

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

        return NextResponse.json(experience);
    } catch (error) {
        console.error('Experiences PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/profile/experiences
 * Deletes an experience (expects id in query params)
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Experience ID is required' }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.experience.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
        }

        await prisma.experience.delete({ where: { id } });

        return NextResponse.json({ message: 'Experience deleted' });
    } catch (error) {
        console.error('Experiences DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
