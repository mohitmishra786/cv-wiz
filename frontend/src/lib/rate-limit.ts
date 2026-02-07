/**
 * Rate Limiting for API Routes
 * Simple in-memory rate limiting with Redis fallback
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
};

export function isRateLimited(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): { limited: boolean; remaining: number; resetTime: number } {
    const { windowMs, maxRequests, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
    const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { limited: false, remaining: maxRequests - 1, resetTime: now + windowMs };
    }

    if (entry.count >= maxRequests) {
        return { limited: true, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count++;
    return { limited: false, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const ips = forwarded.split(',');
        const ip = ips[0].trim();
        if (ip && !ip.includes('\'') && !ip.includes('"') && !ip.includes(';')) {
            return ip;
        }
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP && !realIP.includes('\'') && !realIP.includes('"') && !realIP.includes(';')) {
        return realIP;
    }

    return 'unknown';
}

export function validateBotProtection(honeypotField?: string): boolean {
    if (honeypotField && honeypotField.length > 0) {
        return false;
    }
    return true;
}

export const rateLimits = {
    registration: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 5,
        keyPrefix: 'reg',
    },

    login: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        keyPrefix: 'login',
    },

    feedback: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 10,
        keyPrefix: 'feedback',
    },

    api: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        keyPrefix: 'api',
    },
};

export function cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
