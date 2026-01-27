import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                experiences: { orderBy: [{ current: 'desc' }, { startDate: 'desc' }] },
                projects: { orderBy: { order: 'asc' } },
                educations: { orderBy: { startDate: 'desc' } },
                skills: { orderBy: [{ category: 'asc' }, { order: 'asc' }] },
                publications: { orderBy: { date: 'desc' } },
                settings: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Check if public
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isPublic = (user.settings?.resumePreferences as any)?.isPublic === true;

        if (!isPublic) {
            return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
        }

        // Return sanitized public profile (exclude email, phone if deemed private)
        // For now, we exclude email for privacy unless specifically wanted.
        const publicProfile = {
            name: user.name,
            image: user.image,
            experiences: user.experiences,
            projects: user.projects,
            educations: user.educations,
            skills: user.skills,
            publications: user.publications,
        };

        return NextResponse.json(publicProfile);
    } catch (error) {
        console.error('Public profile fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}