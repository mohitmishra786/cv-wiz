/**
 * User Registration API
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { isValidEmail } from '@/lib/utils';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';
import { isRateLimited, getClientIP, rateLimits } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    const requestId = getOrCreateRequestId(request.headers);
    const logger = createRequestLogger(requestId);

    logger.startOperation('user:register');

    try {
        // Rate limiting check
        const clientIP = getClientIP(request);
        const rateLimit = isRateLimited(clientIP, rateLimits.registration);
        
        if (rateLimit.limited) {
            logger.warn('Registration rate limit exceeded', { clientIP });
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.', requestId },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { email, password, name } = body;

        logger.info('Registration attempt', {
            email: email ? `${email.substring(0, 3)}***` : undefined,
            hasPassword: !!password,
            hasName: !!name
        });

        // Validate required fields
        if (!email || !password) {
            logger.warn('Registration failed: missing required fields', { hasEmail: !!email, hasPassword: !!password });
            return NextResponse.json(
                { error: 'Email and password are required', requestId },
                { status: 400 }
            );
        }

        // Validate email format
        if (!isValidEmail(email)) {
            logger.warn('Registration failed: invalid email format');
            return NextResponse.json(
                { error: 'Invalid email format', requestId },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.length < 8) {
            logger.warn('Registration failed: password too short');
            return NextResponse.json(
                { error: 'Password must be at least 8 characters', requestId },
                { status: 400 }
            );
        }

        // Check database connection
        logger.info('Checking database connection...');
        logDbOperation('findUnique', 'User', { email: `${email.substring(0, 3)}***` });

        // Check if user already exists
        let existingUser;
        try {
            existingUser = await prisma.user.findUnique({
                where: { email },
            });
        } catch (dbError) {
            logger.error('Database error during user lookup', {
                error: dbError instanceof Error ? dbError.message : dbError,
                databaseUrl: process.env.DATABASE_URL ? 'set' : 'NOT SET',
                cvDatabaseUrl: process.env.CV_DATABASE_DATABASE_URL ? 'set' : 'NOT SET',
            });
            throw dbError;
        }

        if (existingUser) {
            logger.warn('Registration failed: user already exists');
            logAuthOperation('register:duplicate', existingUser.id, false);
            return NextResponse.json(
                { error: 'User with this email already exists', requestId },
                { status: 409 }
            );
        }

        // Hash password
        logger.info('Hashing password...');
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        logger.info('Creating user in database...');
        logDbOperation('create', 'User', { email: `${email.substring(0, 3)}***` });

        let user;
        try {
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    name: name || null,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                },
            });
        } catch (dbError) {
            logger.error('Database error during user creation', {
                error: dbError instanceof Error ? dbError.message : dbError,
                code: (dbError as { code?: string }).code,
            });
            throw dbError;
        }

        logger.info('User created successfully', { userId: user.id });
        logAuthOperation('register:success', user.id, true);

        // Create default settings
        logger.info('Creating default user settings...');
        logDbOperation('create', 'UserSettings', { userId: user.id });

        try {
            await prisma.userSettings.create({
                data: {
                    userId: user.id,
                    selectedTemplate: 'experience-skills-projects',
                },
            });
        } catch (settingsError) {
            logger.warn('Failed to create default settings (non-critical)', {
                error: settingsError instanceof Error ? settingsError.message : settingsError,
            });
            // Don't fail registration if settings creation fails
        }

        logger.endOperation('user:register');

        return NextResponse.json(
            {
                message: 'User created successfully',
                user,
                requestId,
            },
            { status: 201 }
        );
    } catch (error) {
        logger.failOperation('user:register', error);

        // Log additional context for debugging
        logger.error('Registration error details', {
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorCode: (error as { code?: string }).code,
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
            envCheck: {
                DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'NOT SET',
                CV_DATABASE_DATABASE_URL: process.env.CV_DATABASE_DATABASE_URL ? 'set' : 'NOT SET',
                NODE_ENV: process.env.NODE_ENV,
            }
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                requestId,
                debug: process.env.NODE_ENV !== 'production' ? {
                    message: error instanceof Error ? error.message : String(error),
                    code: (error as { code?: string }).code,
                } : undefined
            },
            { status: 500 }
        );
    }
}
