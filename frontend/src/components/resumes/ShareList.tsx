'use client'

import { toggleShareLink } from "@/app/actions/sharing"
import { useState } from "react"

export function ShareList({ links }: { links: any[] }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No active share links.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {links.map((link) => (
        <div key={link.id} className="bg-white p-6 rounded-lg shadow border flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                    {link.snapshot ? "Snapshot Link" : "Live Link"}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${link.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {link.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Views: {link.views} | Created: {new Date(link.createdAt).toLocaleDateString()}
            </p>
            <div className="text-sm text-blue-600 mt-1 cursor-pointer hover:underline" onClick={() => window.open(`/p/${link.slug}`, '_blank')}>
                /p/{link.slug}
            </div>
          </div>
          <div className="flex gap-2">
            <button
                onClick={() => copyToClipboard(link.slug)}
                className="text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded border"
            >
                {copied === link.slug ? "Copied!" : "Copy URL"}
            </button>
            <button
                onClick={() => toggleShareLink(link.id, !link.isActive)}
                className={`px-3 py-1.5 rounded border ${link.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
            >
                {link.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
