-- Cover letter image thumbnails from uploads
ALTER TABLE "CoverLetter" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Document images extracted from resume / cover-letter PDFs
CREATE TABLE IF NOT EXISTS "DocumentImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "isProfile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DocumentImage_userId_idx" ON "DocumentImage"("userId");
CREATE INDEX IF NOT EXISTS "DocumentImage_userId_isProfile_idx" ON "DocumentImage"("userId", "isProfile");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DocumentImage_userId_fkey'
    ) THEN
        ALTER TABLE "DocumentImage"
            ADD CONSTRAINT "DocumentImage_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
