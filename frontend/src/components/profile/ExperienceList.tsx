/**
 * Experience List Component
 * Displays and manages work experience entries
 */

import { memo } from 'react';
import type { Experience } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'ExperienceList' });

interface ExperienceListProps {
    experiences: Experience[];
    onAdd: () => void;
    onEdit: (exp: Experience) => void;
}

function ExperienceListInner({
    experiences,
    onAdd,
    onEdit
}: ExperienceListProps) {
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
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => {
                        logger.debug('[ExperienceList] Edit experience clicked', { id: exp.id });
                        onEdit(exp);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -
                                {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                            </p>
                        </div>
                        <button
                            className="text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 outline-none"
                            aria-label={`Edit experience at ${exp.company}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(exp);
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.2325.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                    {exp.highlights?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                            {exp.highlights.slice(0, 3).map((highlight, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
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

// Empty State Component
function EmptyState({
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
        <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{description}</p>
            <button
                onClick={onAction}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                {actionLabel}
            </button>
        </div>
    );
}

// Memoized ExperienceList to prevent unnecessary re-renders
export const ExperienceList = memo(ExperienceListInner);
