import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [user, weeklyApplicationsCount] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                image: true,
                _count: {
                    select: {
                        experiences: true,
                        projects: true,
                        educations: true,
                        skills: true,
                        coverLetters: true,
                    }
                },
                coverLetters: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        jobTitle: true,
                        companyName: true,
                        createdAt: true,
                    }
                }
            }
        }),
        prisma.coverLetter.count({
            where: {
                userId,
                createdAt: { gte: sevenDaysAgo }
            }
        })
    ]);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate completeness
    let completeness = 0;
    if (user.name) completeness += 10;
    if (user.image) completeness += 5;
    if (user._count.experiences > 0) completeness += 25;
    if (user._count.educations > 0) completeness += 20;
    if (user._count.skills > 0) completeness += 20;
    if (user._count.projects > 0) completeness += 20;

    // Cap at 100
    completeness = Math.min(completeness, 100);

    return NextResponse.json({
        completeness,
        experienceCount: user._count.experiences,
        projectCount: user._count.projects,
        skillCount: user._count.skills,
        educationCount: user._count.educations,
        coverLetterCount: user._count.coverLetters,
        weeklyApplicationsCount,
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
        recentActivity: user.coverLetters.map(cl => ({
            id: cl.id,
            type: 'Cover Letter',
            title: `Cover Letter for ${cl.jobTitle || 'Job Application'}`,
            date: cl.createdAt,
            company: cl.companyName || 'Unknown Company'
        }))
    });
}