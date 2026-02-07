import Skeleton from "@/components/ui/Skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header Skeleton */}
        <div
          className="rounded-2xl shadow-sm p-6 mb-6"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>

          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-8 mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div
          className="rounded-2xl shadow-sm"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="px-6 pt-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex gap-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 mb-4" />
              ))}
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}