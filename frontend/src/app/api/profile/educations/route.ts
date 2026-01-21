/**
 * Education API Routes
 * CRUD operations for education entries
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

        const educations = await prisma.education.findMany({
            where: { userId: session.user.id },
            orderBy: { startDate: 'desc' },
        });

        return NextResponse.json(educations);
    } catch (error) {
        console.error('Educations GET error:', error);
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
        const { institution, degree, field, startDate, endDate, gpa, honors } = body;

        if (!institution || !degree || !field || !startDate) {
            return NextResponse.json(
                { error: 'Institution, degree, field, and start date are required' },
                { status: 400 }
            );
        }

        const education = await prisma.education.create({
            data: {
                userId: session.user.id,
                institution,
                degree,
                field,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                gpa: gpa || null,
                honors: honors || [],
            },
        });

        return NextResponse.json(education, { status: 201 });
    } catch (error) {
        console.error('Educations POST error:', error);
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
            return NextResponse.json({ error: 'Education ID is required' }, { status: 400 });
        }

        const existing = await prisma.education.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Education not found' }, { status: 404 });
        }

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

        return NextResponse.json(education);
    } catch (error) {
        console.error('Educations PUT error:', error);
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
            return NextResponse.json({ error: 'Education ID is required' }, { status: 400 });
        }

        const existing = await prisma.education.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Education not found' }, { status: 404 });
        }

        await prisma.education.delete({ where: { id } });

        return NextResponse.json({ message: 'Education deleted' });
    } catch (error) {
        console.error('Educations DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
