/**
 * Skill List Component
 * Displays and manages skill entries
 */

import { memo } from 'react';
import type { Skill } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'SkillList' });

interface SkillListProps {
    skills: Skill[];
    onAdd: () => void;
    onEdit: (skill: Skill) => void;
}

function SkillListInner({
    skills,
    onAdd,
    onEdit
}: SkillListProps) {
    if (skills.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No skills added yet</p>
                <button
                    onClick={() => {
                        logger.info('[SkillList] Add Skill from empty state');
                        onAdd();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Add Skill
                </button>
            </div>
        );
    }

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(skill);
        return acc;
    }, {} as Record<string, Skill[]>);

    return (
        <div className="space-y-6">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                        {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categorySkills.map((skill) => (
                            <div
                                key={skill.id}
                                className="group flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:border-indigo-200"
                                onClick={() => {
                                    logger.debug('[SkillList] Edit skill clicked', { id: skill.id });
                                    onEdit(skill);
                                }}
                            >
                                <span className="text-gray-700 group-hover:text-indigo-700">
                                    {skill.name}
                                </span>
                                <svg
                                    className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.2325.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button
                onClick={() => {
                    logger.info('[SkillList] Add Skill clicked');
                    onAdd();
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
                + Add Skill
            </button>
        </div>
    );
}

// Memoized SkillList to prevent unnecessary re-renders
export const SkillList = memo(SkillListInner);
