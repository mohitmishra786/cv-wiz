'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'MobileNav' });

export default function MobileNav() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    logger.debug('[MobileNav] Toggle menu', { isOpen: !isOpen });
    setIsOpen(!isOpen);
  };

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ background: 'var(--card)' }}>
      <div className="flex justify-around items-center py-3 px-4">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={() => {
            logger.info('[MobileNav] Dashboard link clicked');
            setIsOpen(false);
          }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[10px]">Dashboard</span>
        </Link>

        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={() => {
            logger.info('[MobileNav] Profile link clicked');
            setIsOpen(false);
          }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px]">Profile</span>
        </Link>

        <Link
          href="/templates"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={() => {
            logger.info('[MobileNav] Templates link clicked');
            setIsOpen(false);
          }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="text-[10px]">Templates</span>
        </Link>

        <Link
          href="/interview-prep"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={() => {
            logger.info('[MobileNav] Interview Prep link clicked');
            setIsOpen(false);
          }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-[10px]">Interview</span>
        </Link>

        <button
          aria-expanded={isOpen}
          aria-controls="mobile-nav-menu"
          aria-haspopup="menu"
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={() => {
            logger.info('[MobileNav] Menu toggle clicked');
            toggleMenu();
          }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[10px]">Menu</span>
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div 
          id="mobile-nav-menu"
          className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-xl" 
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="py-4 px-4 space-y-3">
            {session ? (
              <>
                <Link
                  href="/settings"
                  className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-indigo-50 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                  onClick={() => {
                    logger.info('[MobileNav] Settings link clicked');
                    setIsOpen(false);
                  }}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    logger.info('[MobileNav] Sign out clicked');
                    signOut({ callbackUrl: '/' });
                    setIsOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-indigo-50 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-indigo-50 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                  onClick={() => {
                    logger.info('[MobileNav] Login link clicked');
                    setIsOpen(false);
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block py-2 px-3 rounded-lg bg-indigo-600 text-white text-center font-medium hover:bg-indigo-700 transition-colors"
                  onClick={() => {
                    logger.info('[MobileNav] Register link clicked');
                    setIsOpen(false);
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}