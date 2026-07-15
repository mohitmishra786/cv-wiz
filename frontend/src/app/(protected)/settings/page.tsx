'use client';

/**
 * Settings Page
 * User preferences and account settings
 */

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import type { UserSettings } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function SettingsPage() {
    const { data: session } = useSession();
    const { language, setLanguage } = useLanguage();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [portalLoading, setPortalLoading] = useState(false);
    const [billingError, setBillingError] = useState('');

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

    const handleManageBilling = async () => {
        setPortalLoading(true);
        setBillingError('');
        try {
            const res = await fetch('/api/billing/portal', { method: 'POST' });
            const data = await res.json();
            if (!res.ok || !data.url) {
                throw new Error(data.error || 'Failed to open billing portal');
            }
            window.location.href = data.url;
        } catch (err) {
            setBillingError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setPortalLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--background)' }}>
            {/* Header */}
            <header className="border-b sticky top-0 z-10" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/profile" className="rounded-lg p-1 transition-colors hover:opacity-70" style={{ color: 'var(--muted-foreground)' }} aria-label="Back to profile">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <span className="text-xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>Settings</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 min-h-[44px] font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {message && (
                    <div
                        className="p-4 rounded-xl text-sm font-medium"
                        style={{ background: 'color-mix(in srgb, var(--accent-green) 12%, transparent)', color: 'var(--accent-green)' }}
                        role="status"
                    >
                        {message}
                    </div>
                )}

                {/* Account Section */}
                <section className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Account</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Email</label>
                            <p style={{ color: 'var(--foreground)' }}>{session?.user?.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Name</label>
                            <p style={{ color: 'var(--foreground)' }}>{session?.user?.name || 'Not set'}</p>
                        </div>
                    </div>
                </section>

                {/* Billing Section */}
                <section className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Billing</h2>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                Current plan:{' '}
                                <span className="font-semibold">
                                    {settings?.subscriptionTier === 'PRO' ? 'Pro' : 'Free'}
                                </span>
                            </p>
                            {settings?.subscriptionTier === 'PRO' && settings?.currentPeriodEnd && (
                                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                    {settings.cancelAtPeriodEnd
                                        ? `Cancels on ${new Date(settings.currentPeriodEnd).toLocaleDateString()}`
                                        : `Renews on ${new Date(settings.currentPeriodEnd).toLocaleDateString()}`}
                                </p>
                            )}
                            {(!settings?.subscriptionTier || settings.subscriptionTier === 'FREE') && (
                                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                    Upgrade for unlimited tailored resumes and semantic job matching.
                                </p>
                            )}
                        </div>

                        {settings?.subscriptionTier === 'PRO' ? (
                            <button
                                onClick={handleManageBilling}
                                disabled={portalLoading}
                                className="px-4 py-2.5 min-h-[44px] border-2 font-semibold rounded-xl transition-colors disabled:opacity-50 hover:opacity-80"
                                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                            >
                                {portalLoading ? 'Opening…' : 'Manage subscription / Cancel'}
                            </button>
                        ) : (
                            <Link
                                href="/pricing"
                                className="px-4 py-2.5 min-h-[44px] inline-flex items-center font-semibold rounded-xl transition-opacity hover:opacity-90"
                                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                            >
                                Upgrade to Pro
                            </Link>
                        )}
                    </div>
                    {billingError && <p className="mt-3 text-sm" style={{ color: 'var(--destructive)' }}>{billingError}</p>}
                </section>

                {/* Language Section */}
                <section className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Language</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                                App Language
                            </label>
                            <div className="flex gap-2" role="group" aria-label="App language">
                                <button
                                    onClick={() => setLanguage('en')}
                                    aria-pressed={language === 'en'}
                                    className="px-4 py-2.5 min-h-[44px] rounded-xl border-2 font-medium transition-colors"
                                    style={
                                        language === 'en'
                                            ? { borderColor: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }
                                            : { borderColor: 'var(--border)', color: 'var(--foreground-secondary)' }
                                    }
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLanguage('es')}
                                    aria-pressed={language === 'es'}
                                    className="px-4 py-2.5 min-h-[44px] rounded-xl border-2 font-medium transition-colors"
                                    style={
                                        language === 'es'
                                            ? { borderColor: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }
                                            : { borderColor: 'var(--border)', color: 'var(--foreground-secondary)' }
                                    }
                                >
                                    Español
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Resume Preferences */}
                <section className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Resume Preferences</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="default-template" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground-secondary)' }}>
                                Default Template
                            </label>
                            <select
                                id="default-template"
                                value={settings?.selectedTemplate || 'experience-skills-projects'}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, selectedTemplate: e.target.value as UserSettings['selectedTemplate'] } : prev)}
                                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2"
                                style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
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
                <section
                    className="rounded-2xl border-2 p-6"
                    style={{ background: 'var(--card)', borderColor: 'color-mix(in srgb, var(--destructive) 30%, var(--border))' }}
                >
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--destructive)' }}>Danger Zone</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className="font-medium" style={{ color: 'var(--foreground)' }}>Sign out</p>
                                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Sign out of your account on this device</p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="px-4 py-2.5 min-h-[44px] border rounded-xl transition-colors hover:opacity-80"
                                style={{ borderColor: 'color-mix(in srgb, var(--destructive) 40%, var(--border))', color: 'var(--destructive)' }}
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
