import { useDroppable } from '@dnd-kit/core'
import { format, addDays, parseISO } from 'date-fns'
import { X, Moon, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, DAYS_SHORT, SHIFT_STYLES, getEmployeeColor } from '../utils/constants'

export default function RosterGrid() {
  const { weekStart, numDays, employees } = useRosterStore()
  const start = parseISO(weekStart)

  const days = Array.from({ length: numDays }, (_, i) => ({
    idx:  i,
    date: addDays(start, i),
  }))

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="overflow-x-auto flex-1">
      <div style={{ minWidth: `${180 + numDays * 130}px` }}>

        {/* ── Day header ─────────────────────────────────────────────── */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `180px repeat(${numDays}, 1fr)` }}
        >
          {/* Corner */}
          <div className="bg-primary-900 rounded-tl-xl px-4 py-3 flex items-end pb-3">
            <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest">
              Shift
            </span>
          </div>

          {days.map(({ idx, date }) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const isToday = dateStr === today
            return (
              <div
                key={idx}
                className={clsx(
                  'py-3 text-center border-l-2 border-primary-700',
                  isToday ? 'bg-cta-500' : 'bg-primary-900',
                  idx === numDays - 1 && 'rounded-tr-xl'
                )}
              >
                <p className={clsx(
                  'text-[10px] font-bold uppercase tracking-widest',
                  isToday ? 'text-white' : 'text-primary-400'
                )}>
                  {DAYS_SHORT[idx]}
                </p>
                <p className={clsx(
                  'text-xl font-bold mt-0.5',
                  isToday ? 'text-white' : 'text-white'
                )}>
                  {format(date, 'd')}
                </p>
                <p className={clsx(
                  'text-[10px] font-semibold',
                  isToday ? 'text-orange-100' : 'text-primary-500'
                )}>
                  {format(date, 'MMM')}
                </p>
              </div>
            )
          })}
        </div>

        {/* ── Shift rows ─────────────────────────────────────────────── */}
        <div className="border-2 border-t-0 border-primary-200 rounded-b-xl overflow-hidden divide-y-2 divide-primary-100">
          {SHIFTS.map((shift, i) => (
            <ShiftRow
              key={shift.key}
              shift={shift}
              days={days}
              isLast={i === SHIFTS.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function ShiftRow({ shift, days }) {
  const styles = SHIFT_STYLES[shift.key]
  const { employees } = useRosterStore()

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `180px repeat(${days.length}, 1fr)` }}
    >
      {/* Shift label column */}
      <div className={clsx('flex flex-col justify-center gap-1 px-4 py-4 border-r-2', styles.row, styles.border)}>
        <div className="flex items-center gap-2">
          <span className={clsx('w-2.5 h-2.5 rounded-sm flex-shrink-0', styles.dot)} />
          <span className={clsx('text-sm font-bold', styles.text)}>{shift.label}</span>
          {shift.isNight && (
            <Moon size={11} className="text-primary-400" strokeWidth={2} />
          )}
        </div>
        <span className="text-[11px] text-primary-500 font-semibold pl-4">{shift.time}</span>
      </div>

      {/* Day cells */}
      {days.map(({ idx }) => (
        <RosterCell
          key={idx}
          dayIdx={idx}
          shiftKey={shift.key}
          employees={employees}
          styles={styles}
          isLast={idx === days.length - 1}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function RosterCell({ dayIdx, shiftKey, employees, styles, isLast }) {
  const { getCellIds, unassignEmployee } = useRosterStore()
  const assignedIds = getCellIds(dayIdx, shiftKey)

  const { isOver, setNodeRef } = useDroppable({
    id:   `cell-${dayIdx}-${shiftKey}`,
    data: { dayIdx, shiftKey },
  })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'min-h-[80px] p-2 transition-colors duration-150 ease-out',
        'border-l-2',
        styles.row,
        styles.border,
        isOver
          ? 'bg-primary-100 border-primary-500 ring-2 ring-inset ring-primary-400'
          : styles.hover,
        isLast && ''
      )}
    >
      {/* Drop hint */}
      {isOver && assignedIds.length === 0 && (
        <div className="flex items-center gap-1.5 text-primary-600 text-xs font-semibold h-full justify-center">
          <span className="w-4 h-4 rounded-full border-2 border-dashed border-primary-400 flex items-center justify-center">+</span>
          Drop here
        </div>
      )}

      {/* Assigned employee chips */}
      <div className="flex flex-wrap gap-1">
        {assignedIds.map((empId) => (
          <EmployeeChip
            key={empId}
            empId={empId}
            employees={employees}
            onRemove={() => unassignEmployee(dayIdx, shiftKey, empId)}
          />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function EmployeeChip({ empId, employees, onRemove }) {
  const emp = employees.find(e => e.id === empId)
  if (!emp) return (
    <span className="badge bg-red-50 text-red-600 border-red-300 text-[10px]">
      <AlertCircle size={9} /> Unknown
    </span>
  )

  const color = getEmployeeColor(empId, employees)

  return (
    <span className={clsx('badge group cursor-default', color.bg, color.text, color.border)}>
      <span
        className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
        style={{ backgroundColor: color.dot }}
      />
      <span className="max-w-[88px] truncate text-[11px] font-semibold">{emp.name}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-red-600 cursor-pointer"
        aria-label={`Remove ${emp.name}`}
      >
        <X size={10} strokeWidth={3} />
      </button>
    </span>
  )
}
