import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 });
        }

        const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'CV-Wiz-App'
            }
        });

        if (res.status === 404) {
            return NextResponse.json({ error: 'GitHub user not found' }, { status: 404 });
        }

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch from GitHub' }, { status: res.status });
        }

        const repos = await res.json();
        const projects = repos.map((repo: { name: string; description: string | null; html_url: string; language: string | null; stargazers_count: number; forks_count: number; updated_at: string; created_at: string }) => ({
            name: repo.name,
            description: repo.description || '',
            url: repo.html_url,
            startDate: repo.created_at,
            technologies: [repo.language].filter(Boolean),
            highlights: [
                `${repo.stargazers_count} Stars`,
                `${repo.forks_count} Forks`
            ].filter(s => !s.startsWith('0 ')), // Only show if > 0
        }));

        return NextResponse.json({ projects });
    } catch (error) {
        logger.error('[GitHub] API request failed', { error });
        return NextResponse.json({ error: 'Failed to fetch GitHub projects' }, { status: 500 });
    }
}