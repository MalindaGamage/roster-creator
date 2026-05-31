import { useDroppable } from '@dnd-kit/core'
import { format, addDays, parseISO } from 'date-fns'
import { X, Moon } from 'lucide-react'
import clsx from 'clsx'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, DAYS_SHORT, SHIFT_BAR_COLOR, getEmployeeColor } from '../utils/constants'
function requiredStaff(sk) { return sk === 'E' ? 2 : 1 }

export default function RosterGrid({ onCellTap, isMobile, flashCell }) {
  const { weekStart, numDays, employees } = useRosterStore()
  const start  = parseISO(weekStart)
  const today  = format(new Date(), 'yyyy-MM-dd')
  const days   = Array.from({ length: numDays }, (_, i) => ({
    idx: i, date: addDays(start, i),
  }))

  const labelW   = isMobile ? 72 : 160
  const cellMinW = isMobile ? 80 : 120

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: labelW + numDays * cellMinW }}>

        {/* Accent sweep line — animates across on load */}
        <div className="accent-bar mb-1" aria-hidden="true" />

        {/* Day header — fades in */}
        <div className="grid mb-1 anim-fade d-0"
          style={{ gridTemplateColumns: `${labelW}px repeat(${numDays}, 1fr)` }}>
          <div className="px-2 py-2 flex items-end" style={{ color: '#5A5D65', fontSize: 11 }}>
            Shift
          </div>
          {days.map(({ idx, date }) => {
            const isToday = format(date, 'yyyy-MM-dd') === today
            return (
              <div key={idx} className="text-center py-2"
                style={{ borderBottom: `0.5px solid ${isToday ? '#00D9B5' : '#2A2D33'}` }}>
                <p className="font-medium uppercase"
                  style={{ color: isToday ? '#00D9B5' : '#5A5D65', fontSize: 10, letterSpacing: '0.06em' }}>
                  {DAYS_SHORT[idx]}
                </p>
                <p className="font-semibold mt-0.5"
                  style={{ color: isToday ? '#F0EEE9' : '#8A8D95', fontSize: isMobile ? 14 : 16 }}>
                  {format(date, 'd')}
                </p>
              </div>
            )
          })}
        </div>

        {/* Shift rows — staggered rise on load */}
        <div className="space-y-0.5">
          {SHIFTS.map((shift, rowIdx) => (
            <ShiftRow
              key={shift.key}
              shift={shift}
              days={days}
              employees={employees}
              labelW={labelW}
              isMobile={isMobile}
              flashCell={flashCell}
              staggerClass={`anim-rise d-${rowIdx + 1}`}
              onCellTap={onCellTap}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────── */

function ShiftRow({ shift, days, employees, labelW, isMobile, flashCell, staggerClass, onCellTap }) {
  const barColor = SHIFT_BAR_COLOR[shift.key]
  const assignments = useRosterStore(s => s.assignments)

  return (
    <div
      className={clsx('grid', staggerClass)}
      style={{
        gridTemplateColumns: `${labelW}px repeat(${days.length}, 1fr)`,
        borderRadius: 8, overflow: 'hidden',
        background: '#16181C', border: '0.5px solid #2A2D33',
        transition: 'border-color 150ms ease',
      }}
    >
      {/* Shift label */}
      <div
        className="flex flex-col justify-center px-2 py-2 gap-0.5"
        style={{
          borderLeft: `2px solid ${barColor}`,
          borderRight: '0.5px solid #2A2D33',
          transition: 'border-left-color 150ms ease',
        }}
      >
        <div className="flex items-center gap-1">
          <span className="font-medium" style={{ color: '#F0EEE9', fontSize: isMobile ? 11 : 13 }}>
            {isMobile ? shift.key : shift.label}
          </span>
          {shift.isNight && (
            <Moon size={9} strokeWidth={1.5} style={{ color: '#5A5D65' }} aria-hidden="true" />
          )}
          {shift.isOnsite && !isMobile && (
            <span className="text-xs px-1 rounded" style={{
              background: '#1C1E22', color: barColor,
              border: `0.5px solid ${barColor}20`, fontSize: 9,
            }}>
              onsite
            </span>
          )}
        </div>
        {!isMobile && <span className="text-xs" style={{ color: '#5A5D65' }}>{shift.time}</span>}
        <span style={{ color: barColor, fontSize: 10, fontWeight: 500 }}>{shift.hours}h</span>
      </div>

      {/* Day cells */}
      {days.map(({ idx }) => {
        const cellKey     = `${idx}-${shift.key}`
        const cellIds     = assignments[cellKey] || []
        const isUnderstaffed = shift.key === 'E' && cellIds.length > 0 && cellIds.length < 2
        return (
          <RosterCell
            key={idx}
            dayIdx={idx}
            shiftKey={shift.key}
            employees={employees}
            isMobile={isMobile}
            isFlashing={flashCell === cellKey}
            isUnderstaffed={isUnderstaffed}
            onCellTap={onCellTap}
            isLastCol={idx === days.length - 1}
          />
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────── */

function RosterCell({ dayIdx, shiftKey, employees, isMobile, isFlashing, isUnderstaffed, onCellTap, isLastCol }) {
  const { getCellIds, unassignEmployee } = useRosterStore()
  const assignedIds = getCellIds(dayIdx, shiftKey)

  const { isOver, setNodeRef } = useDroppable({
    id:   `cell-${dayIdx}-${shiftKey}`,
    data: { dayIdx, shiftKey },
  })

  return (
    <div
      ref={setNodeRef}
      onClick={e => { e.stopPropagation(); onCellTap?.(dayIdx, shiftKey) }}
      className={clsx(
        'relative transition-all duration-150',
        isOver && 'drop-active',
        isFlashing && 'cell-flash',
        isUnderstaffed && 'needs-staff'
      )}
      style={{
        minHeight: isMobile ? 56 : 72,
        padding: isMobile ? 4 : 8,
        borderLeft: `0.5px solid ${isUnderstaffed ? '#00D9B540' : '#2A2D33'}`,
        cursor: isMobile ? 'pointer' : 'default',
      }}
    >
      {isOver && assignedIds.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs font-medium"
          style={{ color: '#00D9B5' }}>
          Drop
        </div>
      )}

      <div className="flex flex-wrap gap-0.5">
        {assignedIds.map((empId, i) => (
          <EmployeeChip
            key={empId}
            empId={empId}
            employees={employees}
            isMobile={isMobile}
            index={i}
            onRemove={() => unassignEmployee(dayIdx, shiftKey, empId)}
          />
        ))}
      </div>

      {/* Understaffed Shift E indicator */}
      {isUnderstaffed && (
        <div
          className="absolute bottom-1 right-1 text-xs font-medium"
          style={{ color: '#00D9B5', fontSize: 9 }}
          aria-label="Needs 2 staff"
        >
          +1
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────── */

function EmployeeChip({ empId, employees, isMobile, index, onRemove }) {
  const emp   = employees.find(e => e.id === empId)
  if (!emp) return null
  const color = getEmployeeColor(empId, employees)

  return (
    <span
      className={clsx('group inline-flex items-center gap-1 rounded anim-chip', `d-${Math.min(index, 4)}`)}
      style={{
        background: '#26292F', color: '#F0EEE9',
        border: '0.5px solid #3A3D45', borderLeft: `2px solid ${color}`,
        padding: isMobile ? '3px 6px' : '2px 6px',
        fontSize: 11, fontWeight: 500,
        maxWidth: isMobile ? 70 : 90,
        transition: 'transform 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      <span className="truncate">{isMobile ? emp.name.split(' ')[0] : emp.name}</span>
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-red-400"
        style={{ color: '#5A5D65', lineHeight: 1, flexShrink: 0 }}
        aria-label={`Remove ${emp.name}`}
      >
        <X size={8} strokeWidth={2.5} />
      </button>
    </span>
  )
}
