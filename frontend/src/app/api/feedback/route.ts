import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const body = await request.json();
        const { rating, comment, category } = body;

        if (!rating || !comment) {
            return NextResponse.json({ error: 'Rating and comment are required' }, { status: 400 });
        }

        const feedback = await prisma.feedback.create({
            data: {
                userId: session?.user?.id || null,
                rating: Number(rating),
                comment,
                category: category || 'General',
            },
        });

        return NextResponse.json({ success: true, id: feedback.id });
    } catch (error) {
        console.error('Feedback submission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}