/**
 * Enhanced Analytics API Route
 * Provides comprehensive analytics data for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface SkillFrequency {
    name: string;
    count: number;
}

interface MonthlyTrend {
    month: string;
    coverLetters: number;
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    try {
        const [
            user,
            weeklyApplicationsCount,
            monthlyApplicationsCount,
            totalApplicationsCount,
            topCompanies,
            monthlyTrends,
            skillStats,
        ] = await Promise.all([
            // User profile with counts
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
                        take: 10,
                        select: {
                            id: true,
                            jobTitle: true,
                            companyName: true,
                            createdAt: true,
                        }
                    },
                    skills: {
                        select: {
                            name: true,
                        }
                    }
                }
            }),
            // Weekly applications count
            prisma.coverLetter.count({
                where: {
                    userId,
                    createdAt: { gte: sevenDaysAgo }
                }
            }),
            // Monthly applications count
            prisma.coverLetter.count({
                where: {
                    userId,
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),
            // Total applications count
            prisma.coverLetter.count({
                where: { userId }
            }),
            // Top companies applied to
            prisma.coverLetter.groupBy({
                by: ['companyName'],
                where: {
                    userId,
                    companyName: { not: null }
                },
                _count: {
                    companyName: true
                },
                orderBy: {
                    _count: {
                        companyName: 'desc'
                    }
                },
                take: 5
            }),
            // Monthly trends (last 6 months)
            prisma.coverLetter.findMany({
                where: {
                    userId,
                    createdAt: { gte: sixMonthsAgo }
                },
                select: {
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            }),
            // Skill statistics
            prisma.skill.findMany({
                where: { userId },
                select: {
                    name: true,
                    level: true,
                }
            }),
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate profile completeness
        let completeness = 0;
        if (user.name) completeness += 10;
        if (user.image) completeness += 5;
        if (user._count.experiences > 0) completeness += 25;
        if (user._count.educations > 0) completeness += 20;
        if (user._count.skills > 0) completeness += 20;
        if (user._count.projects > 0) completeness += 20;
        completeness = Math.min(completeness, 100);

        // Calculate skill frequency
        const skillFrequency: Record<string, number> = {};
        skillStats.forEach(skill => {
            skillFrequency[skill.name] = (skillFrequency[skill.name] || 0) + 1;
        });

        const topSkills = Object.entries(skillFrequency)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate monthly trends
        const monthlyData: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            monthlyData[key] = 0;
        }

        // Fill in actual data
        monthlyTrends.forEach(cl => {
            const d = new Date(cl.createdAt);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (monthlyData.hasOwnProperty(key)) {
                monthlyData[key]++;
            }
        });

        const trends = Object.entries(monthlyData).map(([month, coverLetters]) => ({
            month,
            coverLetters
        }));

        // Calculate weekly activity for chart
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyActivity = days.map(day => ({ name: day, applications: 0 }));
        
        user.coverLetters.forEach(cl => {
            const dayIndex = new Date(cl.createdAt).getDay();
            const dayName = days[dayIndex];
            const dayActivity = weeklyActivity.find(d => d.name === dayName);
            if (dayActivity && new Date(cl.createdAt) >= sevenDaysAgo) {
                dayActivity.applications++;
            }
        });

        // Reorder to start from Monday
        const mondayIndex = weeklyActivity.findIndex(d => d.name === 'Mon');
        const reorderedActivity = [
            ...weeklyActivity.slice(mondayIndex),
            ...weeklyActivity.slice(0, mondayIndex)
        ];

        return NextResponse.json({
            // Basic stats
            completeness,
            experienceCount: user._count.experiences,
            projectCount: user._count.projects,
            skillCount: user._count.skills,
            educationCount: user._count.educations,
            coverLetterCount: user._count.coverLetters,
            
            // Application stats
            weeklyApplicationsCount,
            monthlyApplicationsCount,
            totalApplicationsCount,
            
            // Trends
            weeklyActivity: reorderedActivity,
            monthlyTrends: trends,
            
            // Insights
            topCompanies: topCompanies.map(c => ({
                name: c.companyName || 'Unknown',
                count: c._count.companyName
            })),
            topSkills,
            
            // Recent activity
            recentActivity: user.coverLetters.map(cl => ({
                id: cl.id,
                type: 'Cover Letter',
                title: `Cover Letter for ${cl.jobTitle || 'Job Application'}`,
                date: cl.createdAt,
                company: cl.companyName || 'Unknown Company'
            })),
            
            // Skill gap analysis (placeholder - would need job market data)
            skillGapAnalysis: {
                strongSkills: topSkills.slice(0, 3).map(s => s.name),
                suggestedSkills: ['React', 'TypeScript', 'Node.js'], // Would come from job market analysis
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
