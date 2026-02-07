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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex gap-2 sm:gap-4 px-4 sm:px-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                logger.debug('[ProfileTabs] Tab switched', { tab: tab.id });
                                onTabChange(tab.id);
                            }}
                            className={`py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {tab.id !== 'cover-letters' && (
                                <span className="ml-1 sm:ml-2 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
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
