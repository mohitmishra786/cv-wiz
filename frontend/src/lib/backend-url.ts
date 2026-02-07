/**
 * Backend URL Utility
 * Provides secure backend URL construction with SSRF protection
 */

const ALLOWED_BACKEND_HOSTS = (
    process.env.ALLOWED_BACKEND_HOSTS?.split(',').map(h => h.trim()) || []
);

export function getBackendUrl(path: string): string {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error('BACKEND_URL environment variable is not configured');
    }

    try {
        const url = new URL(backendUrl);

        if (ALLOWED_BACKEND_HOSTS.length > 0 && !ALLOWED_BACKEND_HOSTS.includes(url.host)) {
            throw new Error(`Backend host '${url.host}' is not in allowed list`);
        }

        const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
        return `${baseUrl}${path}`;
    } catch (error) {
        throw new Error(`Invalid BACKEND_URL configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export function isBackendHostAllowed(host: string): boolean {
    if (ALLOWED_BACKEND_HOSTS.length === 0) {
        return true;
    }
    return ALLOWED_BACKEND_HOSTS.includes(host);
}
