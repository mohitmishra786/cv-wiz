/**
 * GitHub Username Validation
 * Validates GitHub usernames according to GitHub's rules
 */

/**
 * GitHub username validation rules:
 * - Length: 1-39 characters
 * - Characters: alphanumeric and hyphens only
 * - Cannot start or end with hyphen
 * - Cannot have consecutive hyphens
 */
export function isValidGitHubUsername(username: string): boolean {
    if (!username || typeof username !== 'string') {
        return false;
    }
    
    // Length check: 1-39 characters
    if (username.length < 1 || username.length > 39) {
        return false;
    }
    
    // Pattern: alphanumeric and hyphens only, no start/end hyphen, no consecutive hyphens
    const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    if (!usernameRegex.test(username)) {
        return false;
    }
    
    // Check for consecutive hyphens
    if (username.includes('--')) {
        return false;
    }
    
    return true;
}

/**
 * Validate GitHub repository URL
 * Ensures URL is a valid GitHub repository URL
 */
export function isValidGitHubUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        
        // Must be github.com domain
        if (urlObj.hostname !== 'github.com') {
            return false;
        }
        
        // Path should be /{username}/{repo}
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length !== 2) {
            return false;
        }
        
        const [username, repo] = pathParts;
        
        // Validate username
        if (!isValidGitHubUsername(username)) {
            return false;
        }
        
        // Validate repo name (similar rules to username)
        if (!/^[a-zA-Z0-9._-]+$/.test(repo)) {
            return false;
        }
        
        return true;
    } catch {
        return false;
    }
}

/**
 * Sanitize GitHub username input
 * Removes any potentially dangerous characters
 */
export function sanitizeGitHubUsername(username: string): string {
    if (!username || typeof username !== 'string') {
        return '';
    }
    
    // Trim whitespace
    let sanitized = username.trim();
    
    // Remove any characters that aren't alphanumeric or hyphen
    sanitized = sanitized.replace(/[^a-zA-Z0-9-]/g, '');
    
    // Remove consecutive hyphens
    sanitized = sanitized.replace(/--+/g, '-');
    
    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');
    
    // Limit to 39 characters
    sanitized = sanitized.slice(0, 39);
    
    return sanitized.toLowerCase();
}
