// Design system: Flat Design — teal primary, orange CTA, no shadows
// UI/UX Pro Max recommendation for "workforce scheduling roster HR tool"

// Only Shift B (onsite night 5PM-8AM) is 15h. All other shifts are 8h.
export const SHIFT_HOURS = { A: 8, B: 15, C: 8, D: 8, E: 8, Backup: 8 }

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

export const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
export const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// Flat-design shift palette — bold, no-gradient fills
export const SHIFT_STYLES = {
  A: {
    header:   'bg-blue-600 text-white',
    row:      'bg-blue-50',
    border:   'border-blue-200',
    text:     'text-blue-800',
    dot:      'bg-blue-500',
    hover:    'hover:bg-blue-100',
    dotColor: '#3B82F6',
  },
  B: {
    header:   'bg-violet-700 text-white',
    row:      'bg-violet-50',
    border:   'border-violet-200',
    text:     'text-violet-800',
    dot:      'bg-violet-500',
    hover:    'hover:bg-violet-100',
    dotColor: '#7C3AED',
  },
  C: {
    header:   'bg-teal-600 text-white',
    row:      'bg-teal-50',
    border:   'border-teal-200',
    text:     'text-teal-800',
    dot:      'bg-teal-500',
    hover:    'hover:bg-teal-100',
    dotColor: '#0D9488',
  },
  D: {
    header:   'bg-orange-500 text-white',
    row:      'bg-orange-50',
    border:   'border-orange-200',
    text:     'text-orange-800',
    dot:      'bg-orange-500',
    hover:    'hover:bg-orange-100',
    dotColor: '#F97316',
  },
  E: {
    header:   'bg-rose-700 text-white',
    row:      'bg-rose-50',
    border:   'border-rose-200',
    text:     'text-rose-800',
    dot:      'bg-rose-600',
    hover:    'hover:bg-rose-100',
    dotColor: '#E11D48',
  },
  Backup: {
    header:   'bg-slate-600 text-white',
    row:      'bg-slate-50',
    border:   'border-slate-200',
    text:     'text-slate-700',
    dot:      'bg-slate-400',
    hover:    'hover:bg-slate-100',
    dotColor: '#94A3B8',
  },
}

// 12-color flat palette for employees — bold, accessible
export const EMPLOYEE_PALETTE = [
  { bg: 'bg-blue-100',    text: 'text-blue-900',    border: 'border-blue-400',    dot: '#2563EB' },
  { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-400', dot: '#059669' },
  { bg: 'bg-violet-100',  text: 'text-violet-900',  border: 'border-violet-400',  dot: '#7C3AED' },
  { bg: 'bg-orange-100',  text: 'text-orange-900',  border: 'border-orange-400',  dot: '#EA580C' },
  { bg: 'bg-rose-100',    text: 'text-rose-900',    border: 'border-rose-400',    dot: '#E11D48' },
  { bg: 'bg-teal-100',    text: 'text-teal-900',    border: 'border-teal-400',    dot: '#0D9488' },
  { bg: 'bg-amber-100',   text: 'text-amber-900',   border: 'border-amber-400',   dot: '#D97706' },
  { bg: 'bg-cyan-100',    text: 'text-cyan-900',    border: 'border-cyan-400',    dot: '#0891B2' },
  { bg: 'bg-indigo-100',  text: 'text-indigo-900',  border: 'border-indigo-400',  dot: '#4338CA' },
  { bg: 'bg-lime-100',    text: 'text-lime-900',    border: 'border-lime-400',    dot: '#65A30D' },
  { bg: 'bg-pink-100',    text: 'text-pink-900',    border: 'border-pink-400',    dot: '#DB2777' },
  { bg: 'bg-sky-100',     text: 'text-sky-900',     border: 'border-sky-400',     dot: '#0284C7' },
]

export function getEmployeeColor(employeeId, employees) {
  const idx = employees.findIndex(e => e.id === employeeId)
  return EMPLOYEE_PALETTE[(idx >= 0 ? idx : 0) % EMPLOYEE_PALETTE.length]
}

export const RULE_CATEGORIES = [
  { value: 'coverage',       label: 'Coverage'       },
  { value: 'workload',       label: 'Workload'        },
  { value: 'qualifications', label: 'Qualifications'  },
  { value: 'preferences',    label: 'Preferences'     },
  { value: 'general',        label: 'General'         },
]
