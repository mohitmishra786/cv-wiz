#!/usr/bin/env node

/**
 * Vercel Prebuild Script
 * Maps environment variables before Prisma CLI runs
 */

// Map CV_DATABASE_DATABASE_URL to DATABASE_URL for Prisma
if (process.env.CV_DATABASE_DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.CV_DATABASE_DATABASE_URL;
    console.log('[VERCEL_PREBUILD] Mapped CV_DATABASE_DATABASE_URL to DATABASE_URL');
}

// Map alternative Redis URLs
if (process.env.UPSTASH_REDIS_RES_REDIS_URL && !process.env.REDIS_URL) {
    process.env.REDIS_URL = process.env.UPSTASH_REDIS_RES_REDIS_URL;
    console.log('[VERCEL_PREBUILD] Mapped UPSTASH_REDIS_RES_REDIS_URL to REDIS_URL');
}

// Map NextAuth secret
if (process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
    console.log('[VERCEL_PREBUILD] Mapped NEXTAUTH_SECRET to AUTH_SECRET');
}

// Verify DATABASE_URL is set
if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    const maskedUrl = url.split('@')[1] || 'unknown';
    console.log(`[VERCEL_PREBUILD] DATABASE_URL configured: ***@${maskedUrl.split('/')[0]}`);
} else {
    console.error('[VERCEL_PREBUILD] ERROR: DATABASE_URL not set!');
    process.exit(1);
}
