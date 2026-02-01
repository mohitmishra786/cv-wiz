/**
 * Input Sanitization Utilities
 * Provides XSS protection and input sanitization for user-generated content
 */

let DOMPurify: any = null;

async function loadDOMPurify() {
    if (!DOMPurify) {
        if (typeof window !== 'undefined') {
            const module = await import('dompurify');
            DOMPurify = module.default;
        } else {
            const module = await import('isomorphic-dompurify');
            DOMPurify = module.default;
        }
    }
    return DOMPurify;
}

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default DOMPurify configuration for general text sanitization
 * Allows only safe HTML elements and attributes
 */
const DEFAULT_CONFIG = {
    ALLOWED_TAGS: [] as string[], // Strip all HTML tags by default
    ALLOWED_ATTR: [] as string[], // Strip all attributes by default
    KEEP_CONTENT: true, // Keep the content inside removed tags
};

/**
 * Configuration for rich text sanitization (allows basic formatting)
 */
const RICH_TEXT_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'] as string[],
    ALLOWED_ATTR: [] as string[],
    KEEP_CONTENT: true,
};

/**
 * Configuration for URL sanitization
 */
const URL_CONFIG = {
    ALLOWED_TAGS: [] as string[],
    ALLOWED_ATTR: [] as string[],
    KEEP_CONTENT: true,
};

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize plain text input - removes all HTML tags
 * Use for: names, titles, company names, simple text fields
 */
export async function sanitizeText(input: unknown): Promise<string> {
    if (typeof input !== 'string' || !input) return '';
    
    const purify = await loadDOMPurify();
    const sanitized = purify.sanitize(input, DEFAULT_CONFIG);
    // Additional cleanup: normalize whitespace
    return sanitized.trim().replace(/\s+/g, ' ');
}

export function sanitizeTextSync(input: unknown): string {
    if (typeof input !== 'string' || !input) return '';
    return escapeHtml(input).trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize rich text input - allows basic formatting tags
 * Use for: descriptions, summaries, content that may have formatting
 */
export async function sanitizeRichText(input: unknown): Promise<string> {
    if (typeof input !== 'string' || !input) return '';
    
    const purify = await loadDOMPurify();
    return purify.sanitize(input, RICH_TEXT_CONFIG).trim();
}

export function sanitizeRichTextSync(input: unknown): string {
    if (typeof input !== 'string' || !input) return '';
    return escapeHtml(input).trim();
}

/**
 * Sanitize URL input
 * Validates and sanitizes URLs to prevent javascript: and data: protocols
 */
export async function sanitizeUrl(input: unknown): Promise<string | null> {
    if (typeof input !== 'string' || !input) return null;
    
    const purify = await loadDOMPurify();
    const sanitized = purify.sanitize(input, URL_CONFIG).trim();
    
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = sanitized.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            return null;
        }
    }
    
    // Validate URL format if it looks like a URL
    if (sanitized && !sanitized.match(/^(https?:\/\/|mailto:|tel:)/i)) {
        // If no protocol, assume https://
        if (sanitized.includes('.') && !sanitized.includes(' ')) {
            return `https://${sanitized}`;
        }
    }
    
    return sanitized || null;
}

/**
 * Sanitize email input
 */
export async function sanitizeEmail(input: unknown): Promise<string> {
    if (typeof input !== 'string' || !input) return '';
    
    const purify = await loadDOMPurify();
    // Remove any HTML and trim
    const sanitized = purify.sanitize(input, DEFAULT_CONFIG).trim().toLowerCase();
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitized)) {
        return '';
    }
    
    return sanitized;
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(inputs: (string | null | undefined)[] | null | undefined): string[] {
    if (!inputs || !Array.isArray(inputs)) return [];
    
    return inputs
        .map(item => sanitizeTextSync(item))
        .filter(item => item.length > 0);
}

/**
 * Sanitize a number within a range
 */
export function sanitizeNumber(
    input: unknown,
    min: number = Number.MIN_SAFE_INTEGER,
    max: number = Number.MAX_SAFE_INTEGER,
    defaultValue: number = 0
): number {
    if (input === null || input === undefined) return defaultValue;
    if (typeof input === 'number') {
        if (isNaN(input) || !isFinite(input)) return defaultValue;
        return Math.max(min, Math.min(max, input));
    }
    
    const num = typeof input === 'string' ? parseFloat(input) : NaN;
    
    if (isNaN(num) || !isFinite(num)) return defaultValue;
    
    return Math.max(min, Math.min(max, num));
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: unknown, defaultValue: boolean = false): boolean {
    if (input === null || input === undefined) return defaultValue;
    if (typeof input === 'boolean') return input;
    if (typeof input === 'number') return input !== 0;
    if (typeof input === 'string') {
        const lower = input.toLowerCase().trim();
        return lower === 'true' || lower === '1' || lower === 'yes';
    }
    return defaultValue;
}

// ============================================================================
// Object Sanitization
// ============================================================================

/**
 * Sanitized experience data interface
 */
export interface SanitizedExperienceData {
    company: string;
    title: string;
    location: string;
    description: string;
    highlights: string[];
    keywords: string[];
    startDate: unknown;
    endDate: unknown;
    current: boolean;
}

/**
 * Sanitize experience data object
 */
export function sanitizeExperienceData(data: Record<string, unknown>): SanitizedExperienceData {
    return {
        company: sanitizeTextSync(data.company as string),
        title: sanitizeTextSync(data.title as string),
        location: sanitizeTextSync(data.location as string),
        description: sanitizeRichTextSync(data.description as string),
        highlights: sanitizeStringArray(data.highlights as string[]),
        keywords: sanitizeStringArray(data.keywords as string[]),
        startDate: data.startDate,
        endDate: data.endDate,
        current: sanitizeBoolean(data.current, false),
    };
}

/**
 * Sanitized project data interface
 */
export interface SanitizedProjectData {
    name: string;
    description: string;
    url: string | null;
    technologies: string[];
    highlights: string[];
    startDate: unknown;
    endDate: unknown;
}

/**
 * Sanitize project data object
 */
export function sanitizeProjectData(data: Record<string, unknown>): SanitizedProjectData {
    return {
        name: sanitizeTextSync(data.name as string),
        description: sanitizeRichTextSync(data.description as string),
        url: null, // URL sanitization would need to be async
        technologies: sanitizeStringArray(data.technologies as string[]),
        highlights: sanitizeStringArray(data.highlights as string[]),
        startDate: data.startDate,
        endDate: data.endDate,
    };
}

/**
 * Sanitized education data interface
 */
export interface SanitizedEducationData {
    institution: string;
    degree: string;
    field: string;
    gpa: number;
    honors: string[];
    startDate: unknown;
    endDate: unknown;
}

/**
 * Sanitize education data object
 */
export function sanitizeEducationData(data: Record<string, unknown>): SanitizedEducationData {
    return {
        institution: sanitizeTextSync(data.institution as string),
        degree: sanitizeTextSync(data.degree as string),
        field: sanitizeTextSync(data.field as string),
        gpa: sanitizeNumber(data.gpa, 0, 4, 0),
        honors: sanitizeStringArray(data.honors as string[]),
        startDate: data.startDate,
        endDate: data.endDate,
    };
}

/**
 * Sanitized skill data interface
 */
export interface SanitizedSkillData {
    name: string;
    category: string;
    proficiency: string;
    yearsExp: number;
}

/**
 * Sanitize skill data object
 */
export function sanitizeSkillData(data: Record<string, unknown>): SanitizedSkillData {
    return {
        name: sanitizeTextSync(data.name as string),
        category: sanitizeTextSync(data.category as string),
        proficiency: sanitizeTextSync(data.proficiency as string),
        yearsExp: sanitizeNumber(data.yearsExp, 0, 100, 0),
    };
}

/**
 * Cover letter data interface
 */
export interface SanitizedCoverLetterData {
    content: string;
    jobTitle: string;
    companyName: string;
}

/**
 * Sanitize cover letter data object
 */
export function sanitizeCoverLetterData(data: Record<string, unknown>): SanitizedCoverLetterData {
    return {
        content: sanitizeRichTextSync(data.content as string),
        jobTitle: sanitizeTextSync(data.jobTitle as string),
        companyName: sanitizeTextSync(data.companyName as string),
    };
}

/**
 * Sanitized user profile data interface
 */
export interface SanitizedProfileData {
    name: string;
    image: string | null;
}

/**
 * Sanitize user profile data
 */
export function sanitizeProfileData(data: Record<string, unknown>): SanitizedProfileData {
    return {
        name: sanitizeTextSync(data.name as string),
        image: null, // URL sanitization would need to be async
    };
}

/**
 * Sanitized feedback data interface
 */
export interface SanitizedFeedbackData {
    rating: number;
    comment: string;
    category: string;
}

/**
 * Sanitize feedback data
 */
export function sanitizeFeedbackData(data: Record<string, unknown>): SanitizedFeedbackData {
    return {
        rating: sanitizeNumber(data.rating, 1, 5, 3),
        comment: sanitizeRichTextSync(data.comment as string),
        category: sanitizeTextSync(data.category as string),
    };
}

// ============================================================================
// Middleware Helper
// ============================================================================

/**
 * Create a sanitized version of request body
 * This is a generic sanitizer that strips HTML from all string fields
 */
export function sanitizeRequestBody<T extends Record<string, unknown>>(body: T): T {
    const sanitized = { ...body };
    
    for (const key of Object.keys(sanitized)) {
        const value = sanitized[key];
        
        if (typeof value === 'string') {
            // For most fields, use plain text sanitization
            (sanitized as Record<string, unknown>)[key] = sanitizeTextSync(value);
        } else if (Array.isArray(value)) {
            // Sanitize arrays of strings
            (sanitized as Record<string, unknown>)[key] = value.map(item =>
                typeof item === 'string' ? sanitizeTextSync(item) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            // Recursively sanitize nested objects
            (sanitized as Record<string, unknown>)[key] = sanitizeRequestBody(value as Record<string, unknown>);
        }
    }
    
    return sanitized;
}

// ============================================================================
// Security Headers Helper
// ============================================================================

/**
 * Get Content Security Policy headers
 * These headers help prevent XSS attacks
 */
export function getSecurityHeaders(): Record<string, string> {
    return {
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
}
