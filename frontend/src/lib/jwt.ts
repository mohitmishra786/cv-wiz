/**
 * JWT Token Utilities
 * Helper functions for working with JWT tokens between frontend and backend
 */

import { SignJWT } from 'jose';

/**
 * Generate a JWT token for backend authentication
 * Uses the same secret as NextAuth to ensure compatibility
 */
export async function generateBackendToken(
    userId: string,
    email?: string | null
): Promise<string> {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    
    if (!secret) {
        throw new Error('AUTH_SECRET or NEXTAUTH_SECRET is not configured');
    }
    
    // Create JWT signed with the same secret as NextAuth
    const token = await new SignJWT({
        sub: userId,
        email: email,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(secret));
    
    return token;
}
