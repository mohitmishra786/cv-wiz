/**
 * Responsive Utilities Tests
 */

import {
    breakpoints,
    minWidth,
    maxWidth,
    between,
    getResponsiveValue,
    getGridClasses,
    getFontSizeClasses,
    getPaddingClasses,
    getMarginClasses,
    responsivePatterns,
    isTouchDevice,
    getSafeAreaInsets,
} from '../responsive';

// ============================================================================
// Breakpoint Tests
// ============================================================================

describe('breakpoints', () => {
    it('has correct breakpoint values', () => {
        expect(breakpoints.sm).toBe(640);
        expect(breakpoints.md).toBe(768);
        expect(breakpoints.lg).toBe(1024);
        expect(breakpoints.xl).toBe(1280);
        expect(breakpoints['2xl']).toBe(1536);
    });
});

// ============================================================================
// Media Query Helper Tests
// ============================================================================

describe('minWidth', () => {
    it('creates correct min-width media query', () => {
        expect(minWidth('sm')).toBe('(min-width: 640px)');
        expect(minWidth('md')).toBe('(min-width: 768px)');
        expect(minWidth('lg')).toBe('(min-width: 1024px)');
    });
});

describe('maxWidth', () => {
    it('creates correct max-width media query', () => {
        expect(maxWidth('sm')).toBe('(max-width: 639px)');
        expect(maxWidth('md')).toBe('(max-width: 767px)');
        expect(maxWidth('lg')).toBe('(max-width: 1023px)');
    });
});

describe('between', () => {
    it('creates correct range media query', () => {
        expect(between('sm', 'md')).toBe('(min-width: 640px) and (max-width: 767px)');
        expect(between('md', 'lg')).toBe('(min-width: 768px) and (max-width: 1023px)');
    });
});

// ============================================================================
// Responsive Value Tests
// ============================================================================

describe('getResponsiveValue', () => {
    it('returns static value directly', () => {
        expect(getResponsiveValue('test', 'md')).toBe('test');
        expect(getResponsiveValue(42, 'lg')).toBe(42);
    });

    it('returns value for exact breakpoint match', () => {
        const value = { sm: 'small', md: 'medium', lg: 'large' };
        expect(getResponsiveValue(value, 'md')).toBe('medium');
    });

    it('falls back to smaller breakpoint when exact match not found', () => {
        const value = { sm: 'small', lg: 'large' };
        expect(getResponsiveValue(value, 'md')).toBe('small');
    });

    it('returns first available value when no smaller breakpoint exists', () => {
        const value = { xl: 'extra-large' };
        expect(getResponsiveValue(value, 'sm')).toBe('extra-large');
    });
});

// ============================================================================
// Grid Classes Tests
// ============================================================================

describe('getGridClasses', () => {
    it('generates single column class', () => {
        const result = getGridClasses({ base: 1 });
        expect(result).toBe('grid-cols-1');
    });

    it('generates responsive grid classes', () => {
        const result = getGridClasses({ base: 1, sm: 2, md: 3, lg: 4 });
        expect(result).toBe('grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4');
    });

    it('includes 2xl breakpoint', () => {
        const result = getGridClasses({ base: 1, '2xl': 6 });
        expect(result).toBe('grid-cols-1 2xl:grid-cols-6');
    });
});

// ============================================================================
// Font Size Classes Tests
// ============================================================================

describe('getFontSizeClasses', () => {
    it('generates base font size class', () => {
        const result = getFontSizeClasses({ base: 'text-sm' });
        expect(result).toBe('text-sm');
    });

    it('generates responsive font size classes', () => {
        const result = getFontSizeClasses({
            base: 'text-sm',
            sm: 'text-base',
            md: 'text-lg',
            lg: 'text-xl',
        });
        expect(result).toBe('text-sm sm:text-base md:text-lg lg:text-xl');
    });
});

// ============================================================================
// Spacing Classes Tests
// ============================================================================

describe('getPaddingClasses', () => {
    it('generates base padding class', () => {
        const result = getPaddingClasses({ base: 'p-4' });
        expect(result).toBe('p-4');
    });

    it('generates responsive padding classes', () => {
        const result = getPaddingClasses({
            base: 'p-4',
            sm: 'p-6',
            md: 'p-8',
        });
        expect(result).toBe('p-4 sm:p-6 md:p-8');
    });
});

describe('getMarginClasses', () => {
    it('generates base margin class', () => {
        const result = getMarginClasses({ base: 'm-4' });
        expect(result).toBe('m-4');
    });

    it('generates responsive margin classes', () => {
        const result = getMarginClasses({
            base: 'm-4',
            md: 'm-6',
            lg: 'm-8',
            xl: 'm-10',
        });
        expect(result).toBe('m-4 md:m-6 lg:m-8 xl:m-10');
    });
});

// ============================================================================
// Responsive Patterns Tests
// ============================================================================

describe('responsivePatterns', () => {
    it('has cardGrid pattern', () => {
        expect(responsivePatterns.cardGrid).toContain('grid-cols-1');
        expect(responsivePatterns.cardGrid).toContain('sm:grid-cols-2');
        expect(responsivePatterns.cardGrid).toContain('lg:grid-cols-3');
        expect(responsivePatterns.cardGrid).toContain('xl:grid-cols-4');
    });

    it('has formGrid pattern', () => {
        expect(responsivePatterns.formGrid).toContain('grid-cols-1');
        expect(responsivePatterns.formGrid).toContain('md:grid-cols-2');
    });

    it('has dashboardStats pattern', () => {
        expect(responsivePatterns.dashboardStats).toContain('grid-cols-1');
        expect(responsivePatterns.dashboardStats).toContain('sm:grid-cols-2');
        expect(responsivePatterns.dashboardStats).toContain('lg:grid-cols-4');
    });

    it('has navItems pattern', () => {
        expect(responsivePatterns.navItems).toBe('flex-col md:flex-row');
    });

    it('has navHidden pattern', () => {
        expect(responsivePatterns.navHidden).toBe('hidden md:flex');
    });

    it('has navVisible pattern', () => {
        expect(responsivePatterns.navVisible).toBe('flex md:hidden');
    });
});

// ============================================================================
// Touch Device Tests
// ============================================================================

describe('isTouchDevice', () => {
    it('returns false when window is undefined', () => {
        // Mock window as undefined
        const originalWindow = global.window;
        // @ts-expect-error - Testing undefined window
        global.window = undefined;
        expect(isTouchDevice()).toBe(false);
        global.window = originalWindow;
    });

    it('returns true when ontouchstart exists', () => {
        Object.defineProperty(window, 'ontouchstart', {
            value: () => {},
            writable: true,
            configurable: true,
        });
        expect(isTouchDevice()).toBe(true);
    });
});

// ============================================================================
// Safe Area Tests
// ============================================================================

describe('getSafeAreaInsets', () => {
    it('returns correct env values', () => {
        const insets = getSafeAreaInsets();
        expect(insets.top).toBe('env(safe-area-inset-top)');
        expect(insets.right).toBe('env(safe-area-inset-right)');
        expect(insets.bottom).toBe('env(safe-area-inset-bottom)');
        expect(insets.left).toBe('env(safe-area-inset-left)');
    });
});
