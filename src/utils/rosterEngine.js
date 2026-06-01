import { SHIFTS, SHIFT_HOURS, MAX_HOURS_PER_WEEK, MIN_HOURS_PER_WEEK } from './constants'

const REQUIRED_STAFF  = (sk) => sk === 'E' ? 2 : 1
const IS_NIGHT        = (sk) => sk === 'B' || sk === 'E'

// Backup is on-call — hours are not counted toward weekly totals
const effectiveHours  = (sk) => sk === 'Backup' ? 0 : (SHIFT_HOURS[sk] ?? 8)

/**
 * Rest period enforcement — prevents exhausting back-to-back scheduling.
 *
 * Rule 1 — No consecutive night shifts:
 *   After Shift B or E, the auto-scheduler will NOT assign another B or E the next day.
 *   (Manually entered consecutive nights from chat import are unaffected — they're
 *    already in existingAssignments, so the scheduler never tries to create them again.)
 *
 * Rule 2 — Minimum rest after Shift B (ends 8AM):
 *   Cannot start A (8AM), C (5AM), D (1PM), or Backup next day.
 *   → Full rest day after Shift B. Only exception would be E (9PM) but Rule 1 blocks it.
 *
 * Rule 3 — Minimum rest after Shift E (ends 5AM):
 *   Cannot start A (8AM — 3h rest) or C (5AM — 0h rest) next day.
 *   D (1PM — 8h rest ✓) and Backup are still allowed.
 */
function violatesRest(employeeId, dayIdx, shiftKey, assignments) {
  if (dayIdx === 0) return false
  const prevDay = dayIdx - 1
  const hadB    = (assignments[`${prevDay}-B`] || []).includes(employeeId)
  const hadE    = (assignments[`${prevDay}-E`] || []).includes(employeeId)

  // Rule 1: no consecutive night shifts (B or E after B or E)
  if ((hadB || hadE) && IS_NIGHT(shiftKey)) return true

  // Rule 2: after Shift B → full rest day (nothing else allowed)
  if (hadB && ['A', 'C', 'D', 'Backup'].includes(shiftKey)) return true

  // Rule 3: after Shift E → no very early starts
  if (hadE && ['A', 'C'].includes(shiftKey)) return true

  return false
}

/** Total scheduled hours for one employee from an assignments map. */
export function calcEmployeeHours(employeeId, assignments) {
  let h = 0
  for (const [key, ids] of Object.entries(assignments)) {
    if (!ids.includes(employeeId)) continue
    const sk = key.slice(key.indexOf('-') + 1)
    h += effectiveHours(sk)   // Backup = 0 (on-call, not counted)
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

  const hours       = Object.fromEntries(employees.map(e => [e.id, 0]))
  const nights      = Object.fromEntries(employees.map(e => [e.id, 0]))
  const backupCount = Object.fromEntries(employees.map(e => [e.id, 0]))  // max 1 Backup/week

  // Populate from existing (Backup hours = 0 — on-call not counted)
  for (const [key, ids] of Object.entries(assignments)) {
    const sk  = key.slice(key.indexOf('-') + 1)
    const h   = effectiveHours(sk)
    const isN = IS_NIGHT(sk)
    for (const id of ids) {
      if (!(id in hours)) continue
      hours[id] += h
      if (isN) nights[id]++
      if (sk === 'Backup') backupCount[id]++
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
    assignments[key] = [...(assignments[key] || []), emp.id]
    hours[emp.id]  += effectiveHours(shiftKey)   // Backup = 0h
    if (IS_NIGHT(shiftKey))  nights[emp.id]++
    if (shiftKey === 'Backup') backupCount[emp.id]++
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

      const eh = effectiveHours(shift.key)

      // Base eligibility
      const eligible = employees.filter(e => {
        if (alreadyIn.has(e.id))                            return false
        if (workedOnDay[d].has(e.id))                       return false
        if (IS_NIGHT(shift.key) && nights[e.id] >= nightTarget(e)) return false
        if (shift.key === 'Backup' && backupCount[e.id] >= 1)      return false
        if (violatesRest(e.id, d, shift.key, assignments))  return false  // rest period
        const wantShift = shift.key === 'Backup'
          ? true
          : (e.shifts.length === 0 || e.shifts.includes(shift.key))
        const wantDay   = e.days.length === 0 || e.days.includes(d)
        return wantShift && wantDay && hours[e.id] + eh <= maxHours
      })

      // For Backup: sort MOST hours first so well-covered employees take on-call duty,
      // freeing under-hours employees' days for real (paid) shifts
      let sorted
      if (shift.key === 'Backup') {
        sorted = eligible.slice().sort((a, b) => hours[b.id] - hours[a.id])
      } else {
        sorted = sortEligible(eligible, shift.key)
      }

      const primary = sorted.slice(0, needed)
      primary.forEach(emp => assign(key, d, shift.key, emp))

      // ── Shift E coverage guarantee ─────────────────────────────────
      // If Shift E still needs more employees after the primary fill
      // (quota-complete employees used up the pool), supplement from
      // employees who have finished their night quota but are still eligible.
      const stillNeeded = REQUIRED_STAFF(shift.key) - (assignments[key] || []).length
      if (shift.key === 'E' && stillNeeded > 0) {
        const assigned = new Set(assignments[key] || [])
        const supplement = employees.filter(e => {
          if (assigned.has(e.id))                           return false
          if (workedOnDay[d].has(e.id))                     return false
          if (violatesRest(e.id, d, 'E', assignments))      return false
          const wantShift = e.shifts.length === 0 || e.shifts.includes('E')
          const wantDay   = e.days.length   === 0 || e.days.includes(d)
          return wantShift && wantDay && hours[e.id] + eh <= maxHours
        })
        // Sort: fewest extra nights first (least disruption to targets)
        supplement.sort((a, b) => nights[a.id] - nights[b.id] || hours[a.id] - hours[b.id])
        supplement.slice(0, stillNeeded).forEach(emp => assign(key, d, 'E', emp))
      }
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
        if (hours[emp.id] + effectiveHours(shift.key) > maxHours) continue
        if (violatesRest(emp.id, d, shift.key, assignments)) continue  // rest period

        const key     = `${d}-${shift.key}`
        const current = assignments[key] || []
        if (current.includes(emp.id)) continue

        if (current.length >= REQUIRED_STAFF(shift.key)) continue

        assign(key, d, shift.key, emp)
      }
    }
  }

  /* ── Pass 2: top up employees below minimum hours ────────────────── */
  for (const emp of employees) {
    if (hours[emp.id] >= minHours) continue

    for (const shift of SHIFTS) {
      if (hours[emp.id] >= minHours) break
      // Skip Backup — it contributes 0h and would waste a day slot
      if (shift.key === 'Backup') continue
      // Skip extra nights beyond quota
      if (IS_NIGHT(shift.key) && nights[emp.id] >= nightTarget(emp)) continue

      for (let d = 0; d < numDays; d++) {
        if (hours[emp.id] >= minHours) break
        if (workedOnDay[d].has(emp.id)) continue

        const eh = effectiveHours(shift.key)
        if (eh === 0) continue
        if (hours[emp.id] + eh > maxHours) continue
        if (violatesRest(emp.id, d, shift.key, assignments)) continue  // rest period

        const wantShift = shift.key === 'Backup'
          ? true
          : (emp.shifts.length === 0 || emp.shifts.includes(shift.key))
        const wantDay   = emp.days.length === 0 || emp.days.includes(d)
        if (!wantShift || !wantDay) continue

        const key     = `${d}-${shift.key}`
        const current = assignments[key] || []
        if (current.includes(emp.id)) continue
        if (current.length >= REQUIRED_STAFF(shift.key)) continue

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
