'use client';

/**
 * Global Error Page
 * Next.js built-in error boundary for handling errors in the root layout
 * This catches errors that occur during rendering of the root layout
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    const handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    const handleGoHome = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Application Error - CV-Wiz</title>
                <style>{`
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #e4e4e7;
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        width: 100%;
                        text-align: center;
                    }
                    .icon {
                        width: 80px;
                        height: 80px;
                        background: rgba(239, 68, 68, 0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 24px;
                    }
                    .icon svg {
                        width: 40px;
                        height: 40px;
                        color: #ef4444;
                    }
                    h1 {
                        font-size: 2rem;
                        font-weight: 700;
                        margin-bottom: 16px;
                        background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    p {
                        font-size: 1.125rem;
                        color: #a1a1aa;
                        margin-bottom: 32px;
                        line-height: 1.6;
                    }
                    .buttons {
                        display: flex;
                        gap: 16px;
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    .btn {
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                        border: none;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .btn-primary {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                    }
                    .btn-primary:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    }
                    .btn-secondary {
                        background: rgba(255, 255, 255, 0.1);
                        color: #e4e4e7;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    .btn-secondary:hover {
                        background: rgba(255, 255, 255, 0.15);
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <div className="icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1>Application Error</h1>
                    <p>
                        We're sorry, but CV-Wiz encountered a critical error.
                        Please try refreshing the page or contact support if the problem persists.
                    </p>
                    <div className="buttons">
                        <button className="btn btn-primary" onClick={handleReload}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Reload Page
                        </button>
                        <button className="btn btn-secondary" onClick={handleGoHome}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                </div>
            </body>
        </html>
    );
}
