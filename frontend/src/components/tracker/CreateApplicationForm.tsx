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
      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? "Adding..." : "Add Application"}
    </button>
  )
}

export function CreateApplicationForm() {
  const [isOpen, setIsOpen] = useState(false)
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        + New Application
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Application</h2>
        <form action={async (formData) => {
            await createApplication(null, formData)
            setIsOpen(false)
        }} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input name="company" required className="w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <input name="position" required className="w-full border rounded p-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" className="w-full border rounded p-2">
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Salary (Optional)</label>
              <input name="salary" className="w-full border rounded p-2" />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">Job URL (Optional)</label>
             <input name="url" type="url" className="w-full border rounded p-2" />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
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
