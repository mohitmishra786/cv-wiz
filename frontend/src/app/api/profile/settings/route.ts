/**
 * User Settings API Routes
 * GET/PUT for user preferences like template selection
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

        let settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
        });

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    userId: session.user.id,
                    selectedTemplate: 'experience-skills-projects',
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings GET error:', error);
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
        const { selectedTemplate, resumePreferences } = body;

        // Validate template
        const validTemplates = [
            'experience-skills-projects',
            'education-research-skills',
            'projects-skills-experience',
            'compact-technical',
        ];

        if (selectedTemplate && !validTemplates.includes(selectedTemplate)) {
            return NextResponse.json(
                { error: `Invalid template. Must be one of: ${validTemplates.join(', ')}` },
                { status: 400 }
            );
        }

        const settings = await prisma.userSettings.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                selectedTemplate: selectedTemplate || 'experience-skills-projects',
                resumePreferences: resumePreferences || null,
            },
            update: {
                ...(selectedTemplate && { selectedTemplate }),
                ...(resumePreferences !== undefined && { resumePreferences }),
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
