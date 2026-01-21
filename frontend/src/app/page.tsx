/**
 * CV-Wiz Home Page
 * Landing page with feature highlights and CTA
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeProvider';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{
        background: 'rgba(var(--card-rgb), 0.9)',
        borderColor: 'var(--border)'
      }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="CV-Wiz Logo"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>CV-Wiz</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{
            background: 'var(--muted)',
            color: 'var(--primary)'
          }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--primary)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--primary)' }}></span>
            </span>
            Powered by AI
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
            Tailored Resumes for
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"> Every Job</span>
          </h1>

          <p className="mt-6 text-xl max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            Build your career profile once. Generate perfectly tailored resumes and cover letters
            for each job application with one click.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all text-lg"
            >
              Create Free Account
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 border-2 font-semibold rounded-xl transition-all text-lg hover:opacity-80"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                background: 'var(--card)'
              }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4" style={{ background: 'var(--muted)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
              How It Works
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--muted-foreground)' }}>
              Three simple steps to your perfect resume
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl shadow-sm" style={{ background: 'var(--card)' }}>
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="mt-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--muted)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Build Your Profile</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Add your complete career history, skills, projects, and education. Or upload your existing resume!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl shadow-sm" style={{ background: 'var(--card)' }}>
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="mt-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--muted)' }}>
                  <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Browse Jobs</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Install our browser extension. When you find a job you like, CV-Wiz automatically extracts the requirements.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl shadow-sm" style={{ background: 'var(--card)' }}>
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="mt-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--muted)' }}>
                  <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Generate & Apply</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  One click generates a tailored resume and cover letter. Download PDFs and apply with confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4" style={{ background: 'var(--background)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl shadow-sm border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--muted)' }}>
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>ATS-Friendly</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Resumes are formatted to pass Applicant Tracking Systems. No fancy formatting that gets rejected.
              </p>
            </div>

            <div className="p-8 rounded-2xl shadow-sm border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--muted)' }}>
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>AI-Powered Matching</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Our algorithm matches your experience to job requirements, highlighting your most relevant skills.
              </p>
            </div>

            <div className="p-8 rounded-2xl shadow-sm border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--muted)' }}>
                <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No Hallucination</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                We only use YOUR data. No AI-invented facts or exaggerations. Your authentic experience, perfectly presented.
              </p>
            </div>

            <div className="p-8 rounded-2xl shadow-sm border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--muted)' }}>
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Multiple Templates</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Choose from professional, academic, developer, and technical templates based on your target role.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ background: 'var(--muted)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of job seekers using CV-Wiz to create tailored applications in seconds.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-all text-lg"
            >
              Start Free Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="CV-Wiz Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>CV-Wiz</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            © 2026 CV-Wiz. Build resumes that get noticed.
          </p>
        </div>
      </footer>
    </div>
  );
}
