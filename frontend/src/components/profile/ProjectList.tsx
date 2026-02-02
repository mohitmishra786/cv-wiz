/**
 * Project List Component
 * Displays and manages project entries
 */

import { memo } from 'react';
import type { Project } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'ProjectList' });

interface ProjectListProps {
    projects: Project[];
    onAdd: () => void;
    onEdit: (proj: Project) => void;
    onImportGitHub: () => void;
}

function ProjectListInner({
    projects,
    onAdd,
    onEdit,
    onImportGitHub
}: ProjectListProps) {
    if (projects.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No projects yet</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => {
                            logger.info('[ProjectList] Add Project from empty state');
                            onAdd();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Add Project
                    </button>
                    <button
                        onClick={() => {
                            logger.info('[ProjectList] Import from GitHub from empty state');
                            onImportGitHub();
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Import from GitHub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {projects.map((proj) => (
                <div
                    key={proj.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => {
                        logger.debug('[ProjectList] Edit project clicked', { id: proj.id });
                        onEdit(proj);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-900">{proj.name}</h3>
                            {proj.url && (
                                <a
                                    href={proj.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:text-indigo-500"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {proj.url}
                                </a>
                            )}
                            {proj.technologies && proj.technologies.length > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {proj.technologies.join(', ')}
                                </p>
                            )}
                        </div>
                        <button
                            className="text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 outline-none"
                            aria-label={`Edit project ${proj.name}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(proj);
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.2325.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                    {proj.highlights?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                            {proj.highlights.slice(0, 3).map((highlight, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
            <div className="flex gap-3">
                <button
                    onClick={() => {
                        logger.info('[ProjectList] Add Project clicked');
                        onAdd();
                    }}
                    className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                >
                    + Add Project
                </button>
                <button
                    onClick={() => {
                        logger.info('[ProjectList] Import from GitHub clicked');
                        onImportGitHub();
                    }}
                    className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                >
                    Import from GitHub
                </button>
            </div>
        </div>
    );
}

// Memoized ProjectList to prevent unnecessary re-renders
export const ProjectList = memo(ProjectListInner);
