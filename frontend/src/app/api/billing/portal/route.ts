/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Billing Portal session so a subscribed user can view
 * invoices, change plan, or CANCEL — this is the "clear cancellation path"
 * requirement: self-serve, one click from Settings, no support ticket or
 * retention dark pattern in between.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { isRateLimited, getClientIP, rateLimits } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

function getAppUrl(request: NextRequest): string {
    return (
        process.env.NEXTAUTH_URL ||
        process.env.FRONTEND_URL ||
        request.nextUrl.origin
    );
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = isRateLimited(getClientIP(request), rateLimits.billing);
    if (rl.limited) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    try {
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
            select: { stripeCustomerId: true },
        });

        if (!settings?.stripeCustomerId) {
            return NextResponse.json(
                { error: 'No billing account found. Subscribe to a paid plan first.' },
                { status: 404 }
            );
        }

        const stripe = getStripe();
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: settings.stripeCustomerId,
            return_url: `${getAppUrl(request)}/settings`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        logger.error('[Billing] Failed to create portal session', { error, userId: session.user.id });
        return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 });
    }
}
