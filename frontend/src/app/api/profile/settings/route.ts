/**
 * User Settings API Routes
 * GET/PUT for user preferences like template selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';

export async function GET(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('settings:get');

    try {
        logger.info('Authenticating user for settings fetch');
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Settings fetch failed - no session');
            logAuthOperation('settings:get:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        logger.info('Fetching user settings', { requestId, userId });
        logDbOperation('findUnique', 'UserSettings', { userId });

        let settings = await prisma.userSettings.findUnique({
            where: { userId },
        });

        // Create default settings if not exists
        if (!settings) {
            logger.info('Settings not found - creating default', { requestId, userId });
            logDbOperation('create', 'UserSettings', { userId, selectedTemplate: 'experience-skills-projects' });

            settings = await prisma.userSettings.create({
                data: {
                    userId,
                    selectedTemplate: 'experience-skills-projects',
                },
            });

            logger.info('Default settings created', { requestId, userId, selectedTemplate: settings.selectedTemplate });
        } else {
            logger.info('Settings fetched successfully', {
                requestId,
                userId,
                selectedTemplate: settings.selectedTemplate,
            });
        }

        logger.endOperation('settings:get');
        return NextResponse.json({ data: settings, requestId });
    } catch (error) {
        logger.failOperation('settings:get', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('settings:update');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Settings update failed - no session');
            logAuthOperation('settings:update:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { selectedTemplate, resumePreferences } = body;

        logger.info('Updating settings', {
            requestId,
            userId,
            selectedTemplate,
            hasResumePreferences: !!resumePreferences,
        });

        // Validate template
        const validTemplates = [
            'experience-skills-projects',
            'education-research-skills',
            'projects-skills-experience',
            'compact-technical',
            'creative-portfolio',
            'executive-leadership',
            'healthcare-medical',
            'finance-analyst',
            'minimalist-modern',
            'international-multilingual',
        ];

        if (selectedTemplate && !validTemplates.includes(selectedTemplate)) {
            logger.warn('Invalid template specified', {
                requestId,
                userId,
                selectedTemplate,
                validTemplates,
            });
            return NextResponse.json(
                { error: `Invalid template. Must be one of: ${validTemplates.join(', ')}`, requestId },
                { status: 400 }
            );
        }

        logger.info('Upserting settings', { requestId, userId });
        logDbOperation('upsert', 'UserSettings', { userId, selectedTemplate });

        const settings = await prisma.userSettings.upsert({
            where: { userId },
            create: {
                userId,
                selectedTemplate: selectedTemplate || 'experience-skills-projects',
                resumePreferences: resumePreferences || null,
            },
            update: {
                ...(selectedTemplate && { selectedTemplate }),
                ...(resumePreferences !== undefined && { resumePreferences }),
            },
        });

        logger.info('Settings updated successfully', {
            requestId,
            userId,
            selectedTemplate: settings.selectedTemplate,
        });

        logger.endOperation('settings:update');
        return NextResponse.json({ data: settings, requestId });
    } catch (error) {
        logger.failOperation('settings:update', error);
        return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    }
}
