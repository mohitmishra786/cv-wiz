/**
 * Experience Form Component
 * Form for adding/editing work experience
 */

'use client';

import { useState } from 'react';
import type { Experience } from '@/types';
import { createLogger } from '@/lib/logger';
import { auth } from '@/lib/auth';
import { generateBackendToken } from '@/lib/jwt';

const logger = createLogger({ component: 'ExperienceForm' });

interface ExperienceFormProps {
    experience?: Partial<Experience>;
    onSubmit: (data: Partial<Experience>) => Promise<void>;
    onCancel: () => void;
}

export default function ExperienceForm({ experience, onSubmit, onCancel }: ExperienceFormProps) {
    const [formData, setFormData] = useState({
        company: experience?.company || '',
        title: experience?.title || '',
        location: experience?.location || '',
        startDate: experience?.startDate?.split('T')[0] || '',
        endDate: experience?.endDate?.split('T')[0] || '',
        current: experience?.current || false,
        description: experience?.description || '',
        highlights: experience?.highlights?.join('\n') || '',
        keywords: experience?.keywords?.join(', ') || '',
    });
    const [targetJD, setTargetJD] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [error, setError] = useState('');

    const handleAIEnhance = async () => {
        if (!formData.highlights.trim()) {
            setError('Please enter some achievements to enhance');
            return;
        }

        setIsEnhancing(true);
        setError('');
        try {
            const session = await auth();
            if (!session?.user?.id) {
                throw new Error('Not authenticated');
            }

            const backendToken = await generateBackendToken(session.user.id, session.user.email || undefined);

            const bullets = formData.highlights.split('\n').filter(b => b.trim());
            const enhancedBullets = [];

            for (const bullet of bullets) {
                const res = await fetch('/api/py/ai/enhance-bullet', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${backendToken}`,
                    },
                    body: JSON.stringify({
                        bullet,
                        job_description: targetJD || undefined
                    }),
                });
                const data = await res.json();
                if (res.ok) {
                    enhancedBullets.push(data.enhanced_bullet);
                } else {
                    enhancedBullets.push(bullet);
                }
            }

            setFormData({
                ...formData,
                highlights: enhancedBullets.join('\n')
            });
        } catch (err) {
            logger.error('Failed to enhance bullets', { err });
            setError('AI enhancement failed. Please try again.');
        } finally {
            setIsEnhancing(false);
        }
    };

    logger.debug('[ExperienceForm] Initialized', {
        isEdit: !!experience?.id,
        experienceId: experience?.id
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.company.trim() || !formData.title.trim() || !formData.startDate) {
            setError('Please fill in all required fields');
            logger.warn('[ExperienceForm] Validation failed - missing required fields');
            return;
        }

        logger.startOperation('ExperienceForm:submit');
        setLoading(true);
        setError('');

        try {
            await onSubmit({
                ...formData,
                startDate: formData.startDate,
                endDate: formData.current ? undefined : formData.endDate,
                highlights: formData.highlights.split('\n').filter(h => h.trim()),
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
            });
            logger.endOperation('ExperienceForm:submit');
        } catch (err) {
            logger.failOperation('ExperienceForm:submit', err);
            setError('Failed to save experience. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Company name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Your role"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="City, Country or Remote"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        disabled={formData.current}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="current"
                    checked={formData.current}
                    onChange={(e) => setFormData({ ...formData, current: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="current" className="text-sm text-gray-700">I currently work here</label>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Brief overview of your role"
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Key Achievements</label>
                    <button
                        type="button"
                        onClick={handleAIEnhance}
                        disabled={isEnhancing || !formData.highlights.trim()}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                    >
                        {isEnhancing ? (
                            <>
                                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                Enhancing...
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                AI Enhance
                            </>
                        )}
                    </button>
                </div>
                <textarea
                    value={formData.highlights}
                    onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Enter each achievement on a new line"
                />
                <p className="mt-1 text-xs text-gray-500">One achievement per line. Start with action verbs.</p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                    Target Job Description (Optional for AI)
                </label>
                <textarea
                    value={targetJD}
                    onChange={(e) => setTargetJD(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Paste job requirements here to tailor achievements..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="React, TypeScript, Leadership (comma separated)"
                />
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Experience'}
                </button>
            </div>
        </form>
    );
}
