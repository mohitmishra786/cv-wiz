'use client';

/**
 * Profile List Components
 * Reusable list components for profile sections
 */

import type { Experience, Project, Skill, Education } from '@/types';
import { createLogger } from '@/lib/logger';

const listLogger = createLogger({ component: 'ProfileLists' });

// Empty State Component
export function EmptyState({ 
    title, 
    description, 
    actionLabel, 
    onAction 
}: {
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>
            <button
                onClick={onAction}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                {actionLabel}
            </button>
        </div>
    );
}

// Experience List Component
export function ExperienceList({
    experiences,
    onAdd,
    onEdit
}: {
    experiences: Experience[];
    onAdd: () => void;
    onEdit: (exp: Experience) => void;
}) {
    const logger = createLogger({ component: 'ExperienceList' });

    if (experiences.length === 0) {
        return (
            <EmptyState
                title="No work experience yet"
                description="Add your work history to build your resume"
                actionLabel="Add Experience"
                onAction={() => {
                    logger.info('[ExperienceList] Add Experience from empty state');
                    onAdd();
                }}
            />
        );
    }

    return (
        <div className="space-y-4">
            {experiences.map((exp) => (
                <div
                    key={exp.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer bg-white dark:bg-gray-800"
                    onClick={() => {
                        logger.debug('[ExperienceList] Edit experience clicked', { id: exp.id });
                        onEdit(exp);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{exp.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -
                                {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                            </p>
                        </div>
                        <button
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 outline-none"
                            aria-label={`Edit experience at ${exp.company}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(exp);
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                    {exp.highlights?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                            {exp.highlights.slice(0, 3).map((highlight, i) => (
                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
            <button
                onClick={() => {
                    logger.info('[ExperienceList] Add Experience clicked');
                    onAdd();
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
                + Add Experience
            </button>
        </div>
    );
}

// Project List Component
export function ProjectList({
    projects,
    onAdd,
    onEdit,
    onImportGitHub
}: {
    projects: Project[];
    onAdd: () => void;
    onEdit: (proj: Project) => void;
    onImportGitHub: () => void;
}) {
    const logger = createLogger({ component: 'ProjectList' });

    if (projects.length === 0) {
        return (
            <div className="space-y-4">
                <EmptyState
                    title="No projects yet"
                    description="Showcase your work and side projects"
                    actionLabel="Add Project"
                    onAction={() => {
                        logger.info('[ProjectList] Add Project from empty state');
                        onAdd();
                    }}
                />
                <button
                    onClick={onImportGitHub}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 4.238 9.611 9.647 10.674.6.099.817-.26.817-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.44-1.304.806-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.212.685.827.569 5.405-1.065 9.641-5.372 9.641-10.674 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Import from GitHub
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj) => (
                <div
                    key={proj.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer bg-white dark:bg-gray-800"
                    onClick={() => {
                        logger.debug('[ProjectList] Edit project clicked', { id: proj.id });
                        onEdit(proj);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">{proj.name}</h3>
                        <button
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 outline-none"
                            aria-label={`Edit project ${proj.name}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(proj);
                            }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{proj.description}</p>
                    {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {proj.technologies.slice(0, 4).map((tech, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            <button
                onClick={() => {
                    logger.info('[ProjectList] Add Project clicked');
                    onAdd();
                }}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center"
            >
                + Add Project
            </button>
            <button
                onClick={onImportGitHub}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 4.238 9.611 9.647 10.674.6.099.817-.26.817-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.44-1.304.806-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.212.685.827.569 5.405-1.065 9.641-5.372 9.641-10.674 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub Import
            </button>
        </div>
    );
}

// Skill List Component
export function SkillList({
    skills,
    onAdd,
    onEdit
}: {
    skills: Skill[];
    onAdd: () => void;
    onEdit: (skill: Skill) => void;
}) {
    const logger = createLogger({ component: 'SkillList' });

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<string, Skill[]>);

    if (skills.length === 0) {
        return (
            <EmptyState
                title="No skills added"
                description="Add your technical and soft skills"
                actionLabel="Add Skill"
                onAction={() => {
                    logger.info('[SkillList] Add Skill from empty state');
                    onAdd();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categorySkills.map((skill) => (
                            <span
                                key={skill.id}
                                onClick={() => {
                                    logger.debug('[SkillList] Edit skill clicked', { id: skill.id });
                                    onEdit(skill);
                                }}
                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                                {skill.name}
                                {skill.proficiency && (
                                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{skill.proficiency}</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
            <button
                onClick={() => {
                    logger.info('[SkillList] Add Skill clicked');
                    onAdd();
                }}
                className="py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
            >
                + Add Skill
            </button>
        </div>
    );
}

// Education List Component
export function EducationList({
    educations,
    onAdd,
    onEdit
}: {
    educations: Education[];
    onAdd: () => void;
    onEdit: (edu: Education) => void;
}) {
    const logger = createLogger({ component: 'EducationList' });

    if (educations.length === 0) {
        return (
            <EmptyState
                title="No education added"
                description="Add your educational background"
                actionLabel="Add Education"
                onAction={() => {
                    logger.info('[EducationList] Add Education from empty state');
                    onAdd();
                }}
            />
        );
    }

    return (
        <div className="space-y-4">
            {educations.map((edu) => (
                <div
                    key={edu.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer bg-white dark:bg-gray-800"
                    onClick={() => {
                        logger.debug('[EducationList] Edit education clicked', { id: edu.id });
                        onEdit(edu);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{edu.degree} in {edu.field}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(edu.startDate).getFullYear()} -
                                {edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ' Present'}
                                {edu.gpa && ` • GPA: ${edu.gpa.toFixed(2)}`}
                            </p>
                        </div>
                        <button
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(edu);
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
            <button
                onClick={() => {
                    logger.info('[EducationList] Add Education clicked');
                    onAdd();
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
                + Add Education
            </button>
        </div>
    );
}
