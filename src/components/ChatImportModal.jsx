import { useState } from 'react'
import { X, MessageSquare, Zap, Check, AlertTriangle, ChevronRight, Info, CalendarCheck } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { format, addDays, parseISO } from 'date-fns'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, SHIFT_STYLES } from '../utils/constants'
import { fillEmptySlots } from '../utils/rosterEngine'

const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function ChatImportModal({ onClose }) {
  const { employees, weekStart, numDays, mergeAssignments, setAssignments, updateEmployee } = useRosterStore()
  const [text, setText]       = useState('')
  const [parsing, setParsing] = useState(false)
  const [result, setResult]   = useState(null)
  const [applied, setApplied] = useState(false)

  const weekStartDate = parseISO(weekStart)

  // Build day-number → index map for this week  e.g. "3" → 2 (if week starts Jun 1)
  const dayNumToIndex = {}
  for (let i = 0; i < numDays; i++) {
    const n = format(addDays(weekStartDate, i), 'd')  // "1","2",..."31"
    dayNumToIndex[n] = i
  }

  function resolveDay(raw) {
    const n = String(raw).replace(/\D/g, '')
    return dayNumToIndex[n] ?? null
  }

  /* ─── Smart Regex Parser ─────────────────────────────────────────────── */
  function parseWithRegex() {
    if (!text.trim()) return
    const { entries, warnings } = extractEntries(text, employees)
    const processed = buildResult(entries, employees, resolveDay, weekStartDate, numDays)
    setResult({ ...processed, warnings: [...warnings, ...processed.warnings] })
    setParsing(false)
  }


  /* ─── Apply (specific assignments only) ─────────────────────────────── */
  function handleApply() {
    if (!result) return
    applyConstraints()
    const idAssignments = buildIdAssignments()
    mergeAssignments(idAssignments)
    setApplied(true)
    toast.success('Chat assignments applied to roster!')
  }

  /* ─── Apply + fill all remaining slots ──────────────────────────────── */
  function handleApplyAndFill() {
    if (!result) return

    // 1. Compute updated employee constraints in memory (before store write)
    const allShiftKeys = SHIFTS.map(s => s.key)
    const updatedEmployees = employees.map(emp => {
      const upd = { ...emp }
      if (result.unavailable[emp.name]) {
        const allDays = Array.from({ length: numDays }, (_, i) => i)
        upd.days = allDays.filter(d => !result.unavailable[emp.name].includes(d))
      }
      if (result.noShift[emp.name]) {
        const excluded = result.noShift[emp.name]
        const current  = emp.shifts.length ? emp.shifts : allShiftKeys
        upd.shifts = current.filter(s => !excluded.includes(s))
      }
      return upd
    })

    // 2. Merge existing roster + specific chat assignments
    const currentAssignments = useRosterStore.getState().assignments
    const chatIdAssignments  = buildIdAssignments()
    const merged = { ...currentAssignments }
    for (const [key, ids] of Object.entries(chatIdAssignments)) {
      merged[key] = [...new Set([...(merged[key] || []), ...ids])]
    }

    // 3. Fill remaining empty / understaffed slots
    const filled = fillEmptySlots(updatedEmployees, numDays, merged)
    setAssignments(filled)

    // 4. Persist employee constraints to store
    applyConstraints()

    setApplied(true)
    toast.success(`Full roster filled — all employees scheduled!`)
  }

  /* ─── Shared helpers ─────────────────────────────────────────────────── */
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
      const emp = employees.find(e => e.name === name)
      if (!emp) continue
      const allDays = Array.from({ length: numDays }, (_, i) => i)
      updateEmployee(emp.id, { days: allDays.filter(d => !offDays.includes(d)) })
    }
    for (const [name, excluded] of Object.entries(result?.noShift || {})) {
      const emp = employees.find(e => e.name === name)
      if (!emp) continue
      const current = emp.shifts.length ? emp.shifts : allShiftKeys
      updateEmployee(emp.id, { shifts: current.filter(s => !excluded.includes(s)) })
    }
  }

  const totalCells = Object.keys(result?.assignments || {}).length
  const totalOff   = Object.values(result?.unavailable || {}).reduce((s, a) => s + a.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-primary-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <MessageSquare size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary-900">WhatsApp / Chat Import</h2>
              <p className="text-[11px] text-primary-400 font-semibold">
                Paste manager messages → parse shift assignments automatically
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Week reference */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl px-4 py-2.5">
            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1.5">
              Week — Day Number Mapping
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {Array.from({ length: numDays }, (_, i) => {
                const d = addDays(weekStartDate, i)
                return (
                  <span key={i} className="text-[11px] font-semibold text-primary-700">
                    <span className="font-bold text-primary-400">{format(d, 'do')}</span>
                    {' = '}{DAY_SHORT[i]} {format(d, 'MMM d')}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Input hint */}
          <div className="flex items-start gap-2 bg-amber-50 border-2 border-amber-200 rounded-xl px-3 py-2.5">
            <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
              Supported: <code className="bg-amber-100 px-1 rounded">Name - 3rd &amp; 7th shift E</code>
              {' · '}<code className="bg-amber-100 px-1 rounded">Name onsite night shifts on 5th and 6th</code>
              {' · '}<code className="bg-amber-100 px-1 rounded">Name - Need to free 1st and 3rd</code>
              {' · '}<code className="bg-amber-100 px-1 rounded">No Onsite night shifts</code>
            </p>
          </div>

          {/* Text area */}
          <div>
            <label className="label">Paste WhatsApp / Chat Messages</label>
            <textarea
              className="input resize-none font-mono text-xs leading-relaxed"
              rows={8}
              placeholder={"Haribabuji - 3rd & 7th shift E, 5th - shiftD, 6th -shift C\nShihara onsite night shifts on 5th and 6th\nLakshitha - Need to free 1st and 3rd\nRavishka - Need onsite night shift on 4th and free on 7th\nUminda - need to free on 7th, No Onsite night shifts\nOther 6 employees: available for any shift"}
              value={text}
              onChange={e => { setText(e.target.value); setResult(null); setApplied(false) }}
            />
          </div>

          {/* Parse button */}
          <button
            onClick={() => { setParsing(true); setTimeout(parseWithRegex, 50) }}
            disabled={!text.trim() || parsing}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {parsing
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Parsing…</>
              : <><Zap size={14} strokeWidth={2.5} /> Parse Messages</>}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-4">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <StatBox value={totalCells}   label="Cells filled"  color="primary" />
                <StatBox value={totalOff}     label="Days off"      color="cta"     />
                <StatBox value={Object.keys(result.noShift).length} label="Exclusions" color="primary" />
              </div>

              {/* Assignments */}
              {totalCells > 0 && (
                <Section title="Assignments">
                  <div className="rounded-xl border-2 border-primary-100 overflow-hidden divide-y-2 divide-primary-50">
                    {Object.entries(result.assignments)
                      .sort(([a], [b]) => {
                        const [ai, as] = a.split('-'); const [bi, bs] = b.split('-')
                        return Number(ai) - Number(bi) || as.localeCompare(bs)
                      })
                      .map(([key, names]) => {
                        const dash  = key.indexOf('-')
                        const dIdx  = parseInt(key.slice(0, dash))
                        const sKey  = key.slice(dash + 1)
                        const d     = addDays(weekStartDate, dIdx)
                        const sty   = SHIFT_STYLES[sKey] || SHIFT_STYLES['Backup']
                        const sh    = SHIFTS.find(s => s.key === sKey)
                        return (
                          <div key={key} className="flex items-center gap-3 px-3 py-2 bg-white flex-wrap">
                            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md border-2 flex-shrink-0', sty.row, sty.text, sty.border)}>
                              {sh?.label || sKey}
                            </span>
                            <span className="text-xs font-bold text-primary-700 flex-shrink-0 w-20">
                              {DAY_SHORT[dIdx]} {format(d, 'MMM d')}
                            </span>
                            <ChevronRight size={12} className="text-primary-300 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {names.map(n => (
                                <span key={n} className="text-[11px] font-semibold bg-primary-100 text-primary-800 border-2 border-primary-200 px-1.5 py-0.5 rounded-md">
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
                <Section title="Days Off / Unavailable">
                  <div className="space-y-1.5">
                    {Object.entries(result.unavailable).map(([name, days]) => (
                      <div key={name} className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-xl bg-cta-50 border-2 border-cta-100">
                        <span className="text-xs font-bold text-cta-700 w-24 flex-shrink-0">{name}</span>
                        <div className="flex gap-1 flex-wrap">
                          {days.sort().map(d => {
                            const date = addDays(weekStartDate, d)
                            return (
                              <span key={d} className="text-[10px] font-bold bg-cta-500 text-white px-1.5 py-0.5 rounded-md">
                                {DAY_SHORT[d]} {format(date, 'd')}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Shift exclusions */}
              {Object.keys(result.noShift).length > 0 && (
                <Section title="Shift Exclusions">
                  <div className="space-y-1.5">
                    {Object.entries(result.noShift).map(([name, shifts]) => (
                      <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border-2 border-slate-200">
                        <span className="text-xs font-bold text-slate-700 w-24 flex-shrink-0">{name}</span>
                        <span className="text-[11px] text-slate-600 font-semibold">
                          Won't be assigned: {shifts.map(s => `Shift ${s}`).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <div>
                    <p className="text-[11px] font-bold text-amber-800 mb-1">Unmatched / Warnings</p>
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-[11px] text-amber-700 font-semibold">{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {totalCells === 0 && totalOff === 0 && result.warnings.length === 0 && (
                <div className="text-center py-4 text-primary-400 text-xs font-semibold">
                  Nothing parsed — check that employee names match exactly.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t-2 border-primary-100 space-y-2">
          {result && !applied && (
            <>
              {/* Primary: Apply + auto-fill everyone */}
              <button onClick={handleApplyAndFill} className="btn-primary w-full">
                <CalendarCheck size={14} strokeWidth={2.5} />
                Apply &amp; Fill Full Roster
                <span className="text-[10px] opacity-70 font-semibold ml-1">(recommended)</span>
              </button>

              {/* Secondary: only specific assignments */}
              <button onClick={handleApply} className="btn-secondary w-full text-xs">
                <Check size={13} strokeWidth={2.5} />
                Apply Specific Assignments Only
              </button>
            </>
          )}

          {applied && (
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-primary-600 py-2">
              <Check size={16} strokeWidth={3} /> Applied to roster successfully!
            </div>
          )}

          <button onClick={onClose} className="btn-ghost w-full text-xs text-primary-500">
            {applied ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMART REGEX PARSER
   Handles patterns:
     "Name - 3rd & 7th shift E, 5th - shiftD"
     "Name onsite night shifts on 5th and 6th"
     "Name - Need to free 1st and 3rd"
     "Name - free on 7th"
     "Name - No Onsite night shifts"
     "Other N employees: available for any shift"  → skipped
═══════════════════════════════════════════════════════════════════════════ */

function extractEntries(text, employees) {
  // Strip WhatsApp timestamps: [22:07, 31/05/2026] Anju Aiya:
  const clean = text.replace(/\[\d{1,2}:\d{2}[^\]]*\]\s*[^\n:]+:\s*/g, '')

  const lines = clean.split(/\n+/).map(l => l.trim()).filter(Boolean)
  const entries  = []
  const warnings = []

  for (const line of lines) {
    // Skip "Other N employees: available for any shift"
    if (/other\s+\d*\s*employees?\s*[:\-]?\s*available/i.test(line)) continue

    const emp = findEmployee(line, employees)
    if (!emp) {
      if (line.length > 4) warnings.push(`No employee matched in: "${line.slice(0, 60)}"`)
      continue
    }

    // Remove name from line to get body
    const body = line
      .replace(new RegExp('\\b' + escapeRE(emp.name) + '\\b', 'i'), '')
      .replace(/^[\s\-:,]+/, '')
      .trim()

    // ── Rule 1: No onsite night shifts ──
    if (/no\s+onsite\s+night/i.test(body)) {
      entries.push({ person: emp.name, action: 'no_shift', days: null, shift: 'B' })
    }

    // ── Rule 2: Free / unavailable days ──
    // Patterns: "free on 7th", "need to free 1st and 3rd", "free 4th"
    const freeRe = /(?:need\s+to\s+)?free\s+(?:on\s+)?((?:\d{1,2}(?:st|nd|rd|th)?[\s,&]*(?:and\s+)?)+)/gi
    for (const [, dayStr] of body.matchAll(freeRe)) {
      const days = parseDayNums(dayStr)
      if (days.length) entries.push({ person: emp.name, action: 'free', days, shift: null })
    }

    // ── Rule 3: Onsite night shift assignments ──
    // Patterns: "onsite night shifts on 5th and 6th", "Need onsite night shift on 4th"
    const onsiteRe = /(?:need\s+)?onsite\s+night\s+shift[s]?\s+on\s+((?:\d{1,2}(?:st|nd|rd|th)?[\s,&]*(?:and\s+)?)+)/gi
    for (const [, dayStr] of body.matchAll(onsiteRe)) {
      // Stop before any "free" text
      const safeDayStr = dayStr.replace(/\s+(?:and\s+)?free.*/i, '')
      const days = parseDayNums(safeDayStr)
      if (days.length) entries.push({ person: emp.name, action: 'assign', days, shift: 'B' })
    }

    // ── Rule 4: Specific shift assignments ──
    // Split by comma; each segment looks like "3rd & 7th shift E" or "5th - shiftD"
    for (const seg of body.split(',')) {
      const s = seg.trim()
      if (!s) continue
      if (/free|onsite\s+night|no\s+onsite|available/i.test(s)) continue

      // Find shift key: "shift E", "shiftD", "shift-C"
      const shiftMatch = s.match(/\bshift\s*[-]?\s*([A-E]|backup)\b/i)
      if (!shiftMatch) continue

      const shiftKey = shiftMatch[1].toUpperCase() === 'BACKUP' ? 'Backup' : shiftMatch[1].toUpperCase()
      const days = parseDayNums(s)
      if (days.length) entries.push({ person: emp.name, action: 'assign', days, shift: shiftKey })
    }
  }

  return { entries, warnings }
}

/** Convert raw entries into the assignments/unavailable/noShift maps */
function buildResult(entries, employees, resolveDay, weekStartDate, numDays) {
  const assignments = {}
  const unavailable = {}
  const noShift     = {}
  const warnings    = []

  const nameMap = Object.fromEntries(
    employees.map(e => [e.name.toLowerCase().trim(), e.name])
  )

  for (const e of entries) {
    if (!e?.person) continue
    const name = nameMap[e.person.toLowerCase().trim()]
    if (!name) { warnings.push(`Could not match employee: "${e.person}"`); continue }

    if (e.action === 'assign') {
      for (const day of e.days || []) {
        const idx = resolveDay(day)
        if (idx === null) { warnings.push(`Day "${day}" not in current week (${name})`); continue }
        const key = `${idx}-${e.shift}`
        assignments[key] = [...new Set([...(assignments[key] || []), name])]
      }
    } else if (e.action === 'free') {
      for (const day of e.days || []) {
        const idx = resolveDay(day)
        if (idx === null) { warnings.push(`Day "${day}" not in current week (${name})`); continue }
        unavailable[name] = [...new Set([...(unavailable[name] || []), idx])]
      }
    } else if (e.action === 'no_shift') {
      noShift[name] = [...new Set([...(noShift[name] || []), e.shift])]
    }
  }

  return { assignments, unavailable, noShift, warnings }
}

/* ─── Utilities ─────────────────────────────────────────────────────────── */

function findEmployee(line, employees) {
  return [...employees]
    .sort((a, b) => b.name.length - a.name.length)
    .find(e => new RegExp('\\b' + escapeRE(e.name) + '\\b', 'i').test(line)) ?? null
}

function parseDayNums(str) {
  // Extract 1-2 digit numbers (day of month)
  const nums = (str.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/g) || []).map(m => m.replace(/\D/g, ''))
  return [...new Set(nums)]
}

function escapeRE(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  )
}

function StatBox({ value, label, color }) {
  return (
    <div className={clsx('rounded-xl border-2 py-2.5 text-center',
      color === 'cta' ? 'bg-cta-50 border-cta-100' : 'bg-primary-50 border-primary-100')}>
      <p className={clsx('text-xl font-bold', color === 'cta' ? 'text-cta-600' : 'text-primary-700')}>{value}</p>
      <p className={clsx('text-[10px] font-bold uppercase tracking-wide', color === 'cta' ? 'text-cta-400' : 'text-primary-400')}>{label}</p>
    </div>
  )
}
