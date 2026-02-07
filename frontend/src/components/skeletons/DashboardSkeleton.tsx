import Skeleton from "@/components/ui/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section - Hero Card */}
        <div
          className="rounded-3xl p-8 animate-pulse"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
              <Skeleton className="h-4 w-96 bg-white/20" />
              <div className="mt-6 flex gap-3">
                <Skeleton className="h-10 w-28 rounded-xl bg-white/30" />
                <Skeleton className="h-10 w-28 rounded-xl bg-white/20" />
              </div>
            </div>
            <Skeleton className="w-32 h-32 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl shadow-sm"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div
            className="lg:col-span-2 p-6 rounded-2xl shadow-sm"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex items-end justify-between h-64 gap-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="w-full rounded-t-lg" style={{ height: `${(i + 1) * 12 + 20}%` }} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="p-6 rounded-2xl shadow-sm"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}