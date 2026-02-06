"use client";

/**
 * Theme Toggle Component
 * Modern dark mode toggle following 2024 UX best practices:
 * - Respects system prefers-color-scheme
 * - Persists user choice in localStorage
 * - Smooth CSS transitions
 * - Accessible keyboard navigation
 */

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
    const [mounted, setMounted] = useState(false);

    // Load theme on mount
    useEffect(() => {
        setMounted(true);

        // Check localStorage first
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else {
            // Fall back to system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const systemTheme = prefersDark ? 'dark' : 'light';
            setTheme(systemTheme);
            document.documentElement.classList.toggle('dark', prefersDark);
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        //  Update document class
        document.documentElement.classList.toggle('dark');

        // Persist to localStorage
        localStorage.setItem('theme', newTheme);
    };

    // Prevent hydration mismatch
    if (!mounted || theme === null) {
        return (
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
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
