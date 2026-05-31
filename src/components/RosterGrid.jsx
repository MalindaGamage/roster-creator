import { useDroppable } from '@dnd-kit/core'
import { format, addDays, parseISO } from 'date-fns'
import { X, Moon } from 'lucide-react'
import clsx from 'clsx'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, DAYS_SHORT, SHIFT_BAR_COLOR, getEmployeeColor } from '../utils/constants'

export default function RosterGrid() {
  const { weekStart, numDays, employees } = useRosterStore()
  const start = parseISO(weekStart)
  const days  = Array.from({ length: numDays }, (_, i) => ({
    idx: i, date: addDays(start, i),
  }))
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: numDays * 130 + 160 }}>

        {/* Day header */}
        <div
          className="grid mb-0.5"
          style={{ gridTemplateColumns: `160px repeat(${numDays}, 1fr)` }}
        >
          <div
            className="px-4 py-2.5 text-xs font-medium uppercase tracking-label flex items-end"
            style={{ color: '#5A5D65' }}
          >
            Shift
          </div>
          {days.map(({ idx, date }) => {
            const ds      = format(date, 'yyyy-MM-dd')
            const isToday = ds === today
            return (
              <div
                key={idx}
                className="text-center py-2.5"
                style={{ borderBottom: `0.5px solid ${isToday ? '#00D9B5' : '#2A2D33'}` }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-label"
                  style={{ color: isToday ? '#00D9B5' : '#5A5D65' }}
                >
                  {DAYS_SHORT[idx]}
                </p>
                <p
                  className="text-base font-semibold mt-0.5"
                  style={{ color: isToday ? '#F0EEE9' : '#8A8D95' }}
                >
                  {format(date, 'd')}
                </p>
              </div>
            )
          })}
        </div>

        {/* Shift rows */}
        <div className="space-y-0.5">
          {SHIFTS.map(shift => (
            <ShiftRow key={shift.key} shift={shift} days={days} employees={employees} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ShiftRow({ shift, days, employees }) {
  const barColor = SHIFT_BAR_COLOR[shift.key]

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `160px repeat(${days.length}, 1fr)`,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#16181C',
        border: '0.5px solid #2A2D33',
      }}
    >
      {/* Shift label with left colored bar */}
      <div
        className="flex flex-col justify-center px-4 py-3 gap-0.5"
        style={{ borderLeft: `2px solid ${barColor}`, borderRight: '0.5px solid #2A2D33' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium" style={{ color: '#F0EEE9' }}>
            {shift.label}
          </span>
          {shift.isNight && (
            <Moon size={11} strokeWidth={1.5} style={{ color: '#5A5D65' }} />
          )}
          {shift.isOnsite && (
            <span
              className="text-2xs font-medium px-1 rounded"
              style={{ background: '#1C1E22', color: barColor, border: `0.5px solid ${barColor}30` }}
            >
              onsite
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: '#5A5D65' }}>{shift.time}</span>
        <span className="text-2xs font-medium" style={{ color: barColor }}>
          {shift.hours}h
        </span>
      </div>

      {/* Day cells */}
      {days.map(({ idx }) => (
        <RosterCell
          key={idx}
          dayIdx={idx}
          shiftKey={shift.key}
          employees={employees}
          isLastCol={idx === days.length - 1}
        />
      ))}
    </div>
  )
}

function RosterCell({ dayIdx, shiftKey, employees, isLastCol }) {
  const { getCellIds, unassignEmployee } = useRosterStore()
  const assignedIds = getCellIds(dayIdx, shiftKey)

  const { isOver, setNodeRef } = useDroppable({
    id:   `cell-${dayIdx}-${shiftKey}`,
    data: { dayIdx, shiftKey },
  })

  return (
    <div
      ref={setNodeRef}
      className={clsx('min-h-[72px] p-2 transition-all duration-150', isOver && 'drop-active')}
      style={{
        borderLeft: '0.5px solid #2A2D33',
        borderRight: isLastCol ? 'none' : '0.5px solid #2A2D3310',
      }}
    >
      {isOver && assignedIds.length === 0 && (
        <div
          className="flex items-center justify-center h-full text-xs font-medium"
          style={{ color: '#00D9B5' }}
        >
          Drop here
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {assignedIds.map(empId => (
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

function EmployeeChip({ empId, employees, onRemove }) {
  const emp   = employees.find(e => e.id === empId)
  if (!emp) return null
  const color = getEmployeeColor(empId, employees)

  return (
    <span
      className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium cursor-default transition-all duration-150"
      style={{
        background: '#26292F',
        color: '#F0EEE9',
        borderLeft: `2px solid ${color}`,
        border: '0.5px solid #3A3D45',
        borderLeftWidth: 2,
        borderLeftColor: color,
      }}
    >
      <span className="max-w-[80px] truncate">{emp.name}</span>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-red-400"
        style={{ color: '#5A5D65' }}
        aria-label="Remove"
      >
        <X size={9} strokeWidth={2.5} />
      </button>
    </span>
  )
}
