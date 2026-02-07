import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeFeedbackData } from '@/lib/sanitization';
import { logger } from "@/lib/logger";
import { isRateLimited, getClientIP, rateLimits } from '@/lib/rate-limit';

// Valid categories for feedback
const VALID_CATEGORIES = ['General', 'Bug', 'Feature', 'Usability', 'Performance', 'Other'];

// Maximum comment length
const MAX_COMMENT_LENGTH = 2000;
const MIN_COMMENT_LENGTH = 10;

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimit = isRateLimited(clientIP, rateLimits.feedback);
    
    if (rateLimit.limited) {
        logger.warn('[Feedback] Rate limit exceeded', { clientIP, userId: session.user.id });
        return NextResponse.json(
            { error: 'Too many feedback submissions. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();

        // Validate request body exists
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Sanitize input data
        const sanitizedData = sanitizeFeedbackData(body);
        const { rating, comment, category } = sanitizedData;

        // Enhanced validation
        if (rating === undefined || rating === null) {
            return NextResponse.json({ error: 'Rating is required' }, { status: 400 });
        }

        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
        }

        if (!comment || typeof comment !== 'string') {
            return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
        }

        if (comment.length < MIN_COMMENT_LENGTH) {
            return NextResponse.json({ 
                error: `Comment must be at least ${MIN_COMMENT_LENGTH} characters` 
            }, { status: 400 });
        }

        if (comment.length > MAX_COMMENT_LENGTH) {
            return NextResponse.json({ 
                error: `Comment must not exceed ${MAX_COMMENT_LENGTH} characters` 
            }, { status: 400 });
        }

        // Validate category if provided
        const validatedCategory = category && VALID_CATEGORIES.includes(category) 
            ? category 
            : 'General';

        await prisma.feedback.create({
            data: {
                userId: session.user.id,
                rating: ratingNum,
                comment: comment,
                category: validatedCategory,
            },
        });

        logger.info('[Feedback] Submitted successfully', { 
            userId: session.user.id, 
            rating: ratingNum,
            category: validatedCategory 
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('[Feedback] Submission failed', { error, userId: session.user?.id });
        return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }
}