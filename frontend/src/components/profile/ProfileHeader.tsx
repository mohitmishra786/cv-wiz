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
        <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {profile?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- data-URL from PDF extraction
                        <img
                            src={profile.image}
                            alt={profile?.name ? `${profile.name} profile photo` : 'Profile photo'}
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2"
                            style={{ borderColor: 'var(--border)' }}
                            width={64}
                            height={64}
                        />
                    ) : (
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                            aria-hidden="true"
                        >
                            {profile?.name?.[0] || userEmail?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>
                            {profile?.name || 'Your Name'}
                        </h1>
                        <p style={{ color: 'var(--muted-foreground)' }}>{userEmail}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            logger.info('[ProfileHeader] Upload Resume clicked');
                            onUploadResume();
                        }}
                        className="px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                        Upload Resume
                    </button>
                    <button
                        onClick={() => {
                            logger.info('[ProfileHeader] Edit Profile clicked');
                            onEditProfile();
                        }}
                        className="px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl transition-colors hover:opacity-80"
                        style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
                    >
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{profile?.experiences?.length || 0}</div>
                    <div className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Experiences</div>
                </div>
                <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{profile?.projects?.length || 0}</div>
                    <div className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Projects</div>
                </div>
                <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{profile?.skills?.length || 0}</div>
                    <div className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Skills</div>
                </div>
                <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{profile?.educations?.length || 0}</div>
                    <div className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>Education</div>
                </div>
            </div>
        </div>
    );
}
