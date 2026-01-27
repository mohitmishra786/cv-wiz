'use client';

/**
 * Templates Page
 * Resume template selection with previews
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const TEMPLATES = [
    {
        id: 'experience-skills-projects',
        name: 'Professional',
        description: 'Best for experienced professionals. Emphasizes work history and technical skills with selected projects.',
        sections: ['Experience', 'Skills', 'Projects', 'Education'],
        color: 'from-blue-500 to-indigo-600',
    },
    {
        id: 'education-research-skills',
        name: 'Academic',
        description: 'Ideal for academics, researchers, and recent graduates. Highlights education, publications, and research.',
        sections: ['Education', 'Publications', 'Experience', 'Skills'],
        color: 'from-emerald-500 to-teal-600',
    },
    {
        id: 'projects-skills-experience',
        name: 'Developer',
        description: 'Great for developers and makers. Leads with project portfolio and technical skills.',
        sections: ['Projects', 'Skills', 'Experience', 'Education'],
        color: 'from-purple-500 to-pink-600',
    },
    {
        id: 'compact-technical',
        name: 'Technical',
        description: 'Maximizes technical skill visibility. Compact layout for roles requiring specific expertise.',
        sections: ['Skills', 'Experience', 'Projects', 'Education'],
        color: 'from-orange-500 to-red-600',
    },
];

export default function TemplatesPage() {
    const { data: session } = useSession();
    const [selectedTemplate, setSelectedTemplate] = useState('experience-skills-projects');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Load current setting
        fetch('/api/profile/settings')
            .then((res) => res.json())
            .then((data) => {
                if (data.selectedTemplate) {
                    setSelectedTemplate(data.selectedTemplate);
                }
            })
            .catch(console.error);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/profile/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedTemplate }),
            });
        } catch (error) {
            console.error('Failed to save template:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                     <div className="flex items-center gap-2 sm:gap-4">
                         <Link href="/profile" className="text-gray-400 hover:text-gray-600">
                             <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                             </svg>
                         </Link>
                         <div className="flex items-center gap-2 sm:gap-3">
                             <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                 <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                     <polyline points="14 2 14 8 20 8" />
                                 </svg>
                             </div>
                             <span className="text-lg sm:text-xl font-bold text-gray-900">Resume Templates</span>
                         </div>
                     </div>

                     <button
                         onClick={handleSave}
                         disabled={saving}
                         className="px-4 py-2 sm:px-5 sm:py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 text-sm sm:text-base"
                     >
                         {saving ? 'Saving...' : 'Save Selection'}
                     </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Choose Your Template</h1>
                    <p className="text-gray-600 mt-2">
                        Select the resume layout that best highlights your strengths
                    </p>
                </div>

                 <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    {TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`relative p-6 rounded-2xl border-2 text-left transition-all ${selectedTemplate === template.id
                                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            {/* Selection indicator */}
                            {selectedTemplate === template.id && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}

                            {/* Template preview */}
                             <div className={`w-full h-24 sm:h-32 rounded-xl bg-gradient-to-br ${template.color} mb-4 p-3 sm:p-4`}>
                                <div className="space-y-2">
                                    <div className="h-3 w-2/3 bg-white/30 rounded" />
                                    <div className="h-2 w-1/2 bg-white/20 rounded" />
                                    <div className="flex gap-2 mt-4">
                                        {template.sections.slice(0, 3).map((section, i) => (
                                            <div key={i} className="h-2 w-12 bg-white/20 rounded" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {template.sections.map((section, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                        {section}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Preview Section */}
                <div className="mt-12 bg-white rounded-2xl shadow-sm p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {TEMPLATES.find((t) => t.id === selectedTemplate)?.name} Template Selected
                    </h2>
                    <p className="text-gray-600 mb-6">
                        This template will be used when generating resumes from the browser extension
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Install the CV-Wiz browser extension to generate tailored resumes
                    </div>
                </div>
            </main>
        </div>
    );
}
