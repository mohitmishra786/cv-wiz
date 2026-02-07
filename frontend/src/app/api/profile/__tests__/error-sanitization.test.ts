import { describe, it, expect } from 'vitest';

function sanitizeError(error: unknown): { message: string; code: string } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string }).code || 'UNKNOWN_ERROR';

    const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /api[_-]?key/i,
        /credential/i,
        /connection string/i,
        /database/i,
        /prisma/i,
        /at\s+.*\.ts:?\d*/,
        /\/[a-zA-Z0-9_/-]+\.(ts|js):\d+:\d+/,
    ];

    if (sensitivePatterns.some(pattern => pattern.test(errorMessage))) {
        return { message: 'An internal error occurred', code: errorCode };
    }

    return { message: 'An internal error occurred', code: errorCode };
}

describe('Error Message Sanitization', () => {
    describe('sanitizeError', () => {
        it('should sanitize error messages with sensitive data', () => {
            const sensitiveErrors = [
                new Error('Password validation failed: password is too short'),
                new Error('Invalid API key: sk-1234567890abcdef'),
                new Error('Database connection failed: connection string invalid'),
                new Error('Prisma error: Unique constraint failed'),
                new Error('Secret validation error at src/auth.ts:42:15'),
                new Error('Token expired'),
                new Error('Credential storage failed'),
            ];

            sensitiveErrors.forEach(error => {
                const result = sanitizeError(error);
                expect(result.message).toBe('An internal error occurred');
                expect(result.code).toBeDefined();
            });
        });

        it('should sanitize stack traces', () => {
            const errorWithStack = new Error('Something went wrong');
            errorWithStack.stack = 'Error: Something went wrong\n    at /app/src/auth.ts:42:15\n    at /app/src/middleware.ts:10:8';

            const result = sanitizeError(errorWithStack);
            expect(result.message).toBe('An internal error occurred');
        });

        it('should sanitize generic errors without sensitive data', () => {
            const genericErrors = [
                new Error('Invalid input data'),
                new Error('User not found'),
                new Error('Rate limit exceeded'),
                new Error('Unauthorized access'),
            ];

            genericErrors.forEach(error => {
                const result = sanitizeError(error);
                expect(result.message).toBe('An internal error occurred');
            });
        });

        it('should handle non-Error objects', () => {
            const result = sanitizeError('Some error string');
            expect(result.message).toBe('An internal error occurred');
            expect(result.code).toBe('UNKNOWN_ERROR');
        });

        it('should extract error code when present', () => {
            const error = new Error('Something failed');
            (error as Error & { code: string }).code = 'P2002';

            const result = sanitizeError(error);
            expect(result.code).toBe('P2002');
        });

        it('should use UNKNOWN_ERROR when no code is present', () => {
            const error = new Error('Something failed');

            const result = sanitizeError(error);
            expect(result.code).toBe('UNKNOWN_ERROR');
        });

        it('should detect case-insensitive sensitive patterns', () => {
            const errors = [
                new Error('PASSWORD must be provided'),
                new Error('SECRET key missing'),
                new Error('DATABASE connection error'),
            ];

            errors.forEach(error => {
                const result = sanitizeError(error);
                expect(result.message).toBe('An internal error occurred');
            });
        });
    });
});
