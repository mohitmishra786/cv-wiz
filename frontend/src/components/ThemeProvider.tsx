'use client';

/**
 * Theme Provider Component
 * Manages light/dark mode with persistence
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('cv-wiz-theme') as Theme;
    // Only use stored value if it's a valid user preference (light/dark), not system
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cv-wiz-theme', theme);
        // Defer setMounted to avoid synchronous setState in effect
        requestAnimationFrame(() => setMounted(true));

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            // Only update if user hasn't manually set a preference (light or dark)
            const userPreference = localStorage.getItem('cv-wiz-theme');
            if (userPreference !== 'light' && userPreference !== 'dark') {
                const newTheme: Theme = e.matches ? 'dark' : 'light';
                setThemeState(newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('cv-wiz-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

/**
 * Theme Toggle Button Component
 */
interface ThemeToggleProps {
    variant?: 'icon' | 'button';
    className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    const icon = theme === 'light' ? (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    ) : (
        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );

    if (variant === 'button') {
        return (
            <button
                onClick={toggleTheme}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    bg-[var(--muted)] hover:bg-[var(--border)]
                    text-[var(--foreground)]
                    transition-all duration-300 ease-in-out
                    ${className}
                `}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {icon}
                <span className="text-sm font-medium">
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={`
                p-2 rounded-lg
                bg-[var(--muted)] hover:bg-[var(--border)]
                text-[var(--foreground)]
                transition-all duration-300 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
                ${className}
            `}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {icon}
        </button>
    );
}
