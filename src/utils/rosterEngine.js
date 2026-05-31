import { SHIFTS, SHIFT_HOURS, MAX_HOURS_PER_WEEK, MIN_HOURS_PER_WEEK } from './constants'

const REQUIRED_STAFF  = (sk) => sk === 'E' ? 2 : 1
const IS_NIGHT        = (sk) => sk === 'B' || sk === 'E'
const SHIFT_MAP       = Object.fromEntries(SHIFTS.map(s => [s.key, s]))

/** Total scheduled hours for one employee from an assignments map. */
export function calcEmployeeHours(employeeId, assignments) {
  let h = 0
  for (const [key, ids] of Object.entries(assignments)) {
    if (!ids.includes(employeeId)) continue
    const sk = key.slice(key.indexOf('-') + 1)
    h += SHIFT_HOURS[sk] ?? 8
  }
  return h
}

/** Total night shifts assigned to one employee from an assignments map. */
export function calcEmployeeNights(employeeId, assignments) {
  let n = 0
  for (const [key, ids] of Object.entries(assignments)) {
    if (!ids.includes(employeeId)) continue
    const sk = key.slice(key.indexOf('-') + 1)
    if (IS_NIGHT(sk)) n++
  }
  return n
}

/**
 * Fill roster slots respecting:
 *  - One shift per day per employee
 *  - Min 32h / max 45h per week  (Shift B = 15h, others = 8h)
 *  - Shift E needs 2 staff, others need 1
 *  - Each employee reaches their nightTarget (default 2)
 *
 * Three passes:
 *   Pass 1  — fill every empty/understaffed slot (nights first so quota is met naturally)
 *   Night   — top up anyone still below nightTarget using available night slots
 *   Pass 2  — top up anyone still below minHours using any available slot
 */
export function fillEmptySlots(
  employees,
  numDays,
  existingAssignments = {},
  maxHours = MAX_HOURS_PER_WEEK,
  minHours = MIN_HOURS_PER_WEEK
) {
  /* ── Setup ───────────────────────────────────────────────────────── */
  const assignments = {}
  for (const [k, ids] of Object.entries(existingAssignments)) {
    if (ids?.length) assignments[k] = [...ids]
  }

  const hours  = Object.fromEntries(employees.map(e => [e.id, 0]))
  const nights = Object.fromEntries(employees.map(e => [e.id, 0]))

  // Populate from existing
  for (const [key, ids] of Object.entries(assignments)) {
    const sk = key.slice(key.indexOf('-') + 1)
    const h  = SHIFT_HOURS[sk] ?? 8
    const isN = IS_NIGHT(sk)
    const d  = parseInt(key.slice(0, key.indexOf('-')))
    for (const id of ids) {
      if (!(id in hours)) continue
      hours[id]  += h
      if (isN) nights[id]++
    }
  }

  // Track who is already working each day (one-shift-per-day rule)
  const workedOnDay = Array.from({ length: numDays }, () => new Set())
  for (const [key, ids] of Object.entries(assignments)) {
    const d = parseInt(key.slice(0, key.indexOf('-')))
    if (d >= 0 && d < numDays) ids.forEach(id => workedOnDay[d].add(id))
  }

  // Night target per employee (nightTarget property, default 2)
  const nightTarget = (emp) => emp.nightTarget ?? 2

  /* ── Shared sort function ────────────────────────────────────────── */
  function sortEligible(eligible, shiftKey) {
    const isN = IS_NIGHT(shiftKey)
    return eligible.sort((a, b) => {
      // 1. For night slots: prefer employees who still need nights (highest deficit first)
      if (isN) {
        const aNeed = Math.max(0, nightTarget(a) - nights[a.id])
        const bNeed = Math.max(0, nightTarget(b) - nights[b.id])
        if (aNeed !== bNeed) return bNeed - aNeed
      }
      // 2. Prefer employees who explicitly prefer this shift
      const aPref = a.shifts.length > 0 && a.shifts.includes(shiftKey)
      const bPref = b.shifts.length > 0 && b.shifts.includes(shiftKey)
      if (aPref !== bPref) return bPref ? 1 : -1
      // 3. Highest hour deficit from minimum
      const aD = Math.max(0, minHours - hours[a.id])
      const bD = Math.max(0, minHours - hours[b.id])
      if (aD !== bD) return bD - aD
      // 4. Fewest hours overall
      return hours[a.id] - hours[b.id]
    })
  }

  /* ── Helper: assign one employee to a cell ───────────────────────── */
  function assign(key, d, shiftKey, emp) {
    const h = SHIFT_HOURS[shiftKey] ?? 8
    assignments[key] = [...(assignments[key] || []), emp.id]
    hours[emp.id]  += h
    if (IS_NIGHT(shiftKey)) nights[emp.id]++
    workedOnDay[d].add(emp.id)
  }

  /* ── Pass 1: fill every empty / understaffed slot ────────────────── */
  // Process nights first so quota is met during the normal fill
  const orderedShifts = [
    ...SHIFTS.filter(s => IS_NIGHT(s.key)),
    ...SHIFTS.filter(s => !IS_NIGHT(s.key)),
  ]

  for (const shift of orderedShifts) {
    for (let d = 0; d < numDays; d++) {
      const key     = `${d}-${shift.key}`
      const current = assignments[key] || []
      const needed  = REQUIRED_STAFF(shift.key) - current.length
      if (needed <= 0) continue

      const alreadyIn = new Set(current)

      const eligible = employees.filter(e => {
        if (alreadyIn.has(e.id))             return false  // already in this cell
        if (workedOnDay[d].has(e.id))        return false  // already working today
        if (IS_NIGHT(shift.key) && nights[e.id] >= nightTarget(e)) return false  // night quota full
        const wantShift = e.shifts.length === 0 || e.shifts.includes(shift.key)
        const wantDay   = e.days.length   === 0 || e.days.includes(d)
        const fitsHours = hours[e.id] + shift.hours <= maxHours
        return wantShift && wantDay && fitsHours
      })

      sortEligible(eligible, shift.key).slice(0, needed).forEach(emp => assign(key, d, shift.key, emp))
    }
  }

  /* ── Night Quota Pass: top up employees below their night target ── */
  for (const emp of employees) {
    const target = nightTarget(emp)
    if (nights[emp.id] >= target) continue

    const nightShifts = SHIFTS.filter(s =>
      IS_NIGHT(s.key) && (emp.shifts.length === 0 || emp.shifts.includes(s.key))
    )

    for (const shift of nightShifts) {
      if (nights[emp.id] >= target) break
      for (let d = 0; d < numDays; d++) {
        if (nights[emp.id] >= target) break
        if (workedOnDay[d].has(emp.id))        continue
        if (!emp.days.includes(d) && emp.days.length > 0) continue
        if (hours[emp.id] + shift.hours > maxHours) continue

        const key     = `${d}-${shift.key}`
        const current = assignments[key] || []
        if (current.includes(emp.id)) continue

        // Allow 1 extra beyond required to satisfy the night quota
        if (current.length >= REQUIRED_STAFF(shift.key) + 1) continue

        assign(key, d, shift.key, emp)
      }
    }
  }

  /* ── Pass 2: top up employees below minimum hours ────────────────── */
  for (const emp of employees) {
    if (hours[emp.id] >= minHours) continue

    for (const shift of SHIFTS) {
      if (hours[emp.id] >= minHours) break
      for (let d = 0; d < numDays; d++) {
        if (hours[emp.id] >= minHours) break
        if (workedOnDay[d].has(emp.id))        continue
        if (hours[emp.id] + shift.hours > maxHours) continue

        const wantShift = emp.shifts.length === 0 || emp.shifts.includes(shift.key)
        const wantDay   = emp.days.length   === 0 || emp.days.includes(d)
        if (!wantShift || !wantDay) continue

        // Don't assign extra nights to employees already at their quota
        if (IS_NIGHT(shift.key) && nights[emp.id] >= nightTarget(emp)) continue

        const key     = `${d}-${shift.key}`
        const current = assignments[key] || []
        if (current.includes(emp.id)) continue
        if (current.length >= REQUIRED_STAFF(shift.key) + 1) continue

        assign(key, d, shift.key, emp)
      }
    }
  }

  return assignments
}

/** Full auto-schedule from scratch. */
export function autoSchedule(employees, numDays, maxHours = MAX_HOURS_PER_WEEK, minHours = MIN_HOURS_PER_WEEK) {
  return fillEmptySlots(employees, numDays, {}, maxHours, minHours)
}

/** Resolve AI name-assignments → employee IDs. */
export function resolveAIAssignments(aiObj, employees) {
  const result = {}
  for (const [key, names] of Object.entries(aiObj)) {
    const ids = names
      .map(n => employees.find(e => e.name.toLowerCase() === String(n).toLowerCase().trim())?.id)
      .filter(Boolean)
    if (ids.length) result[key] = ids
  }
  return result
}

/** Build Ollama prompt for full roster generation. */
export function buildAIPrompt(employees, rules, numDays, weekLabel) {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const empLines = employees.map(e => {
    const shiftStr    = e.shifts.length ? e.shifts.join(', ') : 'Any'
    const dayStr      = e.days.length   ? e.days.map(d => dayNames[d]).join(', ') : 'Any'
    const nightStr    = `nights: ${e.nightTarget ?? 2} required`
    return `- ${e.name} | Shifts: ${shiftStr} | Days: ${dayStr} | ${nightStr}${e.notes ? ' | ' + e.notes : ''}`
  }).join('\n')

  const ruleLines = rules.map(r => `- ${r.text}`).join('\n')
  const dayLabels = dayNames.slice(0, numDays).map((d, i) => `${i}=${d}`).join(', ')

  return `You are a workforce scheduling assistant. Generate an optimal shift roster.

RULES:
${ruleLines}

EMPLOYEES:
${empLines}

WEEK: ${weekLabel} | DAYS: ${numDays} (${dayLabels})
SHIFTS (B=onsite night 15h, all others 8h):
  A=8AM-5PM OnSite-Day(8h)
  B=5PM-8AM OnSite-Night(15h)
  C=5AM-1PM Remote(8h)
  D=1PM-9PM Remote(8h)
  E=9PM-5AM Remote-Night(8h, needs 2 staff)
  Backup=On-call(8h)

CONSTRAINTS: min 32h, max 45h/week. One shift per day. Each employee must do their required number of night shifts (B or E).

Return ONLY this JSON (no markdown):
{
  "assignments": { "0-A": ["Name"], "0-E": ["Name","Name"] },
  "notes": "brief explanation"
}
Keys = "dayIndex-ShiftKey". Use exact employee names.`
}
