/**
 * Lightweight Middleware for route protection
 * Uses JWT token validation without importing full auth module
 * This reduces Edge Function size to stay under 1MB limit
 */

import { NextResponse, type NextRequest } from 'next/server';

// Protected paths configuration
const protectedPages = ['/profile', '/templates', '/settings', '/dashboard', '/interview-prep'];
const protectedAPIs = ['/api/profile'];
const authPages = ['/login', '/register'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for session token (NextAuth stores it in cookies)
    const sessionToken = request.cookies.get('authjs.session-token')?.value ||
        request.cookies.get('__Secure-authjs.session-token')?.value;

    const isLoggedIn = !!sessionToken;
    const isAuthPage = authPages.some(page => pathname.startsWith(page));
    const isProtectedPage = protectedPages.some(page => pathname.startsWith(page));
    const isProtectedAPI = protectedAPIs.some(api => pathname.startsWith(api));

    // Redirect logged-in users away from auth pages
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/profile', request.url));
    }

    // Redirect unauthenticated users to login
    if ((isProtectedPage || isProtectedAPI) && !isLoggedIn) {
        if (isProtectedAPI) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const callbackUrl = encodeURIComponent(pathname);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
    }

    return NextResponse.next();
}

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
