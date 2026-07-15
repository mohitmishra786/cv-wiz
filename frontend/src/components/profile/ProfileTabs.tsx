'use client';

/**
 * Profile Tabs Component
 * Tab navigation for profile sections
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'ProfileTabs' });

interface Tab {
    id: string;
    label: string;
    count: number;
}

interface ProfileTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
    return (
        <div className="rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="border-b" style={{ borderColor: 'var(--border)' }}>
                <nav className="flex gap-2 sm:gap-4 px-4 sm:px-6 overflow-x-auto" aria-label="Profile sections">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                logger.debug('[ProfileTabs] Tab switched', { tab: tab.id });
                                onTabChange(tab.id);
                            }}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                            className="py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap"
                            style={
                                activeTab === tab.id
                                    ? { borderColor: 'var(--primary)', color: 'var(--primary)' }
                                    : { borderColor: 'transparent', color: 'var(--muted-foreground)' }
                            }
                        >
                            {tab.label}
                            {tab.id !== 'cover-letters' && (
                                <span
                                    className="ml-1 sm:ml-2 px-1.5 py-0.5 rounded-full text-xs"
                                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
