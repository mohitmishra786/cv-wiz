/**
 * Resume/CV Upload API Route
 * Forwards uploads to backend for parsing and extracts structured data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createRequestLogger, getOrCreateRequestId, logAuthOperation } from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('upload:resume');

    try {
        // Check authentication
        logger.info('Authenticating user for file upload');
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('Upload failed - no session');
            logAuthOperation('upload:unauthorized', undefined, false);
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
        }

        const userId = session.user.id;
        logger.info('User authenticated for upload', { requestId, userId });
        logAuthOperation('upload:authenticated', userId, true);

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string || 'resume';

        if (!file) {
            logger.warn('Upload failed - no file provided', { requestId, userId });
            return NextResponse.json({ error: 'No file provided', requestId }, { status: 400 });
        }

        logger.info('Processing uploaded file', {
            requestId,
            userId,
            filename: file.name,
            filetype: file.type,
            filesize: file.size,
            uploadType: type,
        });

        // Forward to backend for parsing
        logger.info('Forwarding file to backend for parsing', { requestId, userId });

        const backendFormData = new FormData();
        backendFormData.append('file', file);

        try {
            const backendResponse = await fetch(`${BACKEND_URL}/api/upload/resume`, {
                method: 'POST',
                body: backendFormData,
            });

            if (!backendResponse.ok) {
                const errorText = await backendResponse.text();
                logger.error('Backend parsing failed', {
                    requestId,
                    userId,
                    status: backendResponse.status,
                    error: errorText,
                });

                // Fall back to mock data if backend fails
                logger.warn('Falling back to mock data', { requestId, userId });
                return NextResponse.json({
                    success: true,
                    data: getMockData(type),
                    warning: 'Backend parsing unavailable. Please enter data manually.',
                    requestId,
                });
            }

            const backendData = await backendResponse.json();

            logger.info('Backend parsing successful', {
                requestId,
                userId,
                hasExperiences: !!backendData.data?.experiences?.length,
                hasSkills: !!backendData.data?.skills?.length,
            });

            logger.endOperation('upload:resume');

            return NextResponse.json({
                success: backendData.success,
                data: backendData.data,
                warning: backendData.data?.warning,
                requestId,
            });

        } catch (backendError) {
            logger.warn('Backend connection failed, using mock data', {
                requestId,
                userId,
                error: backendError instanceof Error ? backendError.message : String(backendError),
            });

            // Return mock data if backend is unavailable
            return NextResponse.json({
                success: true,
                data: getMockData(type),
                warning: 'Resume parsing service unavailable. Please enter your details manually.',
                requestId,
            });
        }

    } catch (error) {
        logger.failOperation('upload:resume', error);
        logger.error('Upload error details', {
            requestId,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            {
                error: 'Failed to process file',
                requestId,
                debug: process.env.NODE_ENV !== 'production' ? {
                    message: error instanceof Error ? error.message : String(error),
                } : undefined
            },
            { status: 500 }
        );
    }
}

function getMockData(type: string) {
    if (type === 'cover-letter') {
        return {
            content: '',
            message: 'Cover letter parsing is not yet implemented. Please enter your content manually.',
        };
    }

    return {
        name: '',
        email: '',
        phone: '',
        experiences: [],
        education: [],
        skills: [],
        message: 'Resume parsing is temporarily unavailable. Please enter your details manually.',
    };
}
