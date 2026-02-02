/**
 * NextAuth.js v5 Configuration
 * Supports Google OAuth and Credentials (email/password)
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: 'Email',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required');
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.passwordHash) {
                    throw new Error('Invalid email or password');
                }

                // Verify password
                const isValid = await bcrypt.compare(password, user.passwordHash);

                if (!isValid) {
                    throw new Error('Invalid email or password');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
            }
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session as any).accessToken = token.accessToken;
                (session as any).idToken = token.idToken;
            }
            return session;
        },
    },
});
