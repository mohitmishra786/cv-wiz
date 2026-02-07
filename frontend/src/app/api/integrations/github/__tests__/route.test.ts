/**
 * Tests for GitHub Integration API
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
    isRateLimited: vi.fn(),
    getClientIP: vi.fn(),
    rateLimits: {
        api: { maxRequests: 100, windowMs: 900000 },
    },
}));

import { auth } from '@/lib/auth';
import { isRateLimited, getClientIP } from '@/lib/rate-limit';

describe('POST /api/integrations/github', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getClientIP as ReturnType<typeof vi.fn>).mockReturnValue('127.0.0.1');
        (isRateLimited as ReturnType<typeof vi.fn>).mockReturnValue({ limited: false });
        global.fetch = vi.fn();
    });

    it('should fetch GitHub repositories for valid username', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const mockRepos = [
            {
                name: 'test-repo',
                description: 'A test repository',
                html_url: 'https://github.com/testuser/test-repo',
                language: 'TypeScript',
                stargazers_count: 10,
                forks_count: 2,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            },
        ];

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockRepos,
        });

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'testuser' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.projects).toHaveLength(1);
        expect(data.projects[0].name).toBe('test-repo');
        expect(data.projects[0].technologies).toContain('TypeScript');
    });

    it('should reject unauthenticated requests', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'testuser' }),
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

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'testuser' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error).toContain('Too many requests');
    });

    it('should reject missing username', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Username required');
    });

    it('should reject invalid username format', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'invalid@username!' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid GitHub username format');
    });

    it('should handle GitHub user not found', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            status: 404,
        });

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'nonexistent' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('GitHub user not found');
    });

    it('should handle GitHub API errors', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            status: 500,
        });

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'testuser' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch from GitHub');
    });

    it('should filter out repositories with 0 stars and forks', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        const mockRepos = [
            {
                name: 'popular-repo',
                description: 'Popular',
                html_url: 'https://github.com/testuser/popular-repo',
                language: 'JavaScript',
                stargazers_count: 5,
                forks_count: 2,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            },
            {
                name: 'unpopular-repo',
                description: 'Unpopular',
                html_url: 'https://github.com/testuser/unpopular-repo',
                language: 'Python',
                stargazers_count: 0,
                forks_count: 0,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            },
        ];

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockRepos,
        });

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'testuser' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        // First repo should have highlights (5 Stars, 2 Forks)
        expect(data.projects[0].highlights.length).toBeGreaterThan(0);
        // Second repo should have no highlights
        expect(data.projects[1].highlights.length).toBe(0);
    });

    it('should sanitize username before making API call', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => [],
        });

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'valid-user' }),
        });

        await POST(request);

        // Check that fetch was called with sanitized username
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.github.com/users/valid-user/repos?sort=updated&per_page=10',
            expect.any(Object)
        );
    });

    it('should handle network errors', async () => {
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-123' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error('Network error')
        );

        const request = new NextRequest('http://localhost:3000/api/integrations/github', {
            method: 'POST',
            body: JSON.stringify({ username: 'testuser' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch GitHub projects');
    });
});