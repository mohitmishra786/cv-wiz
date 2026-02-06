/**
 * Resume/CV Upload API Route
 * Forwards uploads to backend for parsing - NO MOCK DATA FALLBACK
 * 
 * This route acts as a proxy to the backend parsing service.
 * All parsing is done server-side for reliability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createRequestLogger, getOrCreateRequestId, logAuthOperation } from '@/lib/logger';

export async function POST(request: NextRequest) {
    // Determine the backend endpoint - must be absolute URL for server-side fetch
    const getBackendUrl = (path: string): string => {
        // If BACKEND_URL is set, use it (e.g. for separate deployments)
        if (process.env.BACKEND_URL) {
            const baseUrl = process.env.BACKEND_URL.endsWith('/')
                ? process.env.BACKEND_URL.slice(0, -1)
                : process.env.BACKEND_URL;
            return `${baseUrl}${path}`;
        }

        // Monorepo/Vercel deployment: construct absolute URL from request
        // The FastAPI backend is mapped to /api/py via vercel.json rewrites
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || 'localhost:3000';

        return `${protocol}://${host}/api/py${path}`;
    };


    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('upload:resume');

    try {
        // Check authentication
        logger.info('[Upload] Authenticating user');
        const session = await auth();

        if (!session?.user?.id) {
            logger.warn('[Upload] Authentication failed - no session');
            logAuthOperation('upload:unauthorized', undefined, false);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized. Please sign in to upload files.',
                    requestId
                },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        logger.info('[Upload] User authenticated', { requestId, userId });
        logAuthOperation('upload:authenticated', userId, true);

        // Parse the multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fileType = formData.get('type') as string || 'resume';

        if (!file) {
            logger.warn('[Upload] No file provided', { requestId, userId });
            return NextResponse.json(
                {
                    success: false,
                    error: 'No file provided. Please select a file to upload.',
                    requestId
                },
                { status: 400 }
            );
        }

        logger.info('[Upload] Processing file', {
            requestId,
            userId,
            filename: file.name,
            filetype: file.type,
            filesize: file.size,
            uploadType: fileType,
        });

        // Prepare form data for backend
        const backendFormData = new FormData();
        backendFormData.append('file', file);
        backendFormData.append('file_type', fileType);

        // Determine the backend URL for this request
        // Path should be /upload/resume (FastAPI prefix is /api, rewrite adds /py)
        const uploadEndpoint = getBackendUrl('/upload/resume');

        // Forward to backend for parsing
        logger.info('[Upload] Forwarding to backend', {
            requestId,
            userId,
            backendUrl: uploadEndpoint,
        });

        let backendResponse: Response;

        try {
            backendResponse = await fetch(uploadEndpoint, {
                method: 'POST',
                body: backendFormData,
                headers: {
                    'X-Request-ID': requestId,
                },
            });
        } catch (fetchError) {
            // Network error - backend unreachable
            const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
            const errorStack = fetchError instanceof Error ? fetchError.stack : undefined;

            logger.error('[Upload] Backend connection failed', {
                requestId,
                userId,
                error: errorMessage,
                stack: errorStack,
                backendUrl: uploadEndpoint,
            });

            // Don't leak internal URLs to client
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to connect to parsing service.',
                    details: {
                        errorType: 'CONNECTION_ERROR',
                        message: errorMessage,
                    },
                    requestId,
                },
                { status: 503 }
            );
        }

        // Parse backend response
        let backendData: Record<string, unknown>;

        try {
            backendData = await backendResponse.json();
        } catch (parseError) {
            const responseText = await backendResponse.text().catch(() => 'Unable to read response');

            logger.error('[Upload] Failed to parse backend response', {
                requestId,
                userId,
                status: backendResponse.status,
                responsePreview: responseText.slice(0, 500),
                parseError: parseError instanceof Error ? parseError.message : String(parseError),
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid response from parsing service.',
                    details: {
                        errorType: 'PARSE_ERROR',
                        status: backendResponse.status,
                        responsePreview: responseText.slice(0, 200),
                    },
                    requestId,
                },
                { status: 502 }
            );
        }

        // Handle non-OK response from backend
        if (!backendResponse.ok) {
            logger.error('[Upload] Backend returned error', {
                requestId,
                userId,
                status: backendResponse.status,
                error: backendData,
            });

            // Extract error message from backend response
            const errorMessage = typeof backendData.detail === 'string'
                ? backendData.detail
                : (backendData.detail as Record<string, unknown>)?.message ||
                backendData.error ||
                'Failed to parse file';

            return NextResponse.json(
                {
                    success: false,
                    error: String(errorMessage),
                    details: backendData,
                    requestId,
                },
                { status: backendResponse.status }
            );
        }

        // Success - return parsed data
        logger.info('[Upload] Parsing successful', {
            requestId,
            userId,
            hasName: !!(backendData.data as Record<string, unknown>)?.name,
            hasExperiences: !!((backendData.data as Record<string, unknown>)?.experiences as unknown[])?.length,
            hasSkills: !!((backendData.data as Record<string, unknown>)?.skills as unknown[])?.length,
            hasEducation: !!((backendData.data as Record<string, unknown>)?.education as unknown[])?.length,
            extractionMethod: (backendData.data as Record<string, unknown>)?.extraction_method,
        });

        // === NEW: Automatically save parsed data to database ===
        try {
            logger.info('[Upload] Saving parsed data to database', { requestId, userId });

            const parsedData = backendData.data as Record<string, unknown>;

            // Transform backend data format to match import endpoint schema
            const importData = {
                name: parsedData.name as string | undefined,
                about: parsedData.summary as string | undefined,
                experiences: (parsedData.experiences as unknown[] || []).map((exp: unknown) => {
                    const e = exp as Record<string, unknown>;
                    return {
                        company: String(e.company || ''),
                        title: String(e.title || ''),
                        description: String(e.description || ''),
                        startDate: e.start_date ? String(e.start_date) : undefined,
                        endDate: e.end_date ? String(e.end_date) : undefined,
                        current: Boolean(e.current),
                        location: e.location ? String(e.location) : undefined,
                    };
                }),
                educations: (parsedData.education as unknown[] || []).map((edu: unknown) => {
                    const e = edu as Record<string, unknown>;
                    return {
                        school: String(e.institution || e.school || ''),
                        degree: e.degree ? String(e.degree) : undefined,
                        field: e.field || e.major ? String(e.field || e.major) : undefined,
                        startDate: e.start_date ? String(e.start_date) : undefined,
                        endDate: e.end_date ? String(e.end_date) : undefined,
                    };
                }),
                skills: (parsedData.skills as unknown[] || []).map((skill: unknown) => {
                    if (typeof skill === 'string') return skill;
                    return String((skill as Record<string, unknown>).name || skill);
                }),
            };

            // Call internal import endpoint to save to database
            const importResponse = await fetch(`${request.nextUrl.origin}/api/profile/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '', // Forward session cookie
                },
                body: JSON.stringify(importData),
            });

            if (!importResponse.ok) {
                const importError = await importResponse.json().catch(() => ({ error: 'Unknown error' }));
                logger.warn('[Upload] Failed to save parsed data to database', {
                    requestId,
                    userId,
                    status: importResponse.status,
                    error: importError,
                });
                // Don't fail the upload - data is still returned to frontend
            } else {
                logger.info('[Upload] Successfully saved parsed data to database', { requestId, userId });
            }
        } catch (saveError) {
            logger.error('[Upload] Error saving to database', {
                requestId,
                userId,
                error: saveError instanceof Error ? saveError.message : String(saveError),
            });
            // Don't fail the upload - data is still returned to frontend
        }

        logger.endOperation('upload:resume');

        return NextResponse.json({
            success: true,
            data: backendData.data,
            requestId,
        });

    } catch (error) {
        // Unexpected error in the route handler
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        logger.error('[Upload] Unexpected error in upload handler', {
            requestId,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage,
            stack: errorStack,
        });
        logger.failOperation('upload:resume', error);

        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred while processing your file.',
                details: process.env.NODE_ENV !== 'production' ? {
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    message: errorMessage,
                } : undefined,
                requestId,
            },
            { status: 500 }
        );
    }
}
