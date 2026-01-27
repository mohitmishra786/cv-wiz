/**
 * TypeScript Type Definitions
 * Shared types for the CV-Wiz application
 */

// ============================================
// User & Auth Types
// ============================================

export interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
}

// ============================================
// Profile Types
// ============================================

export interface Experience {
    id: string;
    company: string;
    title: string;
    location?: string | null;
    startDate: string;
    endDate?: string | null;
    current: boolean;
    description: string;
    highlights: string[];
    keywords: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    url?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    technologies: string[];
    highlights: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Education {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string | null;
    gpa?: number | null;
    honors: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Skill {
    id: string;
    name: string;
    category: string;
    proficiency?: string | null;
    yearsExp?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface Publication {
    id: string;
    title: string;
    venue: string;
    authors: string[];
    date: string;
    url?: string | null;
    doi?: string | null;
    abstract?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserSettings {
    id: string;
    selectedTemplate: TemplateType;
    resumePreferences?: Record<string, unknown> | null;
}

export interface UserProfile extends User {
    experiences: Experience[];
    projects: Project[];
    educations: Education[];
    skills: Skill[];
    publications: Publication[];
    settings?: UserSettings | null;
}

// ============================================
// Template Types
// ============================================

export type TemplateType =
    | 'experience-skills-projects'
    | 'education-research-skills'
    | 'projects-skills-experience'
    | 'compact-technical'
    | 'creative-portfolio'
    | 'executive-leadership'
    | 'healthcare-medical'
    | 'finance-analyst'
    | 'minimalist-modern'
    | 'international-multilingual';
