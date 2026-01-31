/**
 * Database Transaction Utilities
 * Provides transaction handling for multi-table operations to ensure data consistency
 */

import prisma from './prisma';
import type { PrismaClient, Prisma } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

/**
 * Transaction callback function type
 */
export type TransactionCallback<T> = (
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
) => Promise<T>;

/**
 * Transaction options
 */
export interface TransactionOptions {
    maxWait?: number; // Maximum time to wait for a transaction slot
    timeout?: number; // Maximum time for the transaction to complete
    isolationLevel?: Prisma.TransactionIsolationLevel;
}

// ============================================================================
// Transaction Wrapper
// ============================================================================

/**
 * Execute a function within a database transaction
 * Automatically rolls back on error
 * 
 * @example
 * const result = await withTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: { name: 'John' } });
 *   const profile = await tx.profile.create({ data: { userId: user.id } });
 *   return { user, profile };
 * });
 */
export async function withTransaction<T>(
    callback: TransactionCallback<T>,
    options?: TransactionOptions
): Promise<T> {
    return prisma.$transaction(async (tx) => {
        return callback(tx);
    }, options);
}

/**
 * Execute a function within a transaction with automatic retry on deadlock
 * 
 * @example
 * const result = await withRetryTransaction(async (tx) => {
 *   // Your transaction logic here
 * }, { retries: 3 });
 */
export async function withRetryTransaction<T>(
    callback: TransactionCallback<T>,
    options: TransactionOptions & { retries?: number; delay?: number } = {}
): Promise<T> {
    const { retries = 3, delay = 100, ...transactionOptions } = options;
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await withTransaction(callback, transactionOptions);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            // Check if it's a deadlock error (PostgreSQL error code 40P01)
            const isDeadlock = lastError.message?.includes('40P01') || 
                              lastError.message?.toLowerCase().includes('deadlock');
            
            if (!isDeadlock || attempt === retries - 1) {
                throw lastError;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
    }
    
    throw lastError || new Error('Transaction failed after retries');
}

// ============================================================================
// Profile Operations with Transactions
// ============================================================================

/**
 * Update user profile with settings in a single transaction
 * Ensures both operations succeed or both fail
 */
export async function updateProfileWithSettings(
    userId: string,
    profileData: {
        name?: string;
        image?: string | null;
    },
    settingsData?: {
        selectedTemplate?: string;
        resumePreferences?: Record<string, unknown>;
    }
) {
    return withTransaction(async (tx) => {
        // Update user profile
        const user = await tx.user.update({
            where: { id: userId },
            data: {
                ...(profileData.name !== undefined && { name: profileData.name }),
                ...(profileData.image !== undefined && { image: profileData.image }),
            },
        });

        // Update settings if provided
        let settings = null;
        if (settingsData) {
            settings = await tx.userSettings.upsert({
                where: { userId },
                create: {
                    userId,
                    selectedTemplate: settingsData.selectedTemplate || 'experience-skills-projects',
                    resumePreferences: settingsData.resumePreferences || null,
                },
                update: {
                    ...(settingsData.selectedTemplate && { selectedTemplate: settingsData.selectedTemplate }),
                    ...(settingsData.resumePreferences !== undefined && { resumePreferences: settingsData.resumePreferences }),
                },
            });
        }

        return { user, settings };
    });
}

/**
 * Create multiple experiences in a single transaction
 * Useful for bulk imports
 */
export async function createExperiencesBatch(
    userId: string,
    experiences: Array<{
        company: string;
        title: string;
        location?: string;
        startDate: Date;
        endDate?: Date | null;
        current?: boolean;
        description: string;
        highlights?: string[];
        keywords?: string[];
    }>
) {
    return withTransaction(async (tx) => {
        const created = [];
        
        for (const exp of experiences) {
            const experience = await tx.experience.create({
                data: {
                    userId,
                    company: exp.company,
                    title: exp.title,
                    location: exp.location || null,
                    startDate: exp.startDate,
                    endDate: exp.endDate || null,
                    current: exp.current || false,
                    description: exp.description,
                    highlights: exp.highlights || [],
                    keywords: exp.keywords || [],
                },
            });
            created.push(experience);
        }
        
        return created;
    });
}

/**
 * Create multiple skills in a single transaction
 * Checks for duplicates within the transaction
 */
export async function createSkillsBatch(
    userId: string,
    skills: Array<{
        name: string;
        category: string;
        proficiency?: string;
        yearsExp?: number;
    }>
) {
    return withTransaction(async (tx) => {
        // Get existing skills for this user
        const existingSkills = await tx.skill.findMany({
            where: { userId },
            select: { name: true },
        });
        const existingNames = new Set(existingSkills.map(s => s.name.toLowerCase()));
        
        const created = [];
        const duplicates = [];
        
        for (const skill of skills) {
            // Check for duplicates (case-insensitive)
            if (existingNames.has(skill.name.toLowerCase())) {
                duplicates.push(skill.name);
                continue;
            }
            
            const createdSkill = await tx.skill.create({
                data: {
                    userId,
                    name: skill.name,
                    category: skill.category,
                    proficiency: skill.proficiency || null,
                    yearsExp: skill.yearsExp || null,
                },
            });
            created.push(createdSkill);
            existingNames.add(skill.name.toLowerCase());
        }
        
        return { created, duplicates };
    });
}

/**
 * Create multiple educations in a single transaction
 */
export async function createEducationsBatch(
    userId: string,
    educations: Array<{
        institution: string;
        degree: string;
        field: string;
        startDate: Date;
        endDate?: Date | null;
        gpa?: number | null;
        honors?: string[];
    }>
) {
    return withTransaction(async (tx) => {
        const created = [];
        
        for (const edu of educations) {
            const education = await tx.education.create({
                data: {
                    userId,
                    institution: edu.institution,
                    degree: edu.degree,
                    field: edu.field,
                    startDate: edu.startDate,
                    endDate: edu.endDate || null,
                    gpa: edu.gpa || null,
                    honors: edu.honors || [],
                },
            });
            created.push(education);
        }
        
        return created;
    });
}

/**
 * Create multiple projects in a single transaction
 */
export async function createProjectsBatch(
    userId: string,
    projects: Array<{
        name: string;
        description: string;
        url?: string | null;
        startDate?: Date | null;
        endDate?: Date | null;
        technologies?: string[];
        highlights?: string[];
    }>
) {
    return withTransaction(async (tx) => {
        const created = [];
        
        for (const proj of projects) {
            const project = await tx.project.create({
                data: {
                    userId,
                    name: proj.name,
                    description: proj.description,
                    url: proj.url || null,
                    startDate: proj.startDate || null,
                    endDate: proj.endDate || null,
                    technologies: proj.technologies || [],
                    highlights: proj.highlights || [],
                },
            });
            created.push(project);
        }
        
        return created;
    });
}

/**
 * Delete a user and all related data in a single transaction
 * Ensures complete cleanup on user deletion
 */
export async function deleteUserWithAllData(userId: string) {
    return withTransaction(async (tx) => {
        // Delete in order of dependencies (child tables first)
        await tx.coverLetter.deleteMany({ where: { userId } });
        await tx.skill.deleteMany({ where: { userId } });
        await tx.experience.deleteMany({ where: { userId } });
        await tx.education.deleteMany({ where: { userId } });
        await tx.project.deleteMany({ where: { userId } });
        await tx.publication.deleteMany({ where: { userId } });
        await tx.userSettings.deleteMany({ where: { userId } });
        await tx.feedback.deleteMany({ where: { userId } });
        await tx.account.deleteMany({ where: { userId } });
        await tx.session.deleteMany({ where: { userId } });
        
        // Finally delete the user
        const user = await tx.user.delete({
            where: { id: userId },
        });
        
        return { deleted: true, userId: user.id };
    });
}

/**
 * Import complete profile data in a single transaction
 * Used for bulk imports (e.g., from LinkedIn or resume parsing)
 */
export async function importCompleteProfile(
    userId: string,
    data: {
        profile?: {
            name?: string;
            image?: string;
        };
        settings?: {
            selectedTemplate?: string;
            resumePreferences?: Record<string, unknown>;
        };
        experiences?: Parameters<typeof createExperiencesBatch>[1];
        educations?: Parameters<typeof createEducationsBatch>[1];
        skills?: Parameters<typeof createSkillsBatch>[1];
        projects?: Parameters<typeof createProjectsBatch>[1];
    }
) {
    return withTransaction(async (tx) => {
        const results = {
            profile: null as Record<string, unknown> | null,
            settings: null as Record<string, unknown> | null,
            experiences: [] as Record<string, unknown>[],
            educations: [] as Record<string, unknown>[],
            skills: { created: [] as Record<string, unknown>[], duplicates: [] as string[] },
            projects: [] as Record<string, unknown>[],
        };

        // Update profile
        if (data.profile) {
            results.profile = await tx.user.update({
                where: { id: userId },
                data: {
                    ...(data.profile.name && { name: data.profile.name }),
                    ...(data.profile.image && { image: data.profile.image }),
                },
            });
        }

        // Update settings
        if (data.settings) {
            results.settings = await tx.userSettings.upsert({
                where: { userId },
                create: {
                    userId,
                    selectedTemplate: data.settings.selectedTemplate || 'experience-skills-projects',
                    resumePreferences: data.settings.resumePreferences || null,
                },
                update: {
                    ...(data.settings.selectedTemplate && { selectedTemplate: data.settings.selectedTemplate }),
                    ...(data.settings.resumePreferences !== undefined && { resumePreferences: data.settings.resumePreferences }),
                },
            });
        }

        // Create experiences
        if (data.experiences?.length) {
            for (const exp of data.experiences) {
                const experience = await tx.experience.create({
                    data: {
                        userId,
                        company: exp.company,
                        title: exp.title,
                        location: exp.location || null,
                        startDate: exp.startDate,
                        endDate: exp.endDate || null,
                        current: exp.current || false,
                        description: exp.description,
                        highlights: exp.highlights || [],
                        keywords: exp.keywords || [],
                    },
                });
                results.experiences.push(experience);
            }
        }

        // Create educations
        if (data.educations?.length) {
            for (const edu of data.educations) {
                const education = await tx.education.create({
                    data: {
                        userId,
                        institution: edu.institution,
                        degree: edu.degree,
                        field: edu.field,
                        startDate: edu.startDate,
                        endDate: edu.endDate || null,
                        gpa: edu.gpa || null,
                        honors: edu.honors || [],
                    },
                });
                results.educations.push(education);
            }
        }

        // Create skills with duplicate checking
        if (data.skills?.length) {
            const existingSkills = await tx.skill.findMany({
                where: { userId },
                select: { name: true },
            });
            const existingNames = new Set(existingSkills.map(s => s.name.toLowerCase()));

            for (const skill of data.skills) {
                if (existingNames.has(skill.name.toLowerCase())) {
                    results.skills.duplicates.push(skill.name);
                    continue;
                }

                const createdSkill = await tx.skill.create({
                    data: {
                        userId,
                        name: skill.name,
                        category: skill.category,
                        proficiency: skill.proficiency || null,
                        yearsExp: skill.yearsExp || null,
                    },
                });
                results.skills.created.push(createdSkill);
                existingNames.add(skill.name.toLowerCase());
            }
        }

        // Create projects
        if (data.projects?.length) {
            for (const proj of data.projects) {
                const project = await tx.project.create({
                    data: {
                        userId,
                        name: proj.name,
                        description: proj.description,
                        url: proj.url || null,
                        startDate: proj.startDate || null,
                        endDate: proj.endDate || null,
                        technologies: proj.technologies || [],
                        highlights: proj.highlights || [],
                    },
                });
                results.projects.push(project);
            }
        }

        return results;
    });
}

// ============================================================================
// Transaction-aware Query Helpers
// ============================================================================

/**
 * Check if a transaction is active (for logging/debugging)
 */
export function isInTransaction(): boolean {
    // Note: Prisma doesn't expose this directly, but we can track it manually if needed
    return false;
}

/**
 * Get transaction isolation level
 */
export function getDefaultIsolationLevel(): Prisma.TransactionIsolationLevel {
    return Prisma.TransactionIsolationLevel.Serializable;
}
