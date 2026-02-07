'use client';

/**
 * Custom SWR hook for analytics data with caching
 * Provides stale-while-revalidate pattern for faster perceived performance
 */

import useSWR from 'swr';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'useAnalytics' });

// Types
interface ActivityData {
    name: string;
    applications: number;
}

interface RecentActivity {
    id: string;
    type: string;
    title: string;
    date: string;
    company: string;
}

interface MonthlyTrend {
    month: string;
    coverLetters: number;
}

interface CompanyStat {
    name: string;
    count: number;
}

interface SkillStat {
    name: string;
    count: number;
}

interface SkillGapAnalysis {
    strongSkills: string[];
    suggestedSkills: string[];
}

export interface AnalyticsData {
    completeness: number;
    experienceCount: number;
    projectCount: number;
    skillCount: number;
    educationCount: number;
    coverLetterCount: number;
    weeklyApplicationsCount: number;
    monthlyApplicationsCount?: number;
    totalApplicationsCount?: number;
    activity: ActivityData[];
    weeklyActivity?: ActivityData[];
    recentActivity: RecentActivity[];
    monthlyTrends?: MonthlyTrend[];
    topCompanies?: CompanyStat[];
    topSkills?: SkillStat[];
    skillGapAnalysis?: SkillGapAnalysis;
}

// Global fetcher function
const fetcher = async (url: string): Promise<AnalyticsData> => {
    logger.debug('[useAnalytics] Fetching', { url });
    const start = performance.now();

    const response = await fetch(url);

    if (!response.ok) {
        const error = new Error('Failed to fetch analytics');
        logger.error('[useAnalytics] Fetch failed', {
            status: response.status,
            url,
        });
        throw error;
    }

    const data = await response.json();
    const duration = performance.now() - start;

    logger.debug('[useAnalytics] Fetch complete', {
        duration: Math.round(duration),
        completeness: data.completeness,
    });

    return data;
};

// SWR configuration for optimal UX
const swrConfig = {
    // Revalidate on focus after 5 minutes
    revalidateOnFocus: true,
    focusThrottleInterval: 5 * 60 * 1000,

    // Retry on error with exponential backoff
    errorRetryCount: 3,
    errorRetryInterval: 1000,

    // Keep stale data for 30 seconds while revalidating
    dedupingInterval: 30 * 1000,

    // Don't revalidate on reconnect to save bandwidth
    revalidateOnReconnect: false,
};

/**
 * Hook for fetching analytics data with SWR caching
 * 
 * Benefits:
 * - Instant loading on subsequent visits (stale-while-revalidate)
 * - Automatic deduplication of requests
 * - Background revalidation
 * - Error retry with backoff
 */
export function useAnalytics() {
    const { data, error, isLoading, isValidating, mutate } = useSWR<AnalyticsData>(
        '/api/profile/analytics',
        fetcher,
        swrConfig
    );

    return {
        data,
        isLoading,      // True on first load only
        isValidating,   // True during any revalidation
        error,
        mutate,         // Manual revalidation function

        // Convenience computed values
        isEmpty: !data && !isLoading && !error,
        hasError: !!error,
    };
}

/**
 * Hook for prefetching analytics data
 * Call this early in the page lifecycle (e.g., on dashboard link hover)
 */
export function usePrefetchAnalytics() {
    const { mutate } = useSWR<AnalyticsData>(
        '/api/profile/analytics',
        null, // Don't fetch automatically
        { revalidateOnMount: false }
    );

    const prefetch = () => {
        logger.debug('[useAnalytics] Prefetching');
        mutate(fetcher('/api/profile/analytics'), { revalidate: false });
    };

    return prefetch;
}

export default useAnalytics;
