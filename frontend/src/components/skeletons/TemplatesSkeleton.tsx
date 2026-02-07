import Skeleton from "@/components/ui/Skeleton";

export default function TemplatesSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Filter Skeleton */}
        <div
          className="mb-6 rounded-xl shadow-sm p-4"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--card)',
                border: '2px solid var(--border)',
              }}
            >
              <Skeleton className="h-32 w-full rounded-xl mb-4" />
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex gap-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-6 w-16 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}