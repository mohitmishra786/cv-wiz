import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isRateLimited, getClientIP, validateBotProtection } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    describe('isRateLimited', () => {
        it('should not limit first request', () => {
            const result = isRateLimited('test-identifier', {
                windowMs: 60000,
                maxRequests: 5,
            });

            expect(result.limited).toBe(false);
            expect(result.remaining).toBe(4);
        });

        it('should allow multiple requests within limit', () => {
            const identifier = 'multi-request-test';

            for (let i = 0; i < 5; i++) {
                const result = isRateLimited(identifier, {
                    windowMs: 60000,
                    maxRequests: 5,
                });
                expect(result.limited).toBe(false);
            }
        });

        it('should block requests exceeding limit', () => {
            const identifier = 'limit-test';

            for (let i = 0; i < 5; i++) {
                isRateLimited(identifier, {
                    windowMs: 60000,
                    maxRequests: 5,
                });
            }

            const result = isRateLimited(identifier, {
                windowMs: 60000,
                maxRequests: 5,
            });

            expect(result.limited).toBe(true);
            expect(result.remaining).toBe(0);
        });

        it('should use different limits for different prefixes', () => {
            const identifier = 'shared-identifier';

            const result1 = isRateLimited(identifier, {
                windowMs: 60000,
                maxRequests: 5,
                keyPrefix: 'prefix1',
            });

            const result2 = isRateLimited(identifier, {
                windowMs: 60000,
                maxRequests: 5,
                keyPrefix: 'prefix2',
            });

            expect(result1.remaining).toBe(4);
            expect(result2.remaining).toBe(4);
        });
    });

    describe('getClientIP', () => {
        it('should extract IP from x-forwarded-for header', () => {
            const request = {
                headers: new Map([
                    ['x-forwarded-for', '192.168.1.1, 10.0.0.1'],
                ]),
            } as unknown as { headers: { get: (name: string) => string | null } };

            const result = getClientIP(request as unknown as Request);
            expect(result).toBe('192.168.1.1');
        });

        it('should sanitize x-forwarded-for with malicious content', () => {
            const request = {
                headers: new Map([
                    ['x-forwarded-for', "192.168.1.1'; DROP TABLE users;--"],
                ]),
            } as unknown as { headers: { get: (name: string) => string | null } };

            const result = getClientIP(request as unknown as Request);
            expect(result).toBe('unknown');
        });

        it('should extract IP from x-real-ip header', () => {
            const request = {
                headers: new Map([
                    ['x-real-ip', '10.0.0.1'],
                ]),
            } as unknown as { headers: { get: (name: string) => string | null } };

            const result = getClientIP(request as unknown as Request);
            expect(result).toBe('10.0.0.1');
        });

        it('should return unknown when no valid headers present', () => {
            const request = {
                headers: {
                    get: () => null,
                },
            } as unknown as { headers: { get: (name: string) => string | null } };

            const result = getClientIP(request as unknown as Request);
            expect(result).toBe('unknown');
        });
    });

    describe('validateBotProtection', () => {
        it('should pass when honeypot field is empty', () => {
            expect(validateBotProtection(undefined)).toBe(true);
            expect(validateBotProtection('')).toBe(true);
        });

        it('should fail when honeypot field is filled (bot detected)', () => {
            expect(validateBotProtection('bot')).toBe(false);
            expect(validateBotProtection('some value')).toBe(false);
            expect(validateBotProtection('   ')).toBe(false);
        });
    });
});
