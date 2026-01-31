'use client';

/**
 * Global Error Boundary Component
 * Wraps the entire application to catch unhandled errors
 * Provides a full-page error UI when critical errors occur
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to Sentry with full context
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
            tags: {
                errorBoundary: 'global',
                severity: 'critical',
            },
        });

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('GlobalErrorBoundary caught an error:', error);
            console.error('Component stack:', errorInfo.componentStack);
        }
    }

    handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    handleGoHome = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    render() {
        const { hasError, error } = this.state;
        const { children } = this.props;

        if (hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800/50 p-8 text-center shadow-2xl backdrop-blur-sm">
                        {/* Error Icon */}
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
                            <svg
                                className="h-10 w-10 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        {/* Title */}
                        <h1 className="mb-2 text-2xl font-bold text-white">
                            Oops! Something went wrong
                        </h1>

                        {/* Description */}
                        <p className="mb-6 text-gray-400">
                            We're sorry, but CV-Wiz encountered an unexpected error. 
                            Please try refreshing the page or contact support if the problem persists.
                        </p>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && error && (
                            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-left">
                                <p className="mb-2 text-sm font-semibold text-red-400">
                                    Error Details:
                                </p>
                                <code className="block break-all font-mono text-xs text-red-300">
                                    {error.message}
                                </code>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <button
                                onClick={this.handleReload}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-600 bg-gray-700/50 px-6 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    />
                                </svg>
                                Go Home
                            </button>
                        </div>

                        {/* Support Link */}
                        <p className="mt-6 text-xs text-gray-500">
                            If this error persists, please{' '}
                            <a
                                href="mailto:support@cv-wiz.com"
                                className="text-emerald-400 hover:text-emerald-300 hover:underline"
                            >
                                contact support
                            </a>
                        </p>
                    </div>
                </div>
            );
        }

        return children;
    }
}

export default GlobalErrorBoundary;
