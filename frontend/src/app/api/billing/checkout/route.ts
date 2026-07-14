/**
 * POST /api/billing/checkout
 *
 * Starts a Stripe Checkout session for the authenticated user to subscribe
 * to a paid tier. Redirect-based (Stripe-hosted page) — no Stripe.js/Elements
 * on our pages, so no CSP changes are needed.
 *
 * Disclosure: Checkout itself shows Stripe's standard subscription terms
 * (price, billing interval, renewal) before the user can pay. We also state
 * plainly on /pricing that PRO auto-renews monthly and can be cancelled
 * anytime via the billing portal (see /api/billing/portal).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { priceIdForTier, PURCHASABLE_TIERS, type PurchasableTier } from '@/lib/subscription';
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
    if (!session?.user?.id || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = isRateLimited(getClientIP(request), rateLimits.billing);
    if (rl.limited) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const tier = (body as { tier?: string })?.tier;
    if (!tier || !PURCHASABLE_TIERS.includes(tier as PurchasableTier)) {
        return NextResponse.json(
            { error: `tier must be one of: ${PURCHASABLE_TIERS.join(', ')}` },
            { status: 400 }
        );
    }

    try {
        const stripe = getStripe();
        const priceId = priceIdForTier(tier as PurchasableTier);
        const appUrl = getAppUrl(request);

        const userId = session.user.id;
        const existing = await prisma.userSettings.findUnique({
            where: { userId },
            select: { stripeCustomerId: true },
        });

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: existing?.stripeCustomerId || undefined,
            customer_email: existing?.stripeCustomerId ? undefined : session.user.email,
            client_reference_id: userId,
            line_items: [{ price: priceId, quantity: 1 }],
            subscription_data: {
                metadata: { userId },
            },
            allow_promotion_codes: true,
            success_url: `${appUrl}/pricing?checkout=success`,
            cancel_url: `${appUrl}/pricing?checkout=cancelled`,
        });

        if (!checkoutSession.url) {
            throw new Error('Stripe did not return a checkout URL');
        }

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        logger.error('[Billing] Failed to create checkout session', { error, userId: session.user.id });
        return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
    }
}
