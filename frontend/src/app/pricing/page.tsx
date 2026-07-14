/**
 * MatchQuill Pricing Page
 *
 * Public page (no auth required) so visitors can see pricing before signing
 * up. Uses Stripe Checkout (redirect) to start a subscription — no Stripe.js
 * on this page, so no CSP changes were needed.
 *
 * Disclosure (no dark patterns):
 * - Plan price, billing interval, and "auto-renews" language are stated
 *   directly on the card, not hidden in fine print.
 * - Cancellation is one click away in Settings -> Billing (Stripe billing
 *   portal), no "contact support to cancel" flow.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const FREE_FEATURES = [
    '5 tailored resumes per month',
    'Core resume templates',
    'Cover letter generation',
    'Job application tracker',
];

const PRO_FEATURES = [
    'Unlimited tailored resumes',
    'Semantic job-match scoring (new)',
    'Full template library',
    'Priority AI processing',
    'Cancel anytime, no lock-in',
];

export default function PricingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAuthenticated = status === 'authenticated' && !!session?.user;

    const handleUpgrade = async () => {
        if (!isAuthenticated) {
            router.push('/register?redirect=/pricing');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: 'PRO' }),
            });
            const data = await res.json();
            if (!res.ok || !data.url) {
                throw new Error(data.error || 'Failed to start checkout');
            }
            window.location.href = data.url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--background)' }}>
            <section className="pt-24 pb-16 px-4 sm:pt-32 sm:pb-20">
                <div className="max-w-3xl mx-auto text-center px-4">
                    <h1
                        className="text-4xl sm:text-5xl font-bold leading-tight"
                        style={{ color: 'var(--foreground)' }}
                    >
                        Simple, honest{' '}
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                            pricing
                        </span>
                    </h1>
                    <p className="mt-4 text-lg" style={{ color: 'var(--muted-foreground)' }}>
                        Start free. Upgrade when you need unlimited tailoring. Cancel anytime, in one click.
                    </p>
                </div>
            </section>

            <section className="px-4 pb-20">
                <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6 sm:gap-8 px-4">
                    {/* Free tier */}
                    <div
                        className="p-8 rounded-2xl shadow-sm border flex flex-col"
                        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                    >
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                            Free
                        </h2>
                        <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                            $0
                            <span className="text-base font-normal" style={{ color: 'var(--muted-foreground)' }}>
                                {' '}
                                / month
                            </span>
                        </p>
                        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            For occasional job applications.
                        </p>

                        <ul className="mt-6 space-y-3 flex-1">
                            {FREE_FEATURES.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                                    <span style={{ color: 'var(--primary)' }}>✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href={isAuthenticated ? '/dashboard' : '/register'}
                            className="mt-8 w-full text-center px-6 py-3 border-2 font-semibold rounded-xl transition-all hover:opacity-80"
                            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        >
                            {isAuthenticated ? 'Your current plan' : 'Start Free'}
                        </Link>
                    </div>

                    {/* Pro tier */}
                    <div
                        className="relative p-8 rounded-2xl shadow-xl border-2 flex flex-col"
                        style={{ borderColor: 'var(--primary)', background: 'var(--card)' }}
                    >
                        <span
                            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600"
                        >
                            Most Popular
                        </span>

                        <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                            Pro
                        </h2>
                        <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                            $9.99
                            <span className="text-base font-normal" style={{ color: 'var(--muted-foreground)' }}>
                                {' '}
                                / month
                            </span>
                        </p>
                        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            Billed monthly. Auto-renews until cancelled — cancel anytime from Settings, no
                            questions asked.
                        </p>

                        <ul className="mt-6 space-y-3 flex-1">
                            {PRO_FEATURES.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                                    <span style={{ color: 'var(--primary)' }}>✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Redirecting to Stripe…' : 'Upgrade to Pro'}
                        </button>

                        {error && (
                            <p className="mt-3 text-sm text-center" style={{ color: 'var(--destructive, #dc2626)' }}>
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                <p className="max-w-4xl mx-auto mt-8 px-4 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Payments are processed securely by Stripe. We never see or store your card details.
                    Manage or cancel your subscription anytime from{' '}
                    <Link href="/settings" className="underline">
                        Settings
                    </Link>
                    .
                </p>
            </section>
        </div>
    );
}
