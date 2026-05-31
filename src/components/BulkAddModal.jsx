import { useState } from 'react'
import { X, List } from 'lucide-react'
import useRosterStore from '../store/rosterStore'

const MODAL_STYLE = {
  background: '#16181C', border: '0.5px solid #2A2D33', borderRadius: 12,
}

export default function BulkAddModal({ onClose }) {
  const { addEmployee, employees } = useRosterStore()
  const [text, setText] = useState('')

  const existing = new Set(employees.map(e => e.name.toLowerCase().trim()))
  const preview  = text.split('\n').map(l => l.trim()).filter(Boolean)
  const toAdd    = preview.filter(n => !existing.has(n.toLowerCase()))
  const already  = preview.filter(n =>  existing.has(n.toLowerCase()))

  function handleAdd() {
    toAdd.forEach(name => addEmployee({ name, shifts: [], days: [0,1,2,3,4,5,6], nightTarget: 2 }))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm shadow-modal" style={MODAL_STYLE}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '0.5px solid #2A2D33' }}>
          <div className="flex items-center gap-2">
            <List size={15} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <span className="text-sm font-medium" style={{ color: '#F0EEE9' }}>Bulk Add Employees</span>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} strokeWidth={1.5} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label">Names — one per line</label>
            <textarea
              className="input resize-none font-mono text-xs"
              rows={10}
              placeholder={"Lakshitha\nRavishka\nLahiru\n…"}
              value={text}
              onChange={e => setText(e.target.value)}
              autoFocus
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-1">
              {toAdd.length > 0 && (
                <p className="text-xs font-medium" style={{ color: '#00D9B5' }}>
                  + {toAdd.length} will be added: {toAdd.join(', ')}
                </p>
              )}
              {already.length > 0 && (
                <p className="text-xs" style={{ color: '#5A5D65' }}>
                  Already exists (skipped): {already.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="btn flex-1 justify-center">Cancel</button>
            <button onClick={handleAdd} disabled={!toAdd.length}
              className="btn-primary flex-1 justify-center disabled:opacity-40">
              Add {toAdd.length || ''} Employees
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
