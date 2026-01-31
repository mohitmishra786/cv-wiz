/**
 * Skeleton Components Index
 * Re-exports all skeleton components for consistent loading states
 */

export { default as DashboardSkeleton } from './DashboardSkeleton';
export { default as ProfileSkeleton } from './ProfileSkeleton';
export { default as TemplatesSkeleton } from './TemplatesSkeleton';

// Re-export enhanced skeleton components from UI
export {
    Skeleton,
    SkeletonText,
    SkeletonCard,
    SkeletonAvatar,
    SkeletonTable,
    SkeletonList,
    LoadingState,
} from '@/components/ui/Skeleton';
