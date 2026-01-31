/**
 * Theme Provider Tests
 * Tests for theme switching, persistence, and system preference detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme, ThemeToggle } from '../../ThemeProvider';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock matchMedia
const matchMediaMock = vi.fn();
Object.defineProperty(window, 'matchMedia', {
    value: matchMediaMock,
});

// Test component that uses the theme
function TestComponent() {
    const { theme, toggleTheme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme-value">{theme}</span>
            <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
            <button data-testid="set-light-btn" onClick={() => setTheme('light')}>Light</button>
            <button data-testid="set-dark-btn" onClick={() => setTheme('dark')}>Dark</button>
        </div>
    );
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.documentElement.removeAttribute('data-theme');
    });

    afterEach(() => {
        document.documentElement.removeAttribute('data-theme');
    });

    it('should initialize with stored theme preference', async () => {
        localStorageMock.getItem.mockReturnValue('dark');
        matchMediaMock.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('theme-value').textContent).toBe('dark');
        });
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should use system preference when no stored preference', async () => {
        localStorageMock.getItem.mockReturnValue(null);
        matchMediaMock.mockReturnValue({ 
            matches: true, 
            addEventListener: vi.fn(), 
            removeEventListener: vi.fn() 
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('theme-value').textContent).toBe('dark');
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cv-wiz-theme', 'dark');
    });

    it('should toggle theme', async () => {
        localStorageMock.getItem.mockReturnValue('light');
        matchMediaMock.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('theme-value').textContent).toBe('light');
        });

        fireEvent.click(screen.getByTestId('toggle-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('theme-value').textContent).toBe('dark');
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cv-wiz-theme', 'dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should set theme directly', async () => {
        localStorageMock.getItem.mockReturnValue('light');
        matchMediaMock.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('theme-value').textContent).toBe('light');
        });

        fireEvent.click(screen.getByTestId('set-dark-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('theme-value').textContent).toBe('dark');
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('cv-wiz-theme', 'dark');
    });

    it('should throw error when useTheme is used outside ThemeProvider', () => {
        // Suppress console.error for this test
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        function InvalidComponent() {
            useTheme();
            return null;
        }

        expect(() => render(<InvalidComponent />)).toThrow('useTheme must be used within a ThemeProvider');

        consoleError.mockRestore();
    });
});

describe('ThemeToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.documentElement.removeAttribute('data-theme');
    });

    it('should render icon variant by default', async () => {
        localStorageMock.getItem.mockReturnValue('light');
        matchMediaMock.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });

        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
        });
    });

    it('should render button variant with text', async () => {
        localStorageMock.getItem.mockReturnValue('light');
        matchMediaMock.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });

        render(
            <ThemeProvider>
                <ThemeToggle variant="button" />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Dark Mode')).toBeInTheDocument();
        });
    });

    it('should toggle theme when clicked', async () => {
        localStorageMock.getItem.mockReturnValue('light');
        matchMediaMock.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });

        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText('Switch to dark mode'));

        await waitFor(() => {
            expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
        });
    });

    it('should show correct icon for dark mode', async () => {
        localStorageMock.getItem.mockReturnValue('dark');
        matchMediaMock.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });

        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
        });
    });
});
