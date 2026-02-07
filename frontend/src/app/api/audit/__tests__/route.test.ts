"""
Tests for Audit Log API Security
"""
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/audit/route';

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
        },
        auditLog: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

describe('Audit API Security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/audit', () => {
        it('should reject unauthenticated requests', async () => {
            (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/audit');
            const response = await GET(request);

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });

        it('should reject non-admin users', async () => {
            (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
                user: { id: 'user-123' },
            });
            (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
                role: 'USER',
            });

            const request = new NextRequest('http://localhost:3000/api/audit');
            const response = await GET(request);

            expect(response.status).toBe(403);
            const data = await response.json();
            expect(data.error).toContain('Forbidden');
        });

        it('should allow admin users', async () => {
            (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
                user: { id: 'admin-123' },
            });
            (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
                role: 'ADMIN',
            });
            (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            const request = new NextRequest('http://localhost:3000/api/audit');
            const response = await GET(request);

            expect(response.status).toBe(200);
        });
    });

    describe('DELETE /api/audit', () => {
        it('should reject unauthenticated requests', async () => {
            (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/audit');
            const response = await DELETE(request);

            expect(response.status).toBe(401);
        });

        it('should reject non-admin users', async () => {
            (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
                user: { id: 'user-123' },
            });
            (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
                role: 'USER',
            });

            const request = new NextRequest('http://localhost:3000/api/audit');
            const response = await DELETE(request);

            expect(response.status).toBe(403);
        });
    });
});
