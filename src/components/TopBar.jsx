import { format, addDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useRosterStore from '../store/rosterStore'

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function TopBar() {
  const { weekStart, numDays, prevWeek, nextWeek } = useRosterStore()
  const start = parseISO(weekStart)
  const end   = addDays(start, numDays - 1)

  return (
    <div
      className="flex items-center gap-4 px-5 flex-shrink-0"
      style={{
        height: 52,
        borderBottom: '0.5px solid #2A2D33',
        background: '#16181C',
      }}
    >
      {/* Week navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={prevWeek}
          className="btn-icon"
          aria-label="Previous week"
        >
          <ChevronLeft size={15} strokeWidth={1.5} />
        </button>

        <div
          className="px-4 py-1.5 rounded-lg text-sm font-medium"
          style={{
            background: '#1C1E22',
            color: '#F0EEE9',
            border: '0.5px solid #2A2D33',
            minWidth: 200,
            textAlign: 'center',
          }}
        >
          {format(start, 'MMM d')}
          <span style={{ color: '#5A5D65' }}> – </span>
          {format(end, 'MMM d, yyyy')}
        </div>

        <button
          onClick={nextWeek}
          className="btn-icon"
          aria-label="Next week"
        >
          <ChevronRight size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* Day pills */}
      <div className="flex items-center gap-1 ml-2">
        {Array.from({ length: numDays }, (_, i) => {
          const d = addDays(start, i)
          const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          return (
            <span
              key={i}
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                background: isToday ? '#00D9B510' : 'transparent',
                color: isToday ? '#00D9B5' : '#5A5D65',
                border: isToday ? '0.5px solid #00D9B530' : 'none',
              }}
            >
              {DAYS_SHORT[i]} {format(d, 'd')}
            </span>
          )
        })}
      </div>
    </div>
  )
}
