import { format, addDays, parseISO } from 'date-fns'
import {
  ChevronLeft, ChevronRight, Download,
  Upload, MessageSquare, Settings, BookOpen, CalendarDays, Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import useRosterStore from '../store/rosterStore'
import { exportToExcel } from '../utils/excelExport'
import { autoSchedule } from '../utils/rosterEngine'

export default function Header({ onOpenImport, onOpenAI, onOpenRules, onOpenSettings, onOpenChat }) {
  const { weekStart, numDays, prevWeek, nextWeek, assignments, employees, setAssignments } = useRosterStore()

  function handleAutoSchedule() {
    if (!employees.length) return toast.error('Add employees first')
    const result = autoSchedule(employees, numDays)
    setAssignments(result)
    toast.success('Roster auto-scheduled!')
  }

  const start = parseISO(weekStart)
  const end   = addDays(start, numDays - 1)

  function handleExport() {
    try {
      exportToExcel(weekStart, numDays, assignments, employees)
      toast.success('Excel roster exported!')
    } catch (e) {
      toast.error('Export failed: ' + e.message)
    }
  }

  return (
    <header className="bg-white border-b-2 border-primary-100 sticky top-0 z-30">
      <div className="flex items-center gap-3 px-4 h-14">

        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 min-w-[172px]">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarDays size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-primary-900 leading-none">Roster Creator</p>
            <p className="text-[10px] text-primary-400 font-semibold tracking-wide mt-0.5">
              AI-POWERED SCHEDULING
            </p>
          </div>
        </div>

        <div className="h-8 w-0.5 bg-primary-100 mx-1" />

        {/* ── Week navigator ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1">
          <button
            onClick={prevWeek}
            className="btn-ghost p-1.5 rounded-lg"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg px-4 py-1.5 min-w-[192px] text-center">
            <span className="text-sm font-bold text-primary-800">
              {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
            </span>
          </div>

          <button
            onClick={nextWeek}
            className="btn-ghost p-1.5 rounded-lg"
            aria-label="Next week"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1" />

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2">
          <button onClick={onOpenRules} className="btn-ghost hidden sm:flex text-xs py-1.5 px-3">
            <BookOpen size={14} strokeWidth={2} />
            Rules
          </button>

          <button onClick={onOpenImport} className="btn-secondary hidden sm:flex text-xs py-1.5 px-3">
            <Upload size={14} strokeWidth={2} />
            Import
          </button>

          <button onClick={onOpenChat} className="btn-secondary hidden sm:flex text-xs py-1.5 px-3">
            <MessageSquare size={14} strokeWidth={2} />
            Chat Import
          </button>

          <button onClick={handleAutoSchedule} className="btn-secondary text-xs py-1.5 px-3">
            <Zap size={14} strokeWidth={2} />
            Auto-Schedule
          </button>

          {/* Chat assistant — orange CTA */}
          <button onClick={onOpenAI} className="btn-cta text-xs py-1.5 px-4">
            <MessageSquare size={14} strokeWidth={2} />
            Ask AI
          </button>

          {/* Export — primary teal */}
          <button onClick={handleExport} className="btn-primary text-xs py-1.5 px-4">
            <Download size={14} strokeWidth={2} />
            Export
          </button>

          <div className="h-8 w-0.5 bg-primary-100 mx-1" />

          <button
            onClick={onOpenSettings}
            className="btn-ghost p-2 rounded-lg"
            aria-label="Settings"
          >
            <Settings size={16} strokeWidth={2} />
          </button>
        </nav>
      </div>
    </header>
  )
}
