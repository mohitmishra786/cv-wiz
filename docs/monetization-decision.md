# Monetization Decision: Tiering for MatchQuill

**Date:** 2026-07-14
**Author:** Subagent 5 (Monetization Plumbing)
**Status:** Recommendation — plumbing implemented in this PR, ⚠️ NEEDS HUMAN REVIEW before merge/deploy (real Stripe account, price IDs, and webhook registration are human actions; see checklist at bottom).

---

## Context

MatchQuill (`frontend/`, Next.js 16 + Prisma + NextAuth v5) currently has **zero billing code**. Every feature — resume tailoring, cover letters, templates, job tracker, interview prep — is free and unmetered. This document proposes the minimum tiering model needed to introduce a paid plan without disrupting the existing free product, and records what was and wasn't built in the accompanying PR.

## Recommendation

| Tier | Price | Gate |
|---|---|---|
| **FREE** (default) | $0 | Capped tailored resumes per month (recommended: **5/month**), core templates, cover letters, job tracker, interview prep — i.e. everything that exists today, just rate-limited on the one AI-cost-heavy action. |
| **PRO** | $9.99/month | Unlimited tailored resumes/cover letters, the upcoming **semantic job-matching** upgrade, full template library, priority AI processing. |
| **TEAM** *(reserved, not sold yet)* | TBD | Multi-seat / shared team profiles. Enum value added now so a future migration isn't needed to introduce it, but no checkout path, price, or UI exists for it in this PR. |

### Why gate on tailored-resume count, not templates or the tracker

- **Tailoring is the actual COGS driver.** Every tailored resume/cover letter is an LLM call (Groq API, per `GROQ_API_KEY` in `.env.example`) plus, per `backend/app/services/resume_compiler.py`, a PDF compile step. Templates, the job tracker, and profile CRUD are near-zero marginal cost — gating them wouldn't reduce cost, it would just annoy free users and hurt activation.
- **A monthly cap (not a lifetime cap) matches the product's usage pattern.** Job hunting is bursty — someone might apply to 15 jobs in one intense week, then nothing for months. A hard lifetime cap punishes exactly the successful, engaged users we want to convert; a monthly cap gives every free user a fresh, meaningful taste every month and creates natural upgrade pressure only for genuinely heavy users.
- **5/month is a starting number, not derived from real usage data** (none exists yet — this is a pre-revenue product). It should be treated as a hypothesis: instrument actual free-tier tailoring volume post-launch and tune the cap, not treat 5 as sacred.
- **Semantic matching as a PRO-only upgrade**, rather than bundling it into FREE, follows standard "new capability = paid upgrade" practice and gives PRO a distinct value prop beyond "more of the same thing" (higher perceived value than a bare quota increase).
- **Single paid tier (PRO) at launch**, with TEAM reserved but unbuilt: two paid tiers before there's a single paying customer is premature complexity. Ship one price, prove willingness to pay, then decide if TEAM is worth building.

### Alternatives considered and rejected

- **Gate on template count** (e.g. free = 2 templates): rejected — templates cost nothing to serve, so this gate optimizes for the wrong thing and looks like nickel-and-diming rather than a real value tier.
- **Gate on total resume storage / versions**: rejected — `ResumeVersion` history is cheap (a JSON snapshot) and cutting it feels punitive, not premium.
- **Usage-based (metered) billing** instead of flat monthly cap: rejected for v1 — meters need per-call cost accounting wired into the Python tailoring service, which doesn't exist yet and is a meaningfully bigger project than "add billing plumbing." Flat tiers are the standard minimal-viable monetization move; metering can be a v2 exploration once there's revenue to justify the engineering cost.
- **Annual pricing at launch**: deferred, not rejected — adds a second Stripe Price and a discount-math decision that isn't needed to validate the core tiering hypothesis. Easy to add later (see "Follow-ups" below); no schema change needed since `stripePriceId` already stores whichever price the user is on.

## What this PR implements vs. what it deliberately does NOT implement

**Implemented (this PR):**
- `SubscriptionTier` (`FREE` / `PRO` / `TEAM`) and `SubscriptionStatus` (`NONE` / `ACTIVE` / `PAST_DUE` / `CANCELED`) enums, and billing columns on `UserSettings` (see `prisma/schema.prisma` + hand-written migration `prisma/migrations/20260714_add_subscription_tier/`). Every existing row defaults to `FREE` / `NONE` — **no behavior change for current users** on migration.
- Stripe Checkout session creation (`POST /api/billing/checkout`) — redirect-based, no Stripe.js/Elements, so no CSP changes needed.
- Stripe Billing Portal session creation (`POST /api/billing/portal`) — this is the cancellation path: one click from Settings → Billing, no "email support to cancel."
- Webhook handler (`POST /api/webhooks/stripe`) for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, keeping `UserSettings.subscriptionTier`/`subscriptionStatus` in sync.
- `/pricing` page (public, unauthenticated visitors can see it) with plain-language auto-renewal disclosure and a link to the cancellation flow.
- A "Billing" section on `/settings` showing current plan, renewal/cancellation date, and the manage/cancel button.

**Deliberately NOT implemented (flagged for follow-up, not silently skipped):**
- **Actual enforcement of the FREE tier's 5/month cap.** Resume tailoring happens in `backend/app/routers/compile.py`, a separate Python/FastAPI service — wiring a usage counter and a 402/429-style block into that service is a distinct, larger change than "billing plumbing" and was out of scope here. `src/lib/subscription.ts` exposes `getUserTier(userId)` as the read path a future gate would call; the counting/reset-per-month logic itself does not exist yet. **This means PRO currently unlocks nothing functionally different from FREE** — the plumbing (payment, tier tracking, cancellation) works end-to-end, but no feature is actually gated yet. That gate is the necessary next PR before this can generate real revenue.
- **Semantic job-matching feature itself.** It's referenced on the pricing page as a PRO perk because product direction calls for it, but no semantic-matching code exists in this codebase today (confirmed via search — zero matches for "semantic" outside this doc). Do not advertise it as shipped; either build it before launch or adjust pricing copy.
- **Annual billing, promo codes beyond Stripe's built-in `allow_promotion_codes`, proration edge cases, and dunning emails** — all standard Stripe Billing Portal/Checkout defaults are used as-is; no custom logic was added for any of these.

## No dark patterns — how this is satisfied

- **Auto-renewal disclosure:** `/pricing` states directly on the PRO card: "Billed monthly. Auto-renews until cancelled — cancel anytime from Settings, no questions asked." This is not buried in a footnote.
- **Clear cancellation path:** Settings → Billing → "Manage subscription / Cancel" opens the Stripe-hosted Billing Portal, where cancellation is a standard, self-serve Stripe flow — no manual/support-ticket cancellation, no confusing multi-step retention maze added on top of Stripe's default portal.
- **No pre-ticked upsells, no fake urgency/scarcity, no hidden fees** — Checkout shows Stripe's standard line-item summary before payment.

## Env vars a human must set (see `.env.example`)

| Var | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe API key (test or live). |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint below — obtained when the endpoint is registered in the Stripe Dashboard (or from `stripe listen` in dev). |
| `STRIPE_PRICE_ID_PRO_MONTHLY` | Price ID for the PRO monthly subscription product, created in Stripe Dashboard → Product catalog. |

No real keys were added anywhere; `.env.example` only has placeholders.

## Human actions required before this can process real payments

1. **Create/confirm a Stripe account** (test mode is fine for staging).
2. **Create a Product + recurring monthly Price** in the Stripe Dashboard for PRO; put its price ID in `STRIPE_PRICE_ID_PRO_MONTHLY`.
3. **Register the webhook endpoint** — `https://<your-domain>/api/webhooks/stripe` — in the Stripe Dashboard, subscribed to at minimum: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the generated signing secret into `STRIPE_WEBHOOK_SECRET`.
4. **Review and run the migration** in `prisma/migrations/20260714_add_subscription_tier/migration.sql` against a real database (it was hand-written, not generated by `prisma migrate dev`, because no live DB was available in this environment — see the warning banner at the top of that file). Take a backup first, per normal practice.
5. **Decide and implement the actual usage-cap enforcement** in the Python tailoring service before advertising PRO as unlocking anything — today this PR does not block FREE users from unlimited tailoring.
6. **Confirm the pricing/copy** ($9.99/mo, 5/month free cap) against real cost data once available; these are launch hypotheses, not measured numbers.

## Unverified / flagged

- No real Stripe test was run against these routes (no test API keys in this environment) — code was written to the documented Stripe Node SDK v17 API surface and typechecked via `npx prisma generate` + `next build`, but has not been exercised against a live Stripe test-mode account.
- The hand-written migration SQL has not been run against any database, per the constraint against destructive operations in a sandboxed environment.
