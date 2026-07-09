/**
 * User Registration API
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { isValidEmail } from '@/lib/utils';
import { createRequestLogger, getOrCreateRequestId, logDbOperation, logAuthOperation } from '@/lib/logger';
import { isRateLimited, getClientIP, rateLimits, validateBotProtection } from '@/lib/rate-limit';

interface RegistrationInput {
    email: string;
    password: string;
    name: string | undefined;
    honeypot: string | undefined;
}

function parseRegistrationBody(body: unknown): RegistrationInput {
    if (typeof body !== 'object' || body === null) {
        throw new Error('Invalid request body');
    }
    const data = body as Record<string, unknown>;
    const email = typeof data.email === 'string' ? data.email : '';
    const password = typeof data.password === 'string' ? data.password : '';
    const name = typeof data.name === 'string' ? data.name : undefined;
    const honeypot = typeof data.honeypot === 'string' ? data.honeypot : undefined;
    return { email, password, name, honeypot };
}

function sanitizeError(error: unknown): { message: string; code: string } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string }).code || 'UNKNOWN_ERROR';

    const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /api[_-]?key/i,
        /credential/i,
        /connection string/i,
        /database/i,
        /prisma/i,
        /at\s+.*\.ts:?\d*/,
        /\/[a-zA-Z0-9_/-]+\.(ts|js):\d+:\d+/,
    ];

    if (sensitivePatterns.some(pattern => pattern.test(errorMessage))) {
        return { message: 'An internal error occurred', code: errorCode };
    }

    return { message: 'An internal error occurred', code: errorCode };
}

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

        const input = parseRegistrationBody(await request.json());

        if (!validateBotProtection(input.honeypot)) {
            logger.warn('Registration blocked - bot detected via honeypot', { clientIP });
            return NextResponse.json(
                { error: 'Registration is temporarily unavailable', requestId },
                { status: 403 }
            );
        }

        logger.info('Registration attempt', {
            email: input.email ? `${input.email.substring(0, 3)}***` : undefined,
            hasPassword: !!input.password,
            hasName: !!input.name
        });

        if (!input.email || !input.password) {
            logger.warn('Registration failed: missing required fields', { hasEmail: !!input.email, hasPassword: !!input.password });
            return NextResponse.json(
                { error: 'Email and password are required', requestId },
                { status: 400 }
            );
        }

        // Validate email format
        if (!isValidEmail(input.email)) {
            logger.warn('Registration failed: invalid email format');
            return NextResponse.json(
                { error: 'Invalid email format', requestId },
                { status: 400 }
            );
        }

        // Validate password strength
        if (input.password.length < 8) {
            logger.warn('Registration failed: password too short');
            return NextResponse.json(
                { error: 'Password must be at least 8 characters', requestId },
                { status: 400 }
            );
        }

        // Check database connection
        logger.info('Checking database connection...');
        logDbOperation('findUnique', 'User', { email: `${input.email.substring(0, 3)}***` });

        // Check if user already exists
        let existingUser;
        try {
            existingUser = await prisma.user.findUnique({
                where: { email: input.email },
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
        const passwordHash = await bcrypt.hash(input.password, 12);

        // Create user
        logger.info('Creating user in database...');
        logDbOperation('create', 'User', { email: `${input.email.substring(0, 3)}***` });

        let user;
        try {
            user = await prisma.user.create({
                data: {
                    email: input.email,
                    passwordHash,
                    name: input.name || null,
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

        const sanitized = sanitizeError(error);

        return NextResponse.json(
            {
                error: sanitized.message,
                code: sanitized.code,
                requestId,
            },
            { status: 500 }
        );
    }
}
