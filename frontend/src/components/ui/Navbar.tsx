"use client";

/**
 * Unified Navbar Component - Apple-Inspired Design
 * Features:
 * - Glassmorphism effect with subtle blur
 * - Theme-aware colors using CSS variables
 * - Smooth transitions and micro-interactions
 * - 44px touch targets for mobile accessibility
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { Home, User, LogOut, LogIn, Menu, X } from 'lucide-react';
import { logger } from '@/lib/logger';

const Navbar: React.FC = () => {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const isLoading = status === 'loading';
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auto-close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Track scroll for glass effect intensity
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        logger.info('[Navbar] User signing out');
        await signOut({ callbackUrl: '/' });
    };

    const navLinkClass = (path: string) => {
        const isActive = pathname === path;
        return `
            px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] flex items-center
            ${isActive
                ? 'text-[var(--primary)] bg-[var(--primary)]/10'
                : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
            }
        `.trim();
    };

    return (
        <>
            <nav
                className={`
                    fixed top-0 left-0 right-0 z-50 transition-all duration-300
                    ${isScrolled
                        ? 'shadow-[var(--shadow-md)]'
                        : ''
                    }
                `}
                style={{
                    background: isScrolled ? 'var(--glass-bg)' : 'var(--background)',
                    backdropFilter: isScrolled ? 'blur(var(--glass-blur))' : 'none',
                    WebkitBackdropFilter: isScrolled ? 'blur(var(--glass-blur))' : 'none',
                    borderBottom: `1px solid ${isScrolled ? 'var(--glass-border)' : 'var(--border)'}`,
                }}
            >
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Logo and Home */}
                        <div className="flex items-center gap-6">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-xl font-bold transition-all duration-200 hover:opacity-80"
                                style={{ color: 'var(--foreground)' }}
                            >
                                <Home size={24} style={{ color: 'var(--primary)' }} />
                                <span className="hidden sm:inline">CV-Wiz</span>
                            </Link>

                            {/* Desktop Navigation Links (only if logged in) */}
                            {session && (
                                <div className="hidden md:flex items-center gap-1">
                                    <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                                        Dashboard
                                    </Link>
                                    <Link href="/profile" className={navLinkClass('/profile')}>
                                        Profile
                                    </Link>
                                    <Link href="/templates" className={navLinkClass('/templates')}>
                                        Templates
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Right: Theme Toggle and Auth */}
                        <div className="flex items-center gap-2">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Loading State */}
                            {isLoading && (
                                <div
                                    className="w-24 h-9 animate-pulse rounded-xl skeleton"
                                />
                            )}

                            {/* Not Logged In */}
                            {!isLoading && !session && (
                                <div className="hidden sm:flex items-center gap-2">
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-xl transition-all duration-200 hover:opacity-80"
                                        style={{ color: 'var(--foreground-secondary)' }}
                                    >
                                        <LogIn size={18} />
                                        <span>Sign In</span>
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl transition-all duration-200 hover:opacity-90 gradient-primary"
                                        style={{ color: 'var(--primary-foreground)' }}
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}

                            {/* Logged In */}
                            {!isLoading && session && (
                                <div className="hidden sm:flex items-center gap-2">
                                    {/* User Info */}
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 min-h-[44px]"
                                        style={{
                                            background: pathname === '/profile' ? 'var(--muted)' : 'transparent',
                                        }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold gradient-primary"
                                            style={{ color: 'var(--primary-foreground)' }}
                                        >
                                            {session.user?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
                                        </div>
                                        <span
                                            className="text-sm font-medium"
                                            style={{ color: 'var(--foreground)' }}
                                        >
                                            {session.user?.name || 'User'}
                                        </span>
                                    </Link>

                                    {/* Sign Out */}
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-xl transition-all duration-200 hover:bg-[var(--muted)]"
                                        style={{ color: 'var(--foreground-secondary)' }}
                                        aria-label="Sign out"
                                    >
                                        <LogOut size={18} />
                                        <span className="hidden lg:inline">Sign Out</span>
                                    </button>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200"
                                style={{
                                    background: isMobileMenuOpen ? 'var(--muted)' : 'transparent',
                                    color: 'var(--foreground)',
                                }}
                                aria-label="Toggle menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Spacer for fixed navbar */}
            <div className="h-16" />

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-x-0 top-16 z-40 md:hidden animate-fade-in"
                    style={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(var(--glass-blur))',
                        WebkitBackdropFilter: 'blur(var(--glass-blur))',
                        borderBottom: '1px solid var(--glass-border)',
                    }}
                >
                    <div className="px-4 py-4 space-y-2">
                        {session && (
                            <>
                                <Link
                                    href="/dashboard"
                                    className={navLinkClass('/dashboard')}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/profile"
                                    className={navLinkClass('/profile')}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    href="/templates"
                                    className={navLinkClass('/templates')}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Templates
                                </Link>
                                <hr style={{ borderColor: 'var(--border)' }} />
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        handleSignOut();
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium rounded-xl transition-all"
                                    style={{ color: 'var(--destructive)' }}
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </>
                        )}
                        {!session && !isLoading && (
                            <>
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium rounded-xl"
                                    style={{ color: 'var(--foreground)' }}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <LogIn size={18} />
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold rounded-xl gradient-primary"
                                    style={{ color: 'var(--primary-foreground)' }}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
