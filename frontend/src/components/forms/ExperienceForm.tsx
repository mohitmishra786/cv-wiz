/**
 * Experience Form Component
 * Form for adding/editing work experience
 */

'use client';

import { useState } from 'react';
import type { Experience } from '@/types';
import { createLogger } from '@/lib/logger';

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
                <textarea
                    value={formData.highlights}
                    onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Enter each achievement on a new line"
                />
                <p className="mt-1 text-xs text-gray-500">One achievement per line. Start with action verbs.</p>
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
