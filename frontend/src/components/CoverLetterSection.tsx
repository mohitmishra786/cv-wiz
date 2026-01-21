/**
 * Cover Letter Section Component
 * Allows users to create and manage cover letters
 */

'use client';

import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'CoverLetterSection' });

interface CoverLetter {
    id: string;
    content: string;
    jobTitle?: string;
    companyName?: string;
    createdAt: string;
    updatedAt: string;
}

export default function CoverLetterSection() {
    const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [content, setContent] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCoverLetters();
    }, []);

    const fetchCoverLetters = async () => {
        logger.startOperation('CoverLetterSection:fetch');
        setLoading(true);
        try {
            const response = await fetch('/api/profile/cover-letter');
            if (response.ok) {
                const data = await response.json();
                setCoverLetters(data.coverLetters || []);
                logger.endOperation('CoverLetterSection:fetch');
            }
        } catch (err) {
            logger.failOperation('CoverLetterSection:fetch', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) {
            setError('Cover letter content is required');
            return;
        }

        logger.startOperation('CoverLetterSection:save');
        setSaving(true);
        setError('');

        try {
            const response = await fetch('/api/profile/cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content.trim(),
                    jobTitle: jobTitle.trim() || undefined,
                    companyName: companyName.trim() || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save cover letter');
            }

            logger.endOperation('CoverLetterSection:save');
            setContent('');
            setJobTitle('');
            setCompanyName('');
            setIsCreating(false);
            fetchCoverLetters();
        } catch (err) {
            logger.failOperation('CoverLetterSection:save', err);
            setError('Failed to save cover letter. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        logger.startOperation('CoverLetterSection:delete');
        try {
            const response = await fetch(`/api/profile/cover-letter?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setCoverLetters(prev => prev.filter(cl => cl.id !== id));
                logger.endOperation('CoverLetterSection:delete');
            }
        } catch (err) {
            logger.failOperation('CoverLetterSection:delete', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {isCreating ? (
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                            <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Software Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Google"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter Content *</label>
                        <textarea
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value);
                                if (error) setError('');
                            }}
                            rows={10}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none ${error ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Dear Hiring Manager,

I am writing to express my interest in..."
                        />
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                logger.debug('[CoverLetterSection] Cancel create');
                                setIsCreating(false);
                                setContent('');
                                setJobTitle('');
                                setCompanyName('');
                                setError('');
                            }}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Cover Letter'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {coverLetters.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No cover letters yet</h3>
                            <p className="text-gray-500 mb-4">Create a cover letter to use with your job applications</p>
                            <button
                                onClick={() => {
                                    logger.info('[CoverLetterSection] Starting new cover letter');
                                    setIsCreating(true);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Create Cover Letter
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {coverLetters.map((cl) => (
                                <div key={cl.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {cl.jobTitle || 'Cover Letter'}
                                                {cl.companyName && <span className="text-gray-600"> @ {cl.companyName}</span>}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Created {new Date(cl.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(cl.id)}
                                            className="text-gray-400 hover:text-red-600 p-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-gray-600 text-sm line-clamp-3">{cl.content}</p>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    logger.info('[CoverLetterSection] Starting new cover letter');
                                    setIsCreating(true);
                                }}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                            >
                                + Add Cover Letter
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
