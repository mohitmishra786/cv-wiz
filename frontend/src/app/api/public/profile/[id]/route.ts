import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'; // Added logger import

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
            // Changed error message as per instruction's implied change
            return NextResponse.json({ error: 'Profile not found or not public' }, { status: 404 });
        }

        // Check if public
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isPublic = (user.settings?.resumePreferences as any)?.isPublic === true;

        if (!isPublic) {
            // Changed error message as per instruction's implied change
            return NextResponse.json({ error: 'Profile not found or not public' }, { status: 404 });
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
        logger.error('[PublicProfile] Fetch failed', { error, id: id }); // Replaced console.error with logger.error
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 }); // Changed error message as per instruction
    }
}