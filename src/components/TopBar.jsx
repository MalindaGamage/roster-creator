import { format, addDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Settings, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import useRosterStore from '../store/rosterStore'
import { autoSchedule } from '../utils/rosterEngine'

const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function TopBar({ isMobile, onOpenSettings }) {
  const { weekStart, numDays, prevWeek, nextWeek, employees, setAssignments } = useRosterStore()
  const start = parseISO(weekStart)
  const end   = addDays(start, numDays - 1)

  function handleAutoSchedule() {
    if (!employees.length) return toast.error('Add employees first')
    setAssignments(autoSchedule(employees, numDays))
    toast.success('Roster auto-scheduled')
  }

  return (
    <div
      className="flex items-center gap-2 flex-shrink-0 anim-fade d-0"
      style={{
        height: isMobile ? 48 : 52,
        padding: isMobile ? '0 12px' : '0 20px',
        borderBottom: '0.5px solid #2A2D33',
        background: '#16181C',
      }}
    >
      {/* Week navigation */}
      <button onClick={prevWeek} className="btn-icon" aria-label="Previous week">
        <ChevronLeft size={15} strokeWidth={1.5} />
      </button>

      <div
        className="flex-1 text-center text-sm font-medium rounded-lg py-1"
        style={{ color: '#F0EEE9', background: '#1C1E22', border: '0.5px solid #2A2D33' }}
      >
        {isMobile
          ? `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
          : `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
        }
      </div>

      <button onClick={nextWeek} className="btn-icon" aria-label="Next week">
        <ChevronRight size={15} strokeWidth={1.5} />
      </button>

      {/* Mobile: quick auto-schedule + settings in topbar */}
      {isMobile && (
        <>
          <button
            onClick={handleAutoSchedule}
            className="btn-icon"
            title="Auto-Schedule"
            style={{ width: 36, height: 36 }}
          >
            <Zap size={16} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
          </button>
          <button onClick={onOpenSettings} className="btn-icon" aria-label="Settings">
            <Settings size={15} strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* Desktop: day pills */}
      {!isMobile && (
        <div className="flex items-center gap-1 ml-2">
          {Array.from({ length: numDays }, (_, i) => {
            const d = addDays(start, i)
            const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            return (
              <span key={i} className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  background: isToday ? '#00D9B510' : 'transparent',
                  color: isToday ? '#00D9B5' : '#5A5D65',
                  border: isToday ? '0.5px solid #00D9B530' : 'none',
                }}>
                {DAYS_SHORT[i]} {format(d, 'd')}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
