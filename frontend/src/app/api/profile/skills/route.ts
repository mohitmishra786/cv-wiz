/**
 * Skills API Routes
 * CRUD operations for skills
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const skills = await prisma.skill.findMany({
            where: { userId: session.user.id },
            orderBy: [{ category: 'asc' }, { order: 'asc' }],
        });

        return NextResponse.json(skills);
    } catch (error) {
        console.error('Skills GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, category, proficiency, yearsExp } = body;

        if (!name || !category) {
            return NextResponse.json(
                { error: 'Name and category are required' },
                { status: 400 }
            );
        }

        // Check for duplicate skill
        const existing = await prisma.skill.findFirst({
            where: { userId: session.user.id, name },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Skill already exists' },
                { status: 409 }
            );
        }

        const skill = await prisma.skill.create({
            data: {
                userId: session.user.id,
                name,
                category,
                proficiency: proficiency || null,
                yearsExp: yearsExp || null,
            },
        });

        return NextResponse.json(skill, { status: 201 });
    } catch (error) {
        console.error('Skills POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
        }

        const existing = await prisma.skill.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        const skill = await prisma.skill.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.category && { category: data.category }),
                ...(data.proficiency !== undefined && { proficiency: data.proficiency }),
                ...(data.yearsExp !== undefined && { yearsExp: data.yearsExp }),
            },
        });

        return NextResponse.json(skill);
    } catch (error) {
        console.error('Skills PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
        }

        const existing = await prisma.skill.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        await prisma.skill.delete({ where: { id } });

        return NextResponse.json({ message: 'Skill deleted' });
    } catch (error) {
        console.error('Skills DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
