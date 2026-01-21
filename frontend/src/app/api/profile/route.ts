/**
 * Profile API Routes
 * GET /api/profile - Get current user's profile
 * PUT /api/profile - Update profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/profile
 * Returns the complete profile for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Fetch complete profile with all relations
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                experiences: {
                    orderBy: [{ current: 'desc' }, { startDate: 'desc' }],
                },
                projects: {
                    orderBy: { order: 'asc' },
                },
                educations: {
                    orderBy: { startDate: 'desc' },
                },
                skills: {
                    orderBy: [{ category: 'asc' }, { order: 'asc' }],
                },
                publications: {
                    orderBy: { date: 'desc' },
                },
                settings: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Transform to API response format
        const profile = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            experiences: user.experiences,
            projects: user.projects,
            educations: user.educations,
            skills: user.skills,
            publications: user.publications,
            settings: user.settings,
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Profile GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/profile
 * Update user profile fields
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const body = await request.json();

        // Extract updateable fields
        const { name, image } = body;

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name !== undefined && { name }),
                ...(image !== undefined && { image }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Profile PUT error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
