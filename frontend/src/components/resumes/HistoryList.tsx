'use client'

import Link from 'next/link'
import { restoreResumeVersion } from '@/app/actions/resume-history'
import { useState } from 'react'
import { Prisma } from '@prisma/client'
import { buildHistoryPageHref, getSnapshotStats } from './history-utils'

// Re-export pure helpers for consumers that imported from this module
export { buildHistoryPageHref, getSnapshotStats } from './history-utils'

interface ResumeVersion {
  id: string
  name: string | null
  snapshot: Prisma.JsonValue
  createdAt: Date | string
}

export interface HistoryListPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface HistoryListProps {
  versions: ResumeVersion[]
  pagination: HistoryListPagination
  /** Base path for page links (default: /resumes/history) */
  basePath?: string
}

export function HistoryList({
  versions,
  pagination,
  basePath = '/resumes/history',
}: HistoryListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRestore = async (id: string) => {
    if (!confirm('Are you sure? This will overwrite your current profile data.')) return

    setLoadingId(id)
    setError(null)
    try {
      const res = await restoreResumeVersion(id)
      if (res.success) {
        // Soft success feedback without blocking multi-step restore UX
        alert('Profile restored successfully!')
      } else {
        setError(res.error || 'Failed to restore.')
      }
    } catch {
      setError('Failed to restore. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  if (pagination.total === 0 || versions.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <p style={{ color: 'var(--muted-foreground)' }}>No versions saved yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted-foreground)' }}>
        <p>
          Showing {(pagination.page - 1) * pagination.limit + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} versions
        </p>
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--destructive)' }} role="alert">
          {error}
        </p>
      )}

      <ul className="space-y-4" aria-label="Resume version history">
        {versions.map((v) => {
          const { expCount, projCount, skillCount } = getSnapshotStats(v.snapshot)
          const createdLabel =
            typeof v.createdAt === 'string'
              ? new Date(v.createdAt).toLocaleString()
              : v.createdAt.toLocaleString()

          return (
            <li
              key={v.id}
              className="p-6 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>{v.name || 'Untitled Version'}</h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Saved on {createdLabel}</p>
                <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Stats: {expCount} Exp, {projCount} Proj, {skillCount} Skills
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRestore(v.id)}
                disabled={loadingId === v.id}
                className="px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 disabled:opacity-50 self-start sm:self-auto"
                style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
              >
                {loadingId === v.id ? 'Restoring...' : 'Restore'}
              </button>
            </li>
          )
        })}
      </ul>

      {pagination.totalPages > 1 && (
        <nav
          className="flex items-center justify-between pt-4 border-t"
          style={{ borderColor: 'var(--border)' }}
          aria-label="History pagination"
        >
          {pagination.hasPrevPage ? (
            <Link
              href={buildHistoryPageHref(basePath, pagination.page - 1, pagination.limit)}
              className="px-4 py-2 text-sm font-medium border rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--foreground-secondary)', borderColor: 'var(--border)', background: 'var(--card)' }}
              rel="prev"
            >
              Previous
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm border rounded-lg cursor-not-allowed" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)', opacity: 0.5 }}>
              Previous
            </span>
          )}

          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          {pagination.hasNextPage ? (
            <Link
              href={buildHistoryPageHref(basePath, pagination.page + 1, pagination.limit)}
              className="px-4 py-2 text-sm font-medium border rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--foreground-secondary)', borderColor: 'var(--border)', background: 'var(--card)' }}
              rel="next"
            >
              Next
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm border rounded-lg cursor-not-allowed" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)', opacity: 0.5 }}>
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
