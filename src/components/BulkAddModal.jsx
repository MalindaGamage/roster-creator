import { useState } from 'react'
import { X, Users } from 'lucide-react'
import useRosterStore from '../store/rosterStore'

export default function BulkAddModal({ onClose }) {
  const { addEmployee, employees } = useRosterStore()
  const [text, setText] = useState('')

  const existingNames = new Set(employees.map(e => e.name.toLowerCase().trim()))

  const preview = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const toAdd   = preview.filter(n => !existingNames.has(n.toLowerCase()))
  const already = preview.filter(n =>  existingNames.has(n.toLowerCase()))

  function handleAdd() {
    toAdd.forEach(name => addEmployee({ name, shifts: [], days: [0,1,2,3,4,5,6] }))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm">
      <div className="card w-full max-w-sm">

        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-primary-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Users size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-bold text-primary-900">Bulk Add Employees</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label">Paste Names (one per line)</label>
            <textarea
              className="input resize-none font-mono text-sm"
              rows={10}
              placeholder={"Lakshitha\nRavishka\nLahiru\nShanaka\n..."}
              value={text}
              onChange={e => setText(e.target.value)}
              autoFocus
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-1.5">
              {toAdd.length > 0 && (
                <p className="text-xs font-bold text-primary-700">
                  ✓ Will add {toAdd.length}: {toAdd.join(', ')}
                </p>
              )}
              {already.length > 0 && (
                <p className="text-xs font-semibold text-primary-400">
                  Already exists (skipped): {already.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={!toAdd.length}
              className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add {toAdd.length || ''} Employees
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
