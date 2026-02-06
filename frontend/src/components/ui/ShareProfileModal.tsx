'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from './ToastProvider';
import { logger } from "@/lib/logger";

interface ShareProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    isPublicInitial: boolean;
    onUpdate: (isPublic: boolean) => void;
}

export default function ShareProfileModal({ isOpen, onClose, userId, isPublicInitial, onUpdate }: ShareProfileModalProps) {
    const [isPublic, setIsPublic] = useState(isPublicInitial);
    const [loading, setLoading] = useState(false);
    const { success, error } = useToast();
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
        setIsPublic(isPublicInitial);
    }, [isPublicInitial]);

    const shareUrl = `${origin}/p/${userId}`;

    const handleToggle = async () => {
        setLoading(true);
        const newState = !isPublic;
        try {
            // Fetch current settings to merge
            const res = await fetch('/api/profile/settings');
            const data = await res.json();
            const currentPrefs = data.data?.resumePreferences || {};

            const updateRes = await fetch('/api/profile/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumePreferences: {
                        ...currentPrefs,
                        isPublic: newState
                    }
                }),
            });

            if (!updateRes.ok) throw new Error('Failed to update');

            setIsPublic(newState);
            onUpdate(newState);
            success(newState ? 'Profile is now public' : 'Profile is now private');
        } catch (err) {
            error('Failed to update sharing settings');
            logger.warn('[ShareProfile] Failed to copy link', { error: err });
            alert('Failed to copy link');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        success('Link copied to clipboard');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Your Profile">
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                        <h3 className="font-medium text-gray-900">Public Access</h3>
                        <p className="text-sm text-gray-500">Allow anyone with the link to view your profile</p>
                    </div>
                    <button
                        onClick={handleToggle}
                        disabled={loading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isPublic ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {isPublic && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Your Public Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 block w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button
                                onClick={copyLink}
                                className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy
                            </button>
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>
                                Public profiles include your experience, skills, projects, and education.
                                Contact details like email and phone are hidden for privacy.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}