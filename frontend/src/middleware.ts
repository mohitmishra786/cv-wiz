/**
 * Middleware for protecting routes
 * Runs on matched paths before page/API handlers
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
        req.nextUrl.pathname.startsWith('/register');
    const isProtectedPage = req.nextUrl.pathname.startsWith('/profile') ||
        req.nextUrl.pathname.startsWith('/templates') ||
        req.nextUrl.pathname.startsWith('/settings');
    const isProtectedAPI = req.nextUrl.pathname.startsWith('/api/profile');

    // Redirect logged-in users away from auth pages
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/profile', req.nextUrl));
    }

    // Redirect unauthenticated users to login
    if ((isProtectedPage || isProtectedAPI) && !isLoggedIn) {
        if (isProtectedAPI) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/profile/:path*',
        '/templates/:path*',
        '/settings/:path*',
        '/login',
        '/register',
        '/api/profile/:path*',
    ],
};
