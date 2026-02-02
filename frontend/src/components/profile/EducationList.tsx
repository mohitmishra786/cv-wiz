/**
 * Education List Component
 * Displays and manages education entries
 */

import { memo } from 'react';
import type { Education } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'EducationList' });

interface EducationListProps {
    educations: Education[];
    onAdd: () => void;
    onEdit: (edu: Education) => void;
}

function EducationListInner({
    educations,
    onAdd,
    onEdit
}: EducationListProps) {
    if (educations.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No education entries yet</p>
                <button
                    onClick={() => {
                        logger.info('[EducationList] Add Education from empty state');
                        onAdd();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Add Education
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {educations.map((edu) => (
                <div
                    key={edu.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => {
                        logger.debug('[EducationList] Edit education clicked', { id: edu.id });
                        onEdit(edu);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {edu.degree} in {edu.field}
                            </h3>
                            <p className="text-gray-600">{edu.institution}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(edu.startDate).getFullYear()} - 
                                {edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ' Present'}
                                {edu.gpa && ` • GPA: ${edu.gpa}`}
                            </p>
                        </div>
                        <button
                            className="text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 outline-none"
                            aria-label={`Edit education at ${edu.institution}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(edu);
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.2325.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                    {edu.honors?.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                            Honors: {edu.honors.join(', ')}
                        </p>
                    )}
                </div>
            ))}
            <button
                onClick={() => {
                    logger.info('[EducationList] Add Education clicked');
                    onAdd();
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
                + Add Education
            </button>
        </div>
    );
}

// Memoized EducationList to prevent unnecessary re-renders
export const EducationList = memo(EducationListInner);
