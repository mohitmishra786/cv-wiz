/**
 * Template Preview Component
 * Visual preview of resume templates
 */

'use client';

interface TemplatePreviewProps {
    id: string;
    name: string;
    description: string;
    sections: string[];
    color: string;
    selected: boolean;
    onSelect: (id: string) => void;
}

export default function TemplatePreview({
    id,
    name,
    description,
    sections,
    color,
    selected,
    onSelect,
}: TemplatePreviewProps) {
    return (
        <button
            onClick={() => onSelect(id)}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all ${selected
                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
        >
            {/* Selection indicator */}
            {selected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}

            {/* Template preview mock */}
            <div className={`w-full h-32 rounded-xl bg-gradient-to-br ${color} mb-4 p-4`}>
                <div className="space-y-2">
                    <div className="h-3 w-2/3 bg-white/30 rounded" />
                    <div className="h-2 w-1/2 bg-white/20 rounded" />
                    <div className="flex gap-2 mt-4">
                        {sections.slice(0, 3).map((section, i) => (
                            <div key={i} className="h-2 w-12 bg-white/20 rounded" />
                        ))}
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>

            <div className="flex flex-wrap gap-2 mt-4">
                {sections.map((section, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {section}
                    </span>
                ))}
            </div>
        </button>
    );
}
