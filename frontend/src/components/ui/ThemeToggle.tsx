"use client";

/**
 * Theme Toggle Component
 * Modern dark mode toggle following 2024 UX best practices:
 * - Respects system prefers-color-scheme
 * - Persists user choice in localStorage
 * - Smooth CSS transitions
 * - Accessible keyboard navigation
 * - Syncs with ThemeProvider using data-theme attribute
 */

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
    const [mounted, setMounted] = useState(false);

    // Load theme on mount
    useEffect(() => {
        setMounted(true);

        // Check localStorage first (use same key as ThemeProvider)
        const savedTheme = localStorage.getItem('cv-wiz-theme') as 'light' | 'dark' | null;

        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Fall back to system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const systemTheme = prefersDark ? 'dark' : 'light';
            setTheme(systemTheme);
            document.documentElement.setAttribute('data-theme', systemTheme);
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        // Update document data-theme attribute (not class)
        document.documentElement.setAttribute('data-theme', newTheme);

        // Persist to localStorage (use same key as ThemeProvider)
        localStorage.setItem('cv-wiz-theme', newTheme);
    };

    // Prevent hydration mismatch
    if (!mounted || theme === null) {
        return (
            <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: 'var(--muted)' }} />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
                borderColor: 'var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                '--tw-ring-color': 'var(--primary)',
                '--tw-ring-offset-color': 'var(--background)'
            } as React.CSSProperties}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {/* Animated icon */}
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 transition-all duration-300 ${theme === 'light'
                            ? 'opacity-100 rotate-0 scale-100'
                            : 'opacity-0 rotate-90 scale-0'
                        }`}
                    size={20}
                />
                <Moon
                    className={`absolute inset-0 transition-all duration-300 ${theme === 'dark'
                            ? 'opacity-100 rotate-0 scale-100'
                            : 'opacity-0 -rotate-90 scale-0'
                        }`}
                    size={20}
                />
            </div>
        </button>
    );
};

export default ThemeToggle;
