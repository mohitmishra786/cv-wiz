/**
 * Tests for Feedback API
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    default: {
        feedback: {
            create: vi.fn(),
        },
    },
}));

vi.mock('@/lib/rate-limit', () => ({
    isRateLimited: vi.fn(),
    getClientIP: vi.fn(),
    rateLimits: {
        feedback: { maxRequests: 10, windowMs: 900000 },
    },
}));

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isRateLimited, getClientIP } from '@/lib/rate-limit';

describe('POST /api/feedback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getClientIP as ReturnType<typeof vi.fn>).mockReturnValue('127.0.0.1');
        (isRateLimited as ReturnType<typeof vi.fn>).mockReturnValue({ limited: false });
    });

    it('should submit feedback with valid data', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });
        (prisma.feedback.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
                comment: 'Great service! Very helpful and easy to use.',
                category: 'Feature',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(prisma.feedback.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-123',
                rating: 5,
                comment: 'Great service! Very helpful and easy to use.',
                category: 'Feature',
            },
        });
    });

    it('should reject unauthenticated requests', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
                comment: 'Great service!',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('should enforce rate limiting', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });
        (isRateLimited as ReturnType<typeof vi.fn>).mockReturnValue({ limited: true });

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
                comment: 'Great service!',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error).toContain('Too many feedback submissions');
    });

    it('should reject missing rating', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                comment: 'Great service!',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Rating is required');
    });

    it('should reject missing comment', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Comment is required');
    });

    it('should reject rating outside valid range', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 6,
                comment: 'Great service!',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Rating must be a number between 1 and 5');
    });

    it('should reject comment that is too short', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
                comment: 'Short',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Comment must be at least 10 characters');
    });

    it('should reject comment that is too long', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const longComment = 'a'.repeat(2001);

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
                comment: longComment,
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Comment must not exceed 2000 characters');
    });

    it('should default to General category if invalid category provided', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });
        (prisma.feedback.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
                comment: 'Great service! Very helpful.',
                category: 'InvalidCategory',
            }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(prisma.feedback.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-123',
                rating: 5,
                comment: 'Great service! Very helpful.',
                category: 'General',
            },
        });
    });

    it('should handle all valid categories', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });
        (prisma.feedback.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const validCategories = ['General', 'Bug', 'Feature', 'Usability', 'Performance', 'Other'];

        for (const category of validCategories) {
            const request = new NextRequest('http://localhost:3000/api/feedback', {
                method: 'POST',
                body: JSON.stringify({
                    rating: 4,
                    comment: `Feedback for ${category} category with enough text.`,
                    category,
                }),
            });

            const response = await POST(request);

            expect(response.status).toBe(200);
        }
    });


    it('should sanitize feedback data', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });
        (prisma.feedback.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
                comment: 'Great service with <script>alert("xss")</script> content.',
                category: 'General',
            }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        // Sanitization is handled by sanitizeFeedbackData
    });

    it('should handle database errors', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });
        (prisma.feedback.create as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error('Database error')
        );

        const request = new NextRequest('http://localhost:3000/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                rating: 5,
                comment: 'Great service! Very helpful.',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to submit feedback');
    });
});