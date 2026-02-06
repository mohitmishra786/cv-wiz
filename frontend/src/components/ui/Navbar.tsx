"use client";

/**
 * Unified Navbar Component
 * Full-width navigation with theme toggle, authentication state, and home link
 * - Session-aware (shows user info when logged in)
 * - Theme toggle with smooth transitions
 * - Responsive design
 * - Full-width layout
 */

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { Home, User, LogOut, LogIn } from 'lucide-react';
import { logger } from '@/lib/logger';

const Navbar: React.FC = () => {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const isLoading = status === 'loading';

    const handleSignOut = async () => {
        logger.info('[Navbar] User signing out');
        await signOut({ callbackUrl: '/' });
    };

    return (
        <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo and Home */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <Home size={24} />
                            <span className="hidden sm:inline">CV-Wiz</span>
                        </Link>

                        {/* Desktop Navigation Links (only if logged in) */}
                        {session && (
                            <div className="hidden md:flex items-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/dashboard'
                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/profile"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/profile'
                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    Profile
                                </Link>
                                <Link
                                    href="/templates"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/templates'
                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    Templates
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right: Theme Toggle and Auth */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Loading State */}
                        {isLoading && (
                            <div className="w-24 h-9 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
                        )}

                        {/* Not Logged In */}
                        {!isLoading && !session && (
                            <>
                                <Link
                                    href="/login"
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                    <LogIn size={18} />
                                    <span>Sign In</span>
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}

                        {/* Logged In */}
                        {!isLoading && session && (
                            <div className="flex items-center gap-3">
                                {/* User Info */}
                                <Link
                                    href="/profile"
                                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                        {session.user?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {session.user?.name || 'User'}
                                    </span>
                                </Link>

                                {/* Sign Out */}
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    aria-label="Sign out"
                                >
                                    <LogOut size={18} />
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
