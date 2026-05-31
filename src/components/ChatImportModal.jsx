import { useState } from 'react'
import { X, MessageSquare, Zap, Check, AlertTriangle, ChevronRight, CalendarCheck } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { format, addDays, parseISO } from 'date-fns'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, SHIFT_BAR_COLOR } from '../utils/constants'
import { fillEmptySlots } from '../utils/rosterEngine'

const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MS = { background: '#16181C', border: '0.5px solid #2A2D33', borderRadius: 12 }

export default function ChatImportModal({ onClose }) {
  const { employees, weekStart, numDays, mergeAssignments, setAssignments, updateEmployee } = useRosterStore()
  const [text, setText]       = useState('')
  const [parsing, setParsing] = useState(false)
  const [result, setResult]   = useState(null)
  const [applied, setApplied] = useState(false)

  const weekStartDate = parseISO(weekStart)
  const dayNumToIndex = {}
  for (let i = 0; i < numDays; i++) {
    dayNumToIndex[format(addDays(weekStartDate, i), 'd')] = i
  }
  const resolveDay = raw => { const n = String(raw).replace(/\D/g, ''); return dayNumToIndex[n] ?? null }

  function handleParse() {
    if (!text.trim()) return
    setParsing(true)
    setTimeout(() => {
      const { entries, warnings } = extractEntries(text, employees)
      setResult(buildResult(entries, employees, resolveDay))
      setParsing(false)
    }, 50)
  }

  function buildIdAssignments() {
    const out = {}
    for (const [key, names] of Object.entries(result?.assignments || {})) {
      const ids = names.map(n => employees.find(e => e.name === n)?.id).filter(Boolean)
      if (ids.length) out[key] = ids
    }
    return out
  }

  function applyConstraints() {
    const allShiftKeys = SHIFTS.map(s => s.key)
    for (const [name, offDays] of Object.entries(result?.unavailable || {})) {
      const emp = employees.find(e => e.name === name); if (!emp) continue
      const allDays = Array.from({ length: numDays }, (_, i) => i)
      updateEmployee(emp.id, { days: allDays.filter(d => !offDays.includes(d)) })
    }
    for (const [name, excluded] of Object.entries(result?.noShift || {})) {
      const emp = employees.find(e => e.name === name); if (!emp) continue
      const current = emp.shifts.length ? emp.shifts : allShiftKeys
      updateEmployee(emp.id, { shifts: current.filter(s => !excluded.includes(s)) })
    }
  }

  function handleApply() {
    applyConstraints(); mergeAssignments(buildIdAssignments())
    setApplied(true); toast.success('Assignments applied')
  }

  function handleApplyAndFill() {
    const allShiftKeys = SHIFTS.map(s => s.key)
    const updatedEmps = employees.map(emp => {
      const u = { ...emp }
      if (result.unavailable[emp.name]) {
        const all = Array.from({ length: numDays }, (_, i) => i)
        u.days = all.filter(d => !result.unavailable[emp.name].includes(d))
      }
      if (result.noShift[emp.name]) {
        const excluded = result.noShift[emp.name]
        const current = emp.shifts.length ? emp.shifts : allShiftKeys
        u.shifts = current.filter(s => !excluded.includes(s))
      }
      return u
    })
    const current = useRosterStore.getState().assignments
    const chatIds = buildIdAssignments()
    const merged = { ...current }
    for (const [k, ids] of Object.entries(chatIds)) merged[k] = [...new Set([...(merged[k] || []), ...ids])]
    setAssignments(fillEmptySlots(updatedEmps, numDays, merged))
    applyConstraints()
    setApplied(true); toast.success('Full roster filled!')
  }

  const totalCells = Object.keys(result?.assignments || {}).length
  const totalOff   = Object.values(result?.unavailable || {}).reduce((s, a) => s + a.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-modal" style={MS}>

        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '0.5px solid #2A2D33' }}>
          <div className="flex items-center gap-2">
            <MessageSquare size={15} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#F0EEE9' }}>WhatsApp / Chat Import</p>
              <p className="text-2xs" style={{ color: '#5A5D65' }}>Paste messages → extract shift assignments</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} strokeWidth={1.5} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Week reference */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs px-3 py-2 rounded-lg" style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}>
            {Array.from({ length: numDays }, (_, i) => {
              const d = addDays(weekStartDate, i)
              return (
                <span key={i} style={{ color: '#8A8D95' }}>
                  <span style={{ color: '#5A5D65' }}>{format(d, 'do')}</span>
                  {' = '}{DAY_SHORT[i]} {format(d, 'MMM d')}
                </span>
              )
            })}
          </div>

          {/* Input */}
          <div>
            <label className="label">Paste Messages</label>
            <textarea
              className="input resize-none font-mono text-xs leading-relaxed"
              rows={8}
              placeholder={"Haribabuji - 3rd & 7th shift E, 5th - shiftD\nShihara onsite night shifts on 5th and 6th\nLakshitha - Need to free 1st and 3rd\nOther 6 employees: available for any shift"}
              value={text}
              onChange={e => { setText(e.target.value); setResult(null); setApplied(false) }}
            />
          </div>

          <button onClick={handleParse} disabled={!text.trim() || parsing} className="btn-primary w-full justify-center disabled:opacity-40">
            {parsing
              ? <><span className="w-3 h-3 border border-void/30 border-t-void rounded-full animate-spin" /> Parsing…</>
              : <><Zap size={14} strokeWidth={1.5} /> Parse Messages</>}
          </button>

          {result && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: totalCells, label: 'Cells filled' },
                  { v: totalOff,   label: 'Days off'     },
                  { v: Object.keys(result.noShift).length, label: 'Exclusions' },
                ].map(({ v, label }) => (
                  <div key={label} className="rounded-lg text-center py-2.5" style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}>
                    <p className="text-base font-semibold" style={{ color: '#00D9B5' }}>{v}</p>
                    <p className="text-2xs uppercase tracking-label" style={{ color: '#5A5D65' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Assignments */}
              {totalCells > 0 && (
                <Section title="Assignments">
                  <div className="rounded-lg overflow-hidden" style={{ border: '0.5px solid #2A2D33' }}>
                    {Object.entries(result.assignments).sort().map(([key, names]) => {
                      const dash = key.indexOf('-'), dIdx = parseInt(key.slice(0, dash)), sKey = key.slice(dash + 1)
                      const d = addDays(weekStartDate, dIdx)
                      const barColor = SHIFT_BAR_COLOR[sKey] || '#5A5D65'
                      const sh = SHIFTS.find(s => s.key === sKey)
                      return (
                        <div key={key} className="flex items-center gap-3 px-3 py-2 flex-wrap"
                          style={{ borderBottom: '0.5px solid #1C1E22' }}>
                          <span className="text-xs font-medium px-2 py-0.5 rounded"
                            style={{ background: '#1C1E22', color: barColor, borderLeft: `2px solid ${barColor}` }}>
                            {sh?.label || sKey}
                          </span>
                          <span className="text-xs" style={{ color: '#8A8D95' }}>
                            {DAY_SHORT[dIdx]} {format(d, 'MMM d')}
                          </span>
                          <ChevronRight size={11} strokeWidth={1.5} style={{ color: '#3A3D45' }} />
                          <div className="flex flex-wrap gap-1">
                            {names.map(n => (
                              <span key={n} className="text-xs px-2 py-0.5 rounded" style={{ background: '#26292F', color: '#F0EEE9', border: '0.5px solid #3A3D45' }}>
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              )}

              {/* Days off */}
              {totalOff > 0 && (
                <Section title="Days Off">
                  <div className="space-y-1">
                    {Object.entries(result.unavailable).map(([name, days]) => (
                      <div key={name} className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg"
                        style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}>
                        <span className="text-xs font-medium w-24 flex-shrink-0" style={{ color: '#F0EEE9' }}>{name}</span>
                        <div className="flex gap-1 flex-wrap">
                          {days.sort().map(d => (
                            <span key={d} className="text-2xs font-medium px-1.5 py-0.5 rounded"
                              style={{ background: '#26292F', color: '#8A8D95', border: '0.5px solid #3A3D45' }}>
                              {DAY_SHORT[d]} {format(addDays(weekStartDate, d), 'd')}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="flex gap-2 rounded-lg p-3" style={{ background: '#1C1E22', border: '0.5px solid #3A2A00' }}>
                  <AlertTriangle size={13} strokeWidth={1.5} style={{ color: '#8A7A40', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-xs" style={{ color: '#8A7A40' }}>{w}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex-shrink-0 space-y-2" style={{ borderTop: '0.5px solid #2A2D33' }}>
          {result && !applied && (
            <>
              <button onClick={handleApplyAndFill} className="btn-primary w-full justify-center">
                <CalendarCheck size={14} strokeWidth={1.5} />
                Apply &amp; Fill Full Roster
              </button>
              <button onClick={handleApply} className="btn w-full justify-center text-xs">
                Apply Specific Assignments Only
              </button>
            </>
          )}
          {applied && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium" style={{ color: '#00D9B5' }}>
              <Check size={15} strokeWidth={2} /> Applied to roster
            </div>
          )}
          <button onClick={onClose} className="btn w-full justify-center text-xs" style={{ color: '#5A5D65' }}>
            {applied ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="label mb-2">{title}</p>
      {children}
    </div>
  )
}

/* ── Regex parser (identical logic, unchanged) ─────────────────────── */
function extractEntries(text, employees) {
  const clean = text.replace(/\[\d{1,2}:\d{2}[^\]]*\]\s*[^\n:]+:\s*/g, '')
  const lines = clean.split(/\n+/).map(l => l.trim()).filter(Boolean)
  const entries = [], warnings = []

  for (const line of lines) {
    if (/other\s+\d*\s*employees?.*available/i.test(line)) continue
    const emp = findEmp(line, employees)
    if (!emp) continue
    const body = line.replace(new RegExp('\\b' + escRE(emp.name) + '\\b', 'i'), '').replace(/^[\s\-:,]+/, '').trim()
    if (/no\s+onsite\s+night/i.test(body)) entries.push({ person: emp.name, action: 'no_shift', days: null, shift: 'B' })
    for (const [, ds] of body.matchAll(/(?:need\s+to\s+)?free\s+(?:on\s+)?((?:\d{1,2}(?:st|nd|rd|th)?[\s,&]*(?:and\s+)?)+)/gi)) {
      const d = parseDays(ds); if (d.length) entries.push({ person: emp.name, action: 'free', days: d, shift: null })
    }
    for (const [, ds] of body.matchAll(/(?:need\s+)?onsite\s+night\s+shift[s]?\s+on\s+((?:\d{1,2}(?:st|nd|rd|th)?[\s,&]*(?:and\s+)?)+)/gi)) {
      const d = parseDays(ds.replace(/\s+(?:and\s+)?free.*/i, '')); if (d.length) entries.push({ person: emp.name, action: 'assign', days: d, shift: 'B' })
    }
    for (const seg of body.split(',')) {
      const s = seg.trim()
      if (/free|onsite\s+night|no\s+onsite|available/i.test(s)) continue
      const sm = s.match(/\bshift\s*[-]?\s*([A-E]|backup)\b/i); if (!sm) continue
      const sk = sm[1].toUpperCase() === 'BACKUP' ? 'Backup' : sm[1].toUpperCase()
      const d = parseDays(s); if (d.length) entries.push({ person: emp.name, action: 'assign', days: d, shift: sk })
    }
  }
  return { entries, warnings }
}

function buildResult(entries, employees, resolveDay) {
  const assignments = {}, unavailable = {}, noShift = {}, warnings = []
  const nm = Object.fromEntries(employees.map(e => [e.name.toLowerCase().trim(), e.name]))
  for (const e of entries) {
    const name = nm[e.person.toLowerCase().trim()]; if (!name) continue
    if (e.action === 'assign') {
      for (const day of e.days || []) {
        const idx = resolveDay(day); if (idx === null) continue
        const key = `${idx}-${e.shift}`; assignments[key] = [...new Set([...(assignments[key] || []), name])]
      }
    } else if (e.action === 'free') {
      for (const day of e.days || []) {
        const idx = resolveDay(day); if (idx === null) continue
        unavailable[name] = [...new Set([...(unavailable[name] || []), idx])]
      }
    } else if (e.action === 'no_shift') {
      noShift[name] = [...new Set([...(noShift[name] || []), e.shift])]
    }
  }
  return { assignments, unavailable, noShift, warnings }
}

const parseDays = str => [...new Set((str.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/g) || []).map(m => m.replace(/\D/g, '')))]
const findEmp  = (line, emps) => [...emps].sort((a,b) => b.name.length - a.name.length).find(e => new RegExp('\\b' + escRE(e.name) + '\\b', 'i').test(line)) ?? null
const escRE    = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
