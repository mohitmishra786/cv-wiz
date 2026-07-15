'use client'

import { toggleShareLink } from "@/app/actions/sharing"
import { useState } from "react"

import { Prisma } from "@prisma/client"

interface ShareLink {
  id: string
  slug: string
  snapshot: Prisma.JsonValue
  isActive: boolean
  views: number
  createdAt: Date
}

export function ShareList({ links }: { links: ShareLink[] }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/share/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <p style={{ color: 'var(--muted-foreground)' }}>No active share links.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {links.map((link) => (
        <div
          key={link.id}
          className="p-6 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                    {link.snapshot ? "Snapshot Link" : "Live Link"}
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={
                    link.isActive
                      ? { background: 'color-mix(in srgb, var(--accent-green) 16%, transparent)', color: 'var(--accent-green)' }
                      : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
                  }
                >
                    {link.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Views: {link.views} | Created: {new Date(link.createdAt).toLocaleDateString()}
            </p>
            <button
              type="button"
              className="text-sm mt-1 cursor-pointer hover:underline"
              style={{ color: 'var(--primary)' }}
              onClick={() => window.open(`/share/${link.slug}`, '_blank')}
            >
                /share/{link.slug}
            </button>
          </div>
          <div className="flex gap-2">
            <button
                onClick={() => copyToClipboard(link.slug)}
                className="px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground-secondary)' }}
            >
                {copied === link.slug ? "Copied!" : "Copy URL"}
            </button>
            <button
                onClick={() => toggleShareLink(link.id, !link.isActive)}
                className="px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                style={
                  link.isActive
                    ? { borderColor: 'var(--border)', color: 'var(--destructive)' }
                    : { borderColor: 'var(--border)', color: 'var(--accent-green)' }
                }
            >
                {link.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
