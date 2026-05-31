import { useState, useEffect } from 'react'
import { X, UserPlus } from 'lucide-react'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, DAYS } from '../utils/constants'

const ALL_DAYS = DAYS.map((d, i) => ({ label: d.slice(0, 3), idx: i }))

const MODAL_STYLE = {
  background: '#16181C',
  border: '0.5px solid #2A2D33',
  borderRadius: 12,
}

export default function AddEmployeeModal({ existing, onClose }) {
  const { addEmployee, updateEmployee } = useRosterStore()
  const [form, setForm] = useState({
    name: '', employeeId: '', shifts: [], days: [0,1,2,3,4,5,6], nightTarget: 2, notes: '',
  })
  useEffect(() => { if (existing) setForm(existing) }, [existing])

  const toggleShift = key => setForm(f => ({
    ...f, shifts: f.shifts.includes(key) ? f.shifts.filter(s => s !== key) : [...f.shifts, key],
  }))
  const toggleDay = idx => setForm(f => ({
    ...f, days: f.days.includes(idx) ? f.days.filter(d => d !== idx) : [...f.days, idx],
  }))
  const handleSubmit = e => {
    e.preventDefault()
    if (!form.name.trim()) return
    existing ? updateEmployee(existing.id, form) : addEmployee(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md shadow-modal" style={MODAL_STYLE}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '0.5px solid #2A2D33' }}>
          <div className="flex items-center gap-2">
            <UserPlus size={15} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <span className="text-sm font-medium" style={{ color: '#F0EEE9' }}>
              {existing ? 'Edit Employee' : 'Add Employee'}
            </span>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} strokeWidth={1.5} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Name + ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Jane Smith" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Employee ID</label>
              <input className="input" placeholder="EMP-001" value={form.employeeId}
                onChange={e => setForm({ ...form, employeeId: e.target.value })} />
            </div>
          </div>

          {/* Preferred shifts */}
          <div>
            <label className="label">Preferred Shifts</label>
            <p className="text-xs mb-2" style={{ color: '#5A5D65' }}>Leave empty to allow any shift</p>
            <div className="flex flex-wrap gap-1.5">
              {SHIFTS.map(sh => {
                const active = form.shifts.includes(sh.key)
                return (
                  <button key={sh.key} type="button" onClick={() => toggleShift(sh.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: active ? '#00D9B5' : '#1C1E22',
                      color:      active ? '#0E0F11' : '#8A8D95',
                      border: `0.5px solid ${active ? '#00D9B5' : '#3A3D45'}`,
                    }}
                  >
                    {sh.label}
                    <span className="ml-1 opacity-60 text-2xs">{sh.time}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Available days */}
          <div>
            <label className="label">Available Days</label>
            <div className="flex gap-1.5">
              {ALL_DAYS.map(({ label, idx }) => {
                const active = form.days.includes(idx)
                return (
                  <button key={idx} type="button" onClick={() => toggleDay(idx)}
                    className="w-9 h-9 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: active ? '#00D9B5' : '#1C1E22',
                      color:      active ? '#0E0F11' : '#8A8D95',
                      border: `0.5px solid ${active ? '#00D9B5' : '#3A3D45'}`,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Night target */}
          <div>
            <label className="label">Night Shifts per Week</label>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(n => (
                <button key={n} type="button" onClick={() => setForm({ ...form, nightTarget: n })}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{
                    background: form.nightTarget === n ? '#00D9B5' : '#1C1E22',
                    color:      form.nightTarget === n ? '#0E0F11' : '#8A8D95',
                    border: `0.5px solid ${form.nightTarget === n ? '#00D9B5' : '#3A3D45'}`,
                  }}
                >
                  {n} night{n !== 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none text-xs" rows={2}
              placeholder="Constraints or notes…"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              {existing ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
