/**
 * Apply known employee preferences and register default rules.
 * Called once when employees are first loaded into the app.
 *
 * Night shift rules:
 *   Default   → 2 night shifts/week (Shift B or E)
 *   Uminda    → 2 nights but E-only (no onsite night Shift B)
 *   Lahiru    → 1 night shift only (Shift E only, no Shift B)
 */
export function applyKnownPreferences(store) {
  const { employees, updateEmployeeByName, rules, addRule } = store.getState()
  if (!employees.length) return

  /* ── Employee-specific shift preferences ─────────────────────────── */

  // Yashodara: primarily Shift C (remote early morning)
  updateEmployeeByName('Yashodara', { shifts: ['C'] })
  updateEmployeeByName('Yasodara',  { shifts: ['C'] })  // alternate spelling

  // Lahiru: Shift A for day shifts + exactly 1 Shift E night (no onsite night B)
  updateEmployeeByName('Lahiru', { shifts: ['A', 'E'], nightTarget: 1 })

  // Uminda: no onsite night (Shift B excluded); 2 remote nights (Shift E)
  // Her shifts exclude B — ensure nightTarget is still 2 (default)
  const uminda = employees.find(e => e.name.toLowerCase() === 'uminda')
  if (uminda) {
    const allShifts = ['A', 'C', 'D', 'E', 'Backup']  // B excluded
    const current   = uminda.shifts.length ? uminda.shifts.filter(s => s !== 'B') : allShifts
    updateEmployeeByName('Uminda', { shifts: current, nightTarget: 2 })
  }

  /* ── Register rules (skip duplicates) ───────────────────────────── */
  const existing = rules.map(r => r.text.toLowerCase())

  const newRules = [
    {
      text: 'Shift E (Remote Night 9PM-5AM) requires exactly 2 employees per slot for adequate coverage. All other shifts (A, B, C, D, Backup) require 1 employee per slot.',
      category: 'coverage',
    },
    {
      text: 'Every employee must work minimum 32 hours and maximum 45 hours per week. Shift B (onsite night) = 15h, all other shifts = 8h',
      category: 'workload',
    },
    {
      text: 'No employee can be assigned more than one shift per day',
      category: 'workload',
    },
    {
      text: 'No consecutive night shifts: the auto-scheduler will never assign Shift B or E on back-to-back days for the same employee. After Shift B (ends 8AM), employee gets a full rest day. After Shift E (ends 5AM), employee cannot work Shift A (8AM) or C (5AM) next day but can work Shift D (1PM). Employee-requested consecutive nights via chat import are honoured as exceptions.',
      category: 'workload',
    },
    {
      text: 'Every employee must do exactly 2 night shifts per week (Shift B or Shift E). Shift B = onsite night 5PM-8AM, Shift E = remote night 9PM-5AM',
      category: 'workload',
    },
    {
      text: 'Uminda must not be assigned Shift B (onsite night). Uminda should do 2 Shift E (remote night) shifts per week',
      category: 'preferences',
    },
    {
      text: 'Lahiru must have exactly 1 Shift E (remote night) per week and no Shift B (onsite night). Remaining shifts should be Shift A (onsite day)',
      category: 'preferences',
    },
    {
      text: 'Yashodara should be assigned primarily to Shift C (remote early 5AM-1PM)',
      category: 'preferences',
    },
  ]

  for (const rule of newRules) {
    const key = rule.text.slice(0, 35).toLowerCase()
    if (!existing.some(e => e.includes(key))) {
      addRule(rule.text, rule.category)
    }
  }
}
