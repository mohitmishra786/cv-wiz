/**
 * Rate Limiting for API Routes
 * Simple in-memory rate limiting with Redis fallback
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
    keyPrefix?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100,
};

/**
 * Check if request is rate limited
 */
export function isRateLimited(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): { limited: boolean; remaining: number; resetTime: number } {
    const { windowMs, maxRequests, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
    const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier;
    const now = Date.now();
    
    const entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { limited: false, remaining: maxRequests - 1, resetTime: now + windowMs };
    }
    
    if (entry.count >= maxRequests) {
        // Rate limited
        return { limited: true, remaining: 0, resetTime: entry.resetTime };
    }
    
    // Increment count
    entry.count++;
    return { limited: false, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }
    
    // Fallback to a generic identifier
    return 'unknown';
}

/**
 * Rate limit configurations for specific endpoints
 */
export const rateLimits = {
    // Strict limit for registration (prevent spam accounts)
    registration: {
        windowMs: 60 * 60 * 1000,  // 1 hour
        maxRequests: 5,
        keyPrefix: 'reg',
    },
    
    // Moderate limit for login attempts (prevent brute force)
    login: {
        windowMs: 15 * 60 * 1000,  // 15 minutes
        maxRequests: 10,
        keyPrefix: 'login',
    },
    
    // Lenient limit for feedback
    feedback: {
        windowMs: 60 * 60 * 1000,  // 1 hour
        maxRequests: 20,
        keyPrefix: 'feedback',
    },
    
    // Standard API limit
    api: {
        windowMs: 15 * 60 * 1000,  // 15 minutes
        maxRequests: 100,
        keyPrefix: 'api',
    },
};

/**
 * Clean up old rate limit entries periodically
 */
export function cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
