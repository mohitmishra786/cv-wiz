import { NextRequest, NextResponse } from 'next/server';

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
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const repos = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projects = repos.map((repo: any) => ({
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
        console.error('GitHub API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}