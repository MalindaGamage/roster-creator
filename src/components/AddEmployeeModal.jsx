import { useState, useEffect } from 'react'
import { X, UserPlus } from 'lucide-react'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, DAYS } from '../utils/constants'

const ALL_DAYS = DAYS.map((d, i) => ({ label: d.slice(0, 3), idx: i }))

const SHIFT_COLORS = {
  A: 'border-blue-400 text-blue-800 bg-blue-100',
  B: 'border-violet-400 text-violet-800 bg-violet-100',
  C: 'border-teal-400 text-teal-800 bg-teal-100',
  D: 'border-orange-400 text-orange-800 bg-orange-100',
  E: 'border-rose-400 text-rose-800 bg-rose-100',
  Backup: 'border-slate-400 text-slate-700 bg-slate-100',
}

export default function AddEmployeeModal({ existing, onClose }) {
  const { addEmployee, updateEmployee } = useRosterStore()

  const [form, setForm] = useState({
    name: '', employeeId: '',
    shifts: [], days: [0, 1, 2, 3, 4], notes: '',
  })

  useEffect(() => { if (existing) setForm(existing) }, [existing])

  function toggleShift(key) {
    setForm(f => ({
      ...f,
      shifts: f.shifts.includes(key)
        ? f.shifts.filter(s => s !== key)
        : [...f.shifts, key],
    }))
  }

  function toggleDay(idx) {
    setForm(f => ({
      ...f,
      days: f.days.includes(idx)
        ? f.days.filter(d => d !== idx)
        : [...f.days, idx],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    existing ? updateEmployee(existing.id, form) : addEmployee(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm">
      <div className="card w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-primary-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <UserPlus size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-bold text-primary-900">
              {existing ? 'Edit Employee' : 'Add Employee'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Name + ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Employee ID</label>
              <input
                className="input"
                placeholder="e.g. EMP-001"
                value={form.employeeId}
                onChange={e => setForm({ ...form, employeeId: e.target.value })}
              />
            </div>
          </div>

          {/* Preferred shifts */}
          <div>
            <label className="label">Preferred Shifts</label>
            <p className="text-[11px] text-primary-400 font-semibold mb-2">
              Leave blank to allow any shift
            </p>
            <div className="flex flex-wrap gap-2">
              {SHIFTS.map(sh => {
                const active = form.shifts.includes(sh.key)
                return (
                  <button
                    key={sh.key}
                    type="button"
                    onClick={() => toggleShift(sh.key)}
                    className={clsx(
                      'px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all duration-150 cursor-pointer',
                      active
                        ? SHIFT_COLORS[sh.key]
                        : 'bg-white border-primary-200 text-primary-500 hover:border-primary-400'
                    )}
                  >
                    {sh.label}
                    <span className="ml-1.5 text-[9px] opacity-70 font-semibold">{sh.time}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Available days */}
          <div>
            <label className="label">Available Days</label>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map(({ label, idx }) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={clsx(
                    'w-10 h-10 rounded-lg border-2 text-xs font-bold transition-all duration-150 cursor-pointer',
                    form.days.includes(idx)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-primary-500 border-primary-200 hover:border-primary-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes / Constraints</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="e.g. Cannot work Saturday nights, prefers morning shifts..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {existing ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function clsx(...classes) {
  return classes.filter(Boolean).join(' ')
}
