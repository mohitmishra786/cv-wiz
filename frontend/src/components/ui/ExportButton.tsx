'use client';

/**
 * Export Button Component
 * Provides a dropdown button for exporting data in multiple formats
 */

import React, { useState, useRef, useCallback } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
    exportData,
    exportResumeToJSON,
    exportResumeToPDF,
    exportResumeToWord,
    type ExportFormat,
    type ResumeProfile,
} from '@/lib/export';
// Note: useFocusTrap and useKeyboardNavigation are available from keyboardNavigation
// import { useFocusTrap, useKeyboardNavigation } from '@/lib/keyboardNavigation';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ExportButtonProps {
    /**
     * Data to export
     */
    data: Record<string, unknown> | Record<string, unknown>[];
    /**
     * Export filename (without extension)
     */
    filename?: string;
    /**
     * Export title
     */
    title?: string;
    /**
     * Available export formats
     * @default ['json', 'pdf', 'word']
     */
    formats?: ExportFormat[];
    /**
     * Button variant
     * @default 'primary'
     */
    variant?: 'primary' | 'secondary' | 'ghost';
    /**
     * Button size
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg';
    /**
     * Custom className
     */
    className?: string;
    /**
     * Whether this is a resume export
     */
    isResume?: boolean;
    /**
     * Resume profile (if isResume is true)
     */
    resumeProfile?: ResumeProfile;
}

const formatLabels: Record<ExportFormat, { label: string; icon: React.ReactNode }> = {
    json: {
        label: 'JSON',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
    },
    pdf: {
        label: 'PDF',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
    },
    word: {
        label: 'Word',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
};

const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
};

const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export const ExportButton: React.FC<ExportButtonProps> = ({
    data,
    filename = 'export',
    title = 'Export',
    formats = ['json', 'pdf', 'word'],
    variant = 'primary',
    size = 'md',
    className,
    isResume = false,
    resumeProfile,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleExport = useCallback(async (format: ExportFormat) => {
        setIsExporting(true);
        setIsOpen(false);

        try {
            if (isResume && resumeProfile) {
                switch (format) {
                    case 'json':
                        exportResumeToJSON(resumeProfile, `${filename}.json`);
                        break;
                    case 'pdf':
                        exportResumeToPDF(resumeProfile, `${filename}.pdf`);
                        break;
                    case 'word':
                        exportResumeToWord(resumeProfile, `${filename}.doc`);
                        break;
                }
            } else {
                exportData(data, format, {
                    filename: `${filename}.${format === 'word' ? 'doc' : format}`,
                    title,
                });
            }
        } catch (error) {
            console.error('Export failed:', error);
            // Could show toast notification here
        } finally {
            setIsExporting(false);
        }
    }, [data, filename, title, isResume, resumeProfile]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            buttonRef.current?.focus();
        }
    }, []);

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className={cn(
                    'inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {isExporting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Export</span>
                        <svg
                            className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                    onKeyDown={handleKeyDown}
                >
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {formats.map((format) => (
                            <button
                                key={format}
                                onClick={() => handleExport(format)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                role="menuitem"
                            >
                                {formatLabels[format].icon}
                                <span>Export as {formatLabels[format].label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
