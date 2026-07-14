-- ============================================================================
-- ⚠️  NEEDS HUMAN REVIEW BEFORE `prisma migrate deploy` AGAINST A REAL DATABASE
-- Written by hand (no live DB was available to run `prisma migrate dev`).
-- Verify column/enum names below still match prisma/schema.prisma exactly
-- before deploying, and take a DB snapshot/backup first as usual practice.
-- ============================================================================

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO', 'TEAM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- AlterTable: add billing columns with safe defaults so every existing
-- UserSettings row lands on FREE/NONE (no behavior change for current users).
ALTER TABLE "UserSettings"
  ADD COLUMN "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "stripePriceId" TEXT,
  ADD COLUMN "currentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex (unique constraints for Stripe id lookups in the webhook handler)
CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_stripeCustomerId_key" ON "UserSettings"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_stripeSubscriptionId_key" ON "UserSettings"("stripeSubscriptionId");

-- CreateIndex
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside Prisma's default transaction.
-- For a zero-downtime production apply on a large table, create the index
-- first with `CREATE INDEX CONCURRENTLY IF NOT EXISTS ...` outside this
-- migration, then this migration's IF NOT EXISTS makes it a no-op.
CREATE INDEX IF NOT EXISTS "UserSettings_subscriptionTier_idx" ON "UserSettings"("subscriptionTier");
