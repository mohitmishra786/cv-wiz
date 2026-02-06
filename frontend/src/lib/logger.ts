/**
 * CV-Wiz Logging Module
 * Provides structured logging with request correlation IDs for debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    action?: string;
    component?: string;
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context: LogContext;
    data?: unknown;
}

/**
 * Generate a unique request ID for correlating logs
 */
export function generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `req_${timestamp}_${random}`;
}

/**
 * Generate a session tracking ID
 */
export function generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `sess_${timestamp}_${random}`;
}

/**
 * Format log entry as structured JSON
 */
function formatLogEntry(entry: LogEntry): string {
    return JSON.stringify({
        ...entry,
        timestamp: entry.timestamp,
        env: process.env.NODE_ENV || 'development',
    });
}

/**
 * Create a logger instance with optional default context
 */
export function createLogger(defaultContext: LogContext = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isServer = typeof window === 'undefined';

    const log = (level: LogLevel, message: string, data?: unknown, context?: LogContext) => {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: { ...defaultContext, ...context },
            data,
        };

        const formattedEntry = formatLogEntry(entry);

        // In production on client-side: ONLY send to Sentry, NO console logs
        if (isProduction && !isServer) {
            // Import Sentry dynamically to avoid SSR issues
            if (typeof window !== 'undefined' && (window as Window & { Sentry?: unknown }).Sentry) {
                const Sentry = (window as Window & { Sentry: typeof import('@sentry/nextjs') }).Sentry;

                switch (level) {
                    case 'error':
                        Sentry.captureException(data instanceof Error ? data : new Error(message), {
                            level: 'error',
                            contexts: { custom: entry.context },
                            extra: data instanceof Error ? undefined : data,
                        });
                        break;
                    case 'warn':
                        Sentry.captureMessage(message, {
                            level: 'warning',
                            contexts: { custom: entry.context },
                            extra: data,
                        });
                        break;
                    case 'info':
                        // Only log important info messages to Sentry
                        if (context?.action || context?.component) {
                            Sentry.addBreadcrumb({
                                message,
                                level: 'info',
                                data: { ...context, ...data as object },
                            });
                        }
                        break;
                    case 'debug':
                        // Debug messages as breadcrumbs in development
                        break;
                }
            }
            // DO NOT log to console in production client-side
            return;
        }

        // Development or server-side: use console
        switch (level) {
            case 'debug':
                if (!isProduction) {
                    console.debug(formattedEntry);
                }
                break;
            case 'info':
                // Server-side in production: use console (Railway logs)
                // Client-side in development: use console
                if (isServer || !isProduction) {
                    console.info(formattedEntry);
                }
                break;
            case 'warn':
                if (isServer || !isProduction) {
                    console.warn(formattedEntry);
                }
                break;
            case 'error':
                if (isServer || !isProduction) {
                    console.error(formattedEntry);
                }
                // Server-side: also send to Sentry if available
                if (isServer && isProduction) {
                    try {
                        // Use dynamic import instead of require for ESLint
                        import('@sentry/nextjs').then(Sentry => {
                            Sentry.captureException(data instanceof Error ? data : new Error(message), {
                                level: 'error',
                                contexts: { custom: entry.context },
                                extra: data instanceof Error ? undefined : data,
                            });
                        }).catch(() => {
                            // Sentry not available
                        });
                    } catch {
                        // Sentry not available
                    }
                }
                break;
        }
    };

    return {
        debug: (message: string, data?: unknown, context?: LogContext) => log('debug', message, data, context),
        info: (message: string, data?: unknown, context?: LogContext) => log('info', message, data, context),
        warn: (message: string, data?: unknown, context?: LogContext) => log('warn', message, data, context),
        error: (message: string, data?: unknown, context?: LogContext) => log('error', message, data, context),

        /**
         * Create a child logger with additional context
         */
        child: (childContext: LogContext) => createLogger({ ...defaultContext, ...childContext }),

        /**
         * Log the start of an operation
         */
        startOperation: (operation: string, data?: unknown) => {
            log('info', `[START] ${operation}`, data, { action: operation });
        },

        /**
         * Log the successful end of an operation
         */
        endOperation: (operation: string, data?: unknown) => {
            log('info', `[END] ${operation}`, data, { action: operation });
        },

        /**
         * Log an operation failure
         */
        failOperation: (operation: string, error: unknown) => {
            const errorData = error instanceof Error
                ? { message: error.message, stack: error.stack, name: error.name }
                : error;
            log('error', `[FAILED] ${operation}`, errorData, { action: operation });
        },
    };
}

/**
 * Default logger instance
 */
export const logger = createLogger({ component: 'cv-wiz' });

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(requestId?: string, userId?: string) {
    return createLogger({
        component: 'cv-wiz',
        requestId: requestId || generateRequestId(),
        userId,
    });
}

/**
 * Helper to extract request ID from headers or generate new one
 */
export function getOrCreateRequestId(headers?: Headers): string {
    const existingId = headers?.get('x-request-id') || headers?.get('x-vercel-id');
    return existingId || generateRequestId();
}

/**
 * Log database operations
 */
export function logDbOperation(operation: string, table: string, data?: unknown) {
    logger.info(`[DB] ${operation} on ${table}`, data, {
        component: 'prisma',
        action: `db:${operation}:${table}`
    });
}

/**
 * Log auth operations
 */
export function logAuthOperation(operation: string, userId?: string, success: boolean = true, data?: unknown) {
    logger.info(`[AUTH] ${operation}`, { ...data as object, userId, success }, {
        component: 'nextauth',
        action: `auth:${operation}`,
        userId
    });
}

/**
 * Log API operations
 */
export function logApiOperation(method: string, path: string, status: number, data?: unknown, requestId?: string) {
    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    logger[logLevel](`[API] ${method} ${path} -> ${status}`, data, {
        component: 'api',
        action: `api:${method}:${path}`,
        requestId
    });
}
