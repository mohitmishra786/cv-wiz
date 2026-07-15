'use client'

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createApplication } from "@/app/actions/tracker"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2.5 min-h-[44px] font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      {pending ? "Adding..." : "Add Application"}
    </button>
  )
}

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"

export function CreateApplicationForm() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 min-h-[44px] font-semibold rounded-xl transition-opacity hover:opacity-90"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        + New Application
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-application-title"
    >
      <div className="rounded-2xl p-6 w-full max-w-md border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 id="create-application-title" className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>
          Add Application
        </h2>
        <form action={async (formData) => {
            await createApplication(null, formData)
            setIsOpen(false)
        }} className="space-y-4">

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground-secondary)' }}>Company</label>
            <input id="company" name="company" required className={inputClass} style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
          </div>

          <div>
            <label htmlFor="position" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground-secondary)' }}>Position</label>
            <input id="position" name="position" required className={inputClass} style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground-secondary)' }}>Status</label>
              <select id="status" name="status" className={inputClass} style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="salary" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground-secondary)' }}>Salary (Optional)</label>
              <input id="salary" name="salary" className={inputClass} style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
            </div>
          </div>

          <div>
             <label htmlFor="url" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground-secondary)' }}>Job URL (Optional)</label>
             <input id="url" name="url" type="url" className={inputClass} style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2.5 min-h-[44px] rounded-xl transition-colors hover:opacity-80"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  )
}
