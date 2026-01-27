import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            experiences: true,
            projects: true,
            educations: true,
            skills: true,
            coverLetters: true,
        }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate completeness
    let completeness = 0;
    if (user.name) completeness += 10;
    if (user.image) completeness += 5;
    if (user.experiences.length > 0) completeness += 25;
    if (user.educations.length > 0) completeness += 20;
    if (user.skills.length > 0) completeness += 20;
    if (user.projects.length > 0) completeness += 20;

    // Cap at 100
    completeness = Math.min(completeness, 100);

    return NextResponse.json({
        completeness,
        experienceCount: user.experiences.length,
        projectCount: user.projects.length,
        skillCount: user.skills.length,
        educationCount: user.educations.length,
        coverLetterCount: user.coverLetters.length,
        // Mock data for charts
        activity: [
            { name: 'Mon', applications: 2 },
            { name: 'Tue', applications: 1 },
            { name: 'Wed', applications: 3 },
            { name: 'Thu', applications: 0 },
            { name: 'Fri', applications: 4 },
            { name: 'Sat', applications: 1 },
            { name: 'Sun', applications: 0 },
        ],
        recentActivity: user.coverLetters.slice(0, 5).map(cl => ({
            id: cl.id,
            type: 'Cover Letter',
            title: `Cover Letter for ${cl.jobTitle || 'Job Application'}`,
            date: cl.createdAt,
            company: cl.companyName || 'Unknown Company'
        }))
    });
}