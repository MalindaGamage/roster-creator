// ── Shift definitions ────────────────────────────────────────────────────
// B (onsite night) = 15h. All others = 8h.
// Backup = 0 — on-call hours are not counted toward the weekly min/max totals
export const SHIFT_HOURS = { A: 8, B: 15, C: 8, D: 8, E: 8, Backup: 0 }
export const MAX_HOURS_PER_WEEK = 45
export const MIN_HOURS_PER_WEEK = 32

export const SHIFTS = [
  { key: 'A',      label: 'Shift A', time: '8AM – 5PM',  isNight: false, hours: 8,  isOnsite: true  },
  { key: 'B',      label: 'Shift B', time: '5PM – 8AM',  isNight: true,  hours: 15, isOnsite: true  },
  { key: 'C',      label: 'Shift C', time: '5AM – 1PM',  isNight: false, hours: 8,  isOnsite: false },
  { key: 'D',      label: 'Shift D', time: '1PM – 9PM',  isNight: false, hours: 8,  isOnsite: false },
  { key: 'E',      label: 'Shift E', time: '9PM – 5AM',  isNight: true,  hours: 8,  isOnsite: false },
  { key: 'Backup', label: 'Backup',  time: 'On-call',     isNight: false, hours: 8,  isOnsite: false },
]

export function getShiftHours(shiftKey) {
  return SHIFT_HOURS[shiftKey] ?? 8
}

// ── Dark-theme shift colors (muted, no rainbow) ───────────────────────
// Left border bar color per shift
export const SHIFT_BAR_COLOR = {
  A:      '#00D9B5',   // teal accent — primary onsite day
  B:      '#5A7878',   // muted teal-slate — onsite night
  C:      '#6A8060',   // muted sage — remote early
  D:      '#8A7858',   // muted tan — remote afternoon
  E:      '#686858',   // muted khaki — remote night
  Backup: '#484848',   // neutral gray
}

// Row background tint (very subtle, same for all — neutral surface)
export const SHIFT_ROW_BG = '#16181C'

// ── Employee color palette — muted, warm neutrals only ───────────────
// Used as left border accent on chips; no bright/purple/blue colors
export const EMPLOYEE_COLORS = [
  '#00D9B5',   // teal
  '#5A8A6A',   // sage green
  '#8A7A5A',   // warm tan
  '#6A8878',   // slate teal
  '#7A8060',   // olive
  '#8A6A50',   // terra
  '#5A7860',   // forest
  '#786858',   // brown khaki
  '#6A9070',   // muted green
  '#907A60',   // warm camel
  '#607870',   // cool sage
  '#788068',   // moss
]

export function getEmployeeColor(employeeId, employees) {
  const idx = employees.findIndex(e => e.id === employeeId)
  return EMPLOYEE_COLORS[(idx >= 0 ? idx : 0) % EMPLOYEE_COLORS.length]
}

export const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
export const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export const RULE_CATEGORIES = [
  { value: 'coverage',       label: 'Coverage'       },
  { value: 'workload',       label: 'Workload'        },
  { value: 'qualifications', label: 'Qualifications'  },
  { value: 'preferences',    label: 'Preferences'     },
  { value: 'general',        label: 'General'         },
]
