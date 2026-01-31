'use client'

import { restoreResumeVersion } from "@/app/actions/resume-history"
import { useState } from "react"

export function HistoryList({ versions }: { versions: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRestore = async (id: string) => {
    if (!confirm("Are you sure? This will overwrite your current profile data.")) return
    
    setLoadingId(id)
    const res = await restoreResumeVersion(id)
    setLoadingId(null)
    
    if (res.success) {
      alert("Profile restored successfully!")
    } else {
      alert("Failed to restore.")
    }
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No versions saved yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {versions.map((v) => (
        <div key={v.id} className="bg-white p-6 rounded-lg shadow border flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">{v.name || "Untitled Version"}</h3>
            <p className="text-sm text-gray-500">
              Saved on {new Date(v.createdAt).toLocaleString()}
            </p>
            <div className="text-xs text-gray-400 mt-1">
              Stats: 
              {(v.snapshot as any)?.experiences?.length || 0} Exp,{" "}
              {(v.snapshot as any)?.projects?.length || 0} Proj,{" "}
              {(v.snapshot as any)?.skills?.length || 0} Skills
            </div>
          </div>
          <button
            onClick={() => handleRestore(v.id)}
            disabled={loadingId === v.id}
            className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded disabled:opacity-50"
          >
            {loadingId === v.id ? "Restoring..." : "Restore"}
          </button>
        </div>
      ))}
    </div>
  )
}
