import {
  getResumeVersions,
  createResumeSnapshot,
} from '@/app/actions/resume-history'
import { HISTORY_MAX_PAGE_SIZE, HISTORY_PAGE_SIZE } from '@/lib/constants'
import { HistoryList } from '@/components/resumes/HistoryList'

export const metadata = {
  title: 'Version History | MatchQuill',
  description: 'Manage resume versions and backups',
}

interface HistoryPageProps {
  searchParams: Promise<{ page?: string; limit?: string }>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const requestedLimit = parseInt(params.limit || String(HISTORY_PAGE_SIZE), 10) || HISTORY_PAGE_SIZE
  const limit = Math.min(Math.max(1, requestedLimit), HISTORY_MAX_PAGE_SIZE)

  const result = await getResumeVersions(page, limit)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}
            >
              Version History
            </h1>
            <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Save snapshots and restore previous versions
            </p>
          </div>
          <form
            action={async () => {
              'use server'
              await createResumeSnapshot()
            }}
          >
            <button
              type="submit"
              className="px-4 py-2.5 min-h-[44px] font-semibold rounded-xl transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              Save Current Version
            </button>
          </form>
        </div>

        <HistoryList
          versions={result.versions}
          pagination={{
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
          }}
        />
      </main>
    </div>
  )
}
