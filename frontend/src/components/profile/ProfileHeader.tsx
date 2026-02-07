'use client';

/**
 * Profile Header Component
 * Displays user profile information and stats
 */

import type { UserProfile } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'ProfileHeader' });

interface ProfileHeaderProps {
    profile: UserProfile | null;
    userEmail: string | null | undefined;
    onUploadResume: () => void;
    onEditProfile: () => void;
}

export function ProfileHeader({
    profile,
    userEmail,
    onUploadResume,
    onEditProfile
}: ProfileHeaderProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {profile?.name?.[0] || userEmail?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {profile?.name || 'Your Name'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">{userEmail}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            logger.info('[ProfileHeader] Upload Resume clicked');
                            onUploadResume();
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors"
                    >
                        Upload Resume
                    </button>
                    <button
                        onClick={() => {
                            logger.info('[ProfileHeader] Edit Profile clicked');
                            onEditProfile();
                        }}
                        className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{profile?.experiences?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Experiences</div>
                </div>
                <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{profile?.projects?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Projects</div>
                </div>
                <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{profile?.skills?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Skills</div>
                </div>
                <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{profile?.educations?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Education</div>
                </div>
            </div>
        </div>
    );
}
