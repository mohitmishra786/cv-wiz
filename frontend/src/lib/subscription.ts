/**
 * Subscription / Billing Helpers
 *
 * Single source of truth for tier definitions and Stripe price ID lookup.
 * See docs/monetization-decision.md for the tiering rationale.
 *
 * IMPORTANT: this module only defines what a tier *is* and how to read/write
 * it in the DB. It does NOT enforce any usage caps (e.g. "5 tailored resumes
 * a month" for FREE) — that enforcement belongs in whichever service
 * actually performs tailoring (currently backend/app/routers/compile.py,
 * a separate Python service) and is intentionally out of scope for this
 * plumbing change. See the decision doc for the follow-up needed there.
 */

import prisma from './prisma';
import type { SubscriptionStatus, SubscriptionTier } from '@prisma/client';

export type { SubscriptionStatus, SubscriptionTier };

export const TIERS = ['FREE', 'PRO', 'TEAM'] as const;

/** Tiers a user can actually buy today. TEAM is reserved for later. */
export const PURCHASABLE_TIERS = ['PRO'] as const;
export type PurchasableTier = (typeof PURCHASABLE_TIERS)[number];

interface PriceConfig {
    tier: PurchasableTier;
    envVar: string;
}

const PRICE_CONFIG: PriceConfig[] = [
    { tier: 'PRO', envVar: 'STRIPE_PRICE_ID_PRO_MONTHLY' },
];

/** Map a Stripe price ID (from env) back to the tier it represents. */
export function tierForPriceId(priceId: string | null | undefined): PurchasableTier | null {
    if (!priceId) return null;
    for (const { tier, envVar } of PRICE_CONFIG) {
        if (process.env[envVar] === priceId) return tier;
    }
    return null;
}

/** Get the configured Stripe price ID for a purchasable tier. Throws if unset. */
export function priceIdForTier(tier: PurchasableTier): string {
    const config = PRICE_CONFIG.find((p) => p.tier === tier);
    const priceId = config ? process.env[config.envVar] : undefined;
    if (!priceId) {
        throw new Error(
            `No Stripe price ID configured for tier ${tier}. Set ${config?.envVar} in the environment.`
        );
    }
    return priceId;
}

/**
 * Fresh read of a user's tier straight from the DB. Deliberately not cached
 * in the JWT/session — the webhook is the only writer, and gating checks
 * should never be stale for longer than a single DB round trip.
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
    const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { subscriptionTier: true },
    });
    return settings?.subscriptionTier ?? 'FREE';
}

/** Upsert billing fields on UserSettings, creating the row if it doesn't exist yet. */
export async function upsertSubscriptionState(
    userId: string,
    data: {
        subscriptionTier?: SubscriptionTier;
        subscriptionStatus?: SubscriptionStatus;
        stripeCustomerId?: string | null;
        stripeSubscriptionId?: string | null;
        stripePriceId?: string | null;
        currentPeriodEnd?: Date | null;
        cancelAtPeriodEnd?: boolean;
    }
) {
    return prisma.userSettings.upsert({
        where: { userId },
        create: {
            userId,
            ...data,
        },
        update: data,
    });
}

/** Find the UserSettings/User row owning a given Stripe customer ID. */
export async function findUserByStripeCustomerId(stripeCustomerId: string) {
    return prisma.userSettings.findUnique({
        where: { stripeCustomerId },
        include: { user: { select: { id: true, email: true } } },
    });
}
