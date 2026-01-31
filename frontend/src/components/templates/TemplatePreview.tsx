/**
 * Template Preview Component
 * Visual preview of resume templates with realistic sample data
 */

'use client';

import { memo } from 'react';

interface TemplatePreviewProps {
    id: string;
    name: string;
    description: string;
    sections: string[];
    color: string;
    category?: string;
    bestFor?: string[];
    selected: boolean;
    onSelect: (id: string) => void;
    /** User's actual data for realistic preview */
    userData?: {
        name?: string;
        title?: string;
        experience?: Array<{ title: string; company: string }>;
        skills?: string[];
    };
}

// Sample realistic data for preview
const SAMPLE_DATA = {
    name: 'John Doe',
    title: 'Senior Software Engineer',
    experience: [
        { title: 'Senior Developer', company: 'Tech Corp' },
        { title: 'Software Engineer', company: 'Startup Inc' },
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'Python'],
};

function TemplatePreview({
    id,
    name,
    description,
    sections,
    color,
    category,
    bestFor,
    selected,
    onSelect,
    userData,
}: TemplatePreviewProps) {
    // Use user data if available, otherwise use sample data
    const previewData = userData?.name ? userData : SAMPLE_DATA;

    return (
        <button
            type="button"
            onClick={() => onSelect(id)}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all ${selected
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]'
                }`}
        >
            {/* Selection indicator */}
            {selected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}

            {/* Enhanced Template preview with realistic data */}
            <div className={`w-full h-40 rounded-xl bg-gradient-to-br ${color} mb-4 p-4 overflow-hidden relative`}>
                {/* Resume preview mockup */}
                <div className="bg-white/95 rounded-lg p-3 h-full shadow-lg">
                    {/* Header */}
                    <div className="border-b border-gray-200 pb-2 mb-2">
                        <div className="h-3 w-24 bg-gray-800 rounded mb-1" />
                        <div className="h-2 w-32 bg-gray-500 rounded" />
                    </div>
                    
                    {/* Content sections based on template */}
                    <div className="space-y-2">
                        {/* Experience section */}
                        {sections.includes('Experience') && (
                            <div className="space-y-1">
                                <div className="h-2 w-16 bg-gray-700 rounded" />
                                <div className="h-1.5 w-full bg-gray-300 rounded" />
                                <div className="h-1.5 w-3/4 bg-gray-200 rounded" />
                            </div>
                        )}
                        
                        {/* Skills section */}
                        {sections.includes('Skills') && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {previewData.skills?.slice(0, 3).map((skill, i) => (
                                    <div key={i} className="h-2 w-10 bg-gray-400 rounded" />
                                ))}
                            </div>
                        )}
                        
                        {/* Projects section */}
                        {sections.includes('Projects') && (
                            <div className="space-y-1 mt-2">
                                <div className="h-1.5 w-20 bg-gray-600 rounded" />
                                <div className="h-1 w-full bg-gray-200 rounded" />
                            </div>
                        )}
                        
                        {/* Education section */}
                        {sections.includes('Education') && (
                            <div className="space-y-1 mt-2">
                                <div className="h-1.5 w-14 bg-gray-500 rounded" />
                                <div className="h-1 w-20 bg-gray-300 rounded" />
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Preview label */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    Preview
                </div>
            </div>

            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{name}</h3>
                {category && (
                    <span className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-full font-medium">
                        {category}
                    </span>
                )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>

            {bestFor && bestFor.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-[var(--muted-foreground)] mb-1">Best for:</p>
                    <div className="flex flex-wrap gap-1">
                        {bestFor.map((role, i) => (
                            <span key={i} className="px-2 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] text-xs rounded">
                                {role}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
                {sections.map((section, i) => (
                    <span key={i} className="px-2 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] text-xs rounded">
                        {section}
                    </span>
                ))}
            </div>
            
            {/* Use This Template button */}
            {selected && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <span className="text-sm font-medium text-[var(--primary)] flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Selected - Click to use this template
                    </span>
                </div>
            )}
        </button>
    );
}

export default memo(TemplatePreview);
