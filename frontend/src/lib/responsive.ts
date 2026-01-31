/**
 * Responsive Utilities
 * Provides responsive design helpers and breakpoints for mobile-first development
 */

import { useState, useEffect } from 'react';

// ============================================================================
// Breakpoints (matching Tailwind defaults)
// ============================================================================

export const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// ============================================================================
// Media Query Helpers
// ============================================================================

/**
 * Create a media query string for a minimum width breakpoint
 */
export function minWidth(breakpoint: Breakpoint): string {
    return `(min-width: ${breakpoints[breakpoint]}px)`;
}

/**
 * Create a media query string for a maximum width breakpoint
 */
export function maxWidth(breakpoint: Breakpoint): string {
    return `(max-width: ${breakpoints[breakpoint] - 1}px)`;
}

/**
 * Create a media query string for a range between two breakpoints
 */
export function between(min: Breakpoint, max: Breakpoint): string {
    return `(min-width: ${breakpoints[min]}px) and (max-width: ${breakpoints[max] - 1}px)`;
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * useMediaQuery hook
 * Returns true if the media query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        const media = window.matchMedia(query);

        // Create listener
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

        // Add listener
        media.addEventListener('change', listener);

        // Cleanup
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}

/**
 * useBreakpoint hook
 * Returns true if current viewport is at least the specified breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
    return useMediaQuery(minWidth(breakpoint));
}

/**
 * useIsMobile hook
 * Returns true if viewport is mobile (less than md breakpoint)
 */
export function useIsMobile(): boolean {
    return useMediaQuery(maxWidth('md'));
}

/**
 * useIsTablet hook
 * Returns true if viewport is tablet (between md and lg)
 */
export function useIsTablet(): boolean {
    return useMediaQuery(between('md', 'lg'));
}

/**
 * useIsDesktop hook
 * Returns true if viewport is desktop (at least lg breakpoint)
 */
export function useIsDesktop(): boolean {
    return useBreakpoint('lg');
}

/**
 * useViewport hook
 * Returns current viewport dimensions
 */
export function useViewport() {
    const [dimensions, setDimensions] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return dimensions;
}

/**
 * useOrientation hook
 * Returns current screen orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
        if (typeof window === 'undefined') return 'portrait';
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    });

    useEffect(() => {
        const handleResize = () => {
            setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return orientation;
}

// ============================================================================
// Touch and Mobile Detection
// ============================================================================

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * useTouchDevice hook
 * Returns true if device supports touch
 */
export function useTouchDevice(): boolean {
    const [isTouch, setIsTouch] = useState(() => isTouchDevice());

    useEffect(() => {
        requestAnimationFrame(() => setIsTouch(isTouchDevice()));
    }, []);

    return isTouch;
}

/**
 * useHoverCapability hook
 * Returns true if device supports hover (non-touch)
 */
export function useHoverCapability(): boolean {
    const [canHover, setCanHover] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(hover: hover)').matches;
    });

    useEffect(() => {
        const media = window.matchMedia('(hover: hover)');

        const listener = (e: MediaQueryListEvent) => setCanHover(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    return canHover;
}

// ============================================================================
// Responsive Value Helpers
// ============================================================================

export type ResponsiveValue<T> = T | { [K in Breakpoint]?: T };

/**
 * Get the appropriate value for the current breakpoint
 */
export function getResponsiveValue<T>(
    value: ResponsiveValue<T>,
    currentBreakpoint: Breakpoint
): T {
    if (typeof value !== 'object' || value === null) {
        return value as T;
    }

    const breakpointsOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointsOrder.indexOf(currentBreakpoint);

    // Find the best matching breakpoint
    for (let i = currentIndex; i >= 0; i--) {
        const bp = breakpointsOrder[i];
        if (bp in value) {
            return (value as { [K in Breakpoint]?: T })[bp] as T;
        }
    }

    // Return the first available value
    const firstKey = Object.keys(value)[0] as Breakpoint;
    return (value as { [K in Breakpoint]?: T })[firstKey] as T;
}

/**
 * useResponsiveValue hook
 * Returns the appropriate value for the current viewport
 */
export function useResponsiveValue<T>(value: ResponsiveValue<T>): T {
    const isMd = useBreakpoint('md');
    const isLg = useBreakpoint('lg');
    const isXl = useBreakpoint('xl');
    const is2xl = useBreakpoint('2xl');

    let currentBreakpoint: Breakpoint = 'sm';
    if (is2xl) currentBreakpoint = '2xl';
    else if (isXl) currentBreakpoint = 'xl';
    else if (isLg) currentBreakpoint = 'lg';
    else if (isMd) currentBreakpoint = 'md';

    return getResponsiveValue(value, currentBreakpoint);
}

// ============================================================================
// Container Queries Helper
// ============================================================================

/**
 * useContainerWidth hook
 * Returns the width of a container element
 */
export function useContainerWidth<T extends HTMLElement>(): [
    React.RefObject<T | null>,
    number
] {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!ref.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(ref.current);
        return () => resizeObserver.disconnect();
    }, []);

    return [ref, width];
}

import { useRef } from 'react';

// ============================================================================
// Safe Area Insets (for notched devices)
// ============================================================================

/**
 * Get CSS env values for safe area insets
 */
export function getSafeAreaInsets() {
    return {
        top: 'env(safe-area-inset-top)',
        right: 'env(safe-area-inset-right)',
        bottom: 'env(safe-area-inset-bottom)',
        left: 'env(safe-area-inset-left)',
    };
}

/**
 * CSS classes for safe area padding
 */
export const safeAreaClasses = {
    top: 'pt-[env(safe-area-inset-top)]',
    right: 'pr-[env(safe-area-inset-right)]',
    bottom: 'pb-[env(safe-area-inset-bottom)]',
    left: 'pl-[env(safe-area-inset-left)]',
    all: 'p-[env(safe-area-inset-top)] [env(safe-area-inset-right)] [env(safe-area-inset-bottom)] [env(safe-area-inset-left)]',
};

// ============================================================================
// Mobile-specific Utilities
// ============================================================================

/**
 * Prevent body scroll when modal is open
 */
export function usePreventBodyScroll(isOpen: boolean): void {
    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);
}

/**
 * useScrollLock hook
 * Locks scroll on the body element
 */
export function useScrollLock(locked: boolean): void {
    useEffect(() => {
        if (locked) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            return () => {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [locked]);
}

// ============================================================================
// Responsive Grid Helpers
// ============================================================================

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12;

export interface ResponsiveGridConfig {
    base?: GridColumns;
    sm?: GridColumns;
    md?: GridColumns;
    lg?: GridColumns;
    xl?: GridColumns;
    '2xl'?: GridColumns;
}

/**
 * Generate Tailwind grid classes
 */
export function getGridClasses(config: ResponsiveGridConfig): string {
    const classes: string[] = [];

    if (config.base) classes.push(`grid-cols-${config.base}`);
    if (config.sm) classes.push(`sm:grid-cols-${config.sm}`);
    if (config.md) classes.push(`md:grid-cols-${config.md}`);
    if (config.lg) classes.push(`lg:grid-cols-${config.lg}`);
    if (config.xl) classes.push(`xl:grid-cols-${config.xl}`);
    if (config['2xl']) classes.push(`2xl:grid-cols-${config['2xl']}`);

    return classes.join(' ');
}

// ============================================================================
// Common Responsive Patterns
// ============================================================================

export const responsivePatterns = {
    // Card grids
    cardGrid: getGridClasses({ base: 1, sm: 2, lg: 3, xl: 4 }),
    cardGridDense: getGridClasses({ base: 1, sm: 2, md: 3, lg: 4 }),

    // Form layouts
    formGrid: getGridClasses({ base: 1, md: 2 }),
    formGridWide: getGridClasses({ base: 1, md: 2, lg: 3 }),

    // Dashboard layouts
    dashboardStats: getGridClasses({ base: 1, sm: 2, lg: 4 }),
    dashboardCharts: getGridClasses({ base: 1, lg: 2 }),

    // List layouts
    listGrid: getGridClasses({ base: 1, md: 2 }),

    // Navigation
    navItems: 'flex-col md:flex-row',
    navHidden: 'hidden md:flex',
    navVisible: 'flex md:hidden',
};

// ============================================================================
// Font Size Helpers
// ============================================================================

export interface ResponsiveFontSize {
    base: string;
    sm?: string;
    md?: string;
    lg?: string;
}

/**
 * Generate responsive font size classes
 */
export function getFontSizeClasses(sizes: ResponsiveFontSize): string {
    const classes: string[] = [sizes.base];

    if (sizes.sm) classes.push(`sm:${sizes.sm}`);
    if (sizes.md) classes.push(`md:${sizes.md}`);
    if (sizes.lg) classes.push(`lg:${sizes.lg}`);

    return classes.join(' ');
}

// ============================================================================
// Spacing Helpers
// ============================================================================

export interface ResponsiveSpacing {
    base: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
}

/**
 * Generate responsive padding classes
 */
export function getPaddingClasses(spacing: ResponsiveSpacing): string {
    const classes: string[] = [spacing.base];

    if (spacing.sm) classes.push(`sm:${spacing.sm}`);
    if (spacing.md) classes.push(`md:${spacing.md}`);
    if (spacing.lg) classes.push(`lg:${spacing.lg}`);
    if (spacing.xl) classes.push(`xl:${spacing.xl}`);

    return classes.join(' ');
}

/**
 * Generate responsive margin classes
 */
export function getMarginClasses(spacing: ResponsiveSpacing): string {
    const classes: string[] = [spacing.base];

    if (spacing.sm) classes.push(`sm:${spacing.sm}`);
    if (spacing.md) classes.push(`md:${spacing.md}`);
    if (spacing.lg) classes.push(`lg:${spacing.lg}`);
    if (spacing.xl) classes.push(`xl:${spacing.xl}`);

    return classes.join(' ');
}

const responsive = {
    breakpoints,
    minWidth,
    maxWidth,
    between,
    useMediaQuery,
    useBreakpoint,
    useIsMobile,
    useIsTablet,
    useIsDesktop,
    useViewport,
    useOrientation,
    isTouchDevice,
    useTouchDevice,
    useHoverCapability,
    getResponsiveValue,
    useResponsiveValue,
    useContainerWidth,
    getSafeAreaInsets,
    safeAreaClasses,
    usePreventBodyScroll,
    useScrollLock,
    getGridClasses,
    responsivePatterns,
    getFontSizeClasses,
    getPaddingClasses,
    getMarginClasses,
};

export default responsive;
