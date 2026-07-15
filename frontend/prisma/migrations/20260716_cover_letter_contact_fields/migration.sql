-- Structured contact fields for cover letters (separate from body content)
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "linkedin" TEXT;
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "github" TEXT;
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "recipientName" TEXT;
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "applicantName" TEXT;
