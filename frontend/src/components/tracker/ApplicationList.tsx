'use client'

import { useMemo, useState, memo } from 'react'
import { deleteApplication, updateApplicationStatus } from "@/app/actions/tracker"
import { sanitizeText, sanitizeUrl } from "@/lib/sanitization"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"

const statusStyles = {
  applied: { background: 'color-mix(in srgb, var(--primary) 14%, transparent)', color: 'var(--primary)' },
  interviewing: { background: 'color-mix(in srgb, var(--accent-orange) 16%, transparent)', color: 'var(--accent-orange)' },
  offer: { background: 'color-mix(in srgb, var(--accent-green) 16%, transparent)', color: 'var(--accent-green)' },
  rejected: { background: 'color-mix(in srgb, var(--destructive) 14%, transparent)', color: 'var(--destructive)' },
} as const

interface Application {
  id: string
  company: string
  position: string
  status: string
  appliedDate: Date
  url?: string | null
  description?: string | null
}

const ApplicationRow = memo(function ApplicationRow({ app }: { app: Application }) {
  const company = sanitizeText(app.company)
  const position = sanitizeText(app.position)
  const description = app.description ? sanitizeText(app.description) : null
  const safeUrl = app.url ? sanitizeUrl(app.url) : null

  return (
    <tr className="table-row-hover transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{company}</div>
        {description && (
          <div className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{description}</div>
        )}
        {safeUrl && (
          <a href={safeUrl} target="_blank" rel="noreferrer" className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>
            View Job
          </a>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--foreground-secondary)' }}>{position}</td>
      <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
        {new Date(app.appliedDate).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          defaultValue={app.status}
          onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
          aria-label={`Status for ${company}`}
          className="text-xs font-semibold px-2.5 py-1 rounded-full border-none cursor-pointer appearance-none"
          style={statusStyles[app.status as keyof typeof statusStyles] || { background: 'var(--muted)', color: 'var(--muted-foreground)' }}
        >
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          type="button"
          onClick={() => deleteApplication(app.id)}
          className="hover:opacity-80 transition-opacity"
          style={{ color: 'var(--destructive)' }}
          aria-label={`Delete application at ${company}`}
        >
          Delete
        </button>
      </td>
    </tr>
  )
})

export function ApplicationList({ applications }: { applications: Application[] }) {
  const [page, setPage] = useState(1)
  const pageSize = DEFAULT_PAGE_SIZE

  const totalPages = Math.max(1, Math.ceil(applications.length / pageSize))
  // Clamp when list shrinks (e.g. after delete) so we never show an empty page
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return applications.slice(start, start + pageSize)
  }, [applications, currentPage, pageSize])

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <p style={{ color: 'var(--muted-foreground)' }}>No applications yet. Start tracking your journey!</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border overflow-hidden overflow-x-auto" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
        <thead style={{ background: 'var(--muted)' }}>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Company</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Position</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Status</th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {pageItems.map((app) => (
            <ApplicationRow key={app.id} app={app} />
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Applications pagination"
        >
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  )
}
