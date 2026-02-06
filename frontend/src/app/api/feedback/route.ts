import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeFeedbackData } from '@/lib/sanitization';
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await request.json();

        // Sanitize input data
        const sanitizedData = sanitizeFeedbackData(body);
        const { rating, comment, category } = sanitizedData;

        if (!rating || !comment) {
            return NextResponse.json({ error: 'Rating and comment are required' }, { status: 400 });
        }

        await prisma.feedback.create({
            data: {
                userId: session.user.id,
                rating: Number(rating),
                comment: comment as string,
                category: (category as string) || 'General',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('[Feedback] Submission failed', { error });
        return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }
}