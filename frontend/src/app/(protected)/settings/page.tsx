'use client';

/**
 * Settings Page
 * User preferences and account settings
 */

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import type { UserSettings } from '@/types';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/profile/settings')
            .then((res) => res.json())
            .then((data) => {
                setSettings(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const response = await fetch('/api/profile/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (response.ok) {
                setMessage('Settings saved!');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch {
            setMessage('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/profile" className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <span className="text-xl font-bold text-gray-900">Settings</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {message && (
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">{message}</div>
                )}

                {/* Account Section */}
                <section className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                            <p className="text-gray-900">{session?.user?.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                            <p className="text-gray-900">{session?.user?.name || 'Not set'}</p>
                        </div>
                    </div>
                </section>

                {/* Resume Preferences */}
                <section className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume Preferences</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Default Template
                            </label>
                            <select
                                value={settings?.selectedTemplate || 'experience-skills-projects'}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, selectedTemplate: e.target.value as UserSettings['selectedTemplate'] } : prev)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="experience-skills-projects">Professional - Experience First</option>
                                <option value="education-research-skills">Academic - Education First</option>
                                <option value="projects-skills-experience">Developer - Projects First</option>
                                <option value="compact-technical">Technical - Skills First</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-white rounded-2xl shadow-sm p-6 border-2 border-red-100">
                    <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Sign out</p>
                                <p className="text-sm text-gray-500">Sign out of your account on this device</p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
