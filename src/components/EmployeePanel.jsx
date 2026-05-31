import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Search, Trash2, Edit2, Users, List } from 'lucide-react'
import clsx from 'clsx'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, SHIFT_HOURS, MAX_HOURS_PER_WEEK, MIN_HOURS_PER_WEEK, getEmployeeColor } from '../utils/constants'
import { calcEmployeeHours } from '../utils/rosterEngine'
import AddEmployeeModal from './AddEmployeeModal'
import BulkAddModal from './BulkAddModal'

export default function EmployeePanel() {
  const { employees, removeEmployee, getAssignmentCount } = useRosterStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [editEmp, setEditEmp] = useState(null)

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const assignments = useRosterStore(s => s.assignments)
  const totalHours  = employees.reduce((sum, e) => sum + calcEmployeeHours(e.id, assignments), 0)

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-white border-r-2 border-primary-100 h-full overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-3 pt-4 pb-3 border-b-2 border-primary-100">

        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-primary-600" strokeWidth={2.5} />
            <span className="text-sm font-bold text-primary-900">Employees</span>
            {employees.length > 0 && (
              <span className="text-[10px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded-md">
                {employees.length}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowBulk(true)}
              className="btn-ghost py-1 px-2 text-xs rounded-lg"
              title="Add multiple employees"
            >
              <List size={12} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => { setEditEmp(null); setShowAdd(true) }}
              className="btn-primary py-1 px-2 text-xs rounded-lg"
            >
              <Plus size={12} strokeWidth={3} />
              Add
            </button>
          </div>
        </div>

        {/* Stats strip */}
        {employees.length > 0 && (
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-primary-50 border-2 border-primary-100 rounded-lg py-1.5 text-center">
              <p className="text-base font-bold text-primary-700">{employees.length}</p>
              <p className="text-[10px] font-semibold text-primary-400 uppercase tracking-wide">Staff</p>
            </div>
            <div className="flex-1 bg-cta-50 border-2 border-cta-100 rounded-lg py-1.5 text-center">
              <p className="text-base font-bold text-cta-600">{totalHours}h</p>
              <p className="text-[10px] font-semibold text-cta-400 uppercase tracking-wide">Total hrs</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-400" strokeWidth={2.5} />
          <input
            className="input pl-8 py-1.5 text-xs"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Employee list ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-10 px-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users size={22} className="text-primary-400" />
            </div>
            {employees.length === 0 ? (
              <>
                <p className="text-xs font-bold text-primary-700">No employees yet</p>
                <p className="text-[11px] text-primary-400 mt-1">
                  Add employees manually or import from a CSV / Google Sheet.
                </p>
              </>
            ) : (
              <p className="text-xs text-primary-400 font-semibold">No results for "{search}"</p>
            )}
          </div>
        )}

        {filtered.map(emp => (
          <EmployeeCard
            key={emp.id}
            emp={emp}
            onEdit={() => { setEditEmp(emp); setShowAdd(true) }}
            onRemove={() => removeEmployee(emp.id)}
          />
        ))}
      </div>

      {/* ── Footer hint ──────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t-2 border-primary-100 bg-primary-50">
        <p className="text-[10px] text-primary-500 font-semibold text-center uppercase tracking-wide">
          Drag onto grid to assign
        </p>
      </div>

      {showAdd && (
        <AddEmployeeModal
          existing={editEmp}
          onClose={() => { setShowAdd(false); setEditEmp(null) }}
        />
      )}
      {showBulk && <BulkAddModal onClose={() => setShowBulk(false)} />}
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function EmployeeCard({ emp, onEdit, onRemove }) {
  const employees   = useRosterStore(s => s.employees)
  const assignments = useRosterStore(s => s.assignments)
  const color       = getEmployeeColor(emp.id, employees)
  const empHours    = calcEmployeeHours(emp.id, assignments)
  const pct         = Math.min(100, Math.round((empHours / MAX_HOURS_PER_WEEK) * 100))
  const isUnder     = empHours < MIN_HOURS_PER_WEEK && empHours > 0

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   `employee-${emp.id}`,
    data: { employeeId: emp.id, name: emp.name },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }}
      className={clsx(
        'group relative rounded-xl border-2 p-3 cursor-grab active:cursor-grabbing',
        'transition-colors duration-150 ease-out select-none',
        color.border, color.bg,
        isDragging ? 'ring-2 ring-primary-500' : ''
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        {/* Color avatar */}
        <div
          className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
          style={{ backgroundColor: color.dot }}
        >
          {emp.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + ID */}
          <p className={clsx('text-xs font-bold truncate', color.text)}>{emp.name}</p>
          {emp.employeeId && (
            <p className="text-[10px] text-primary-500 font-semibold">{emp.employeeId}</p>
          )}

          {/* Preferred shifts chips */}
          {emp.shifts.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1.5">
              {emp.shifts.map(sk => (
                <span
                  key={sk}
                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-white border-2 border-primary-200 text-primary-700 font-bold"
                >
                  {sk}
                </span>
              ))}
            </div>
          )}

          {/* Hours bar */}
          <div className="mt-2">
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-primary-400 font-semibold">Hours</span>
              <span className={clsx('text-[10px] font-bold', isUnder ? 'text-cta-500' : 'text-primary-600')}>
                {empHours}h
                {isUnder && <span className="ml-0.5 text-[9px]">↑{MIN_HOURS_PER_WEEK-empHours}h needed</span>}
              </span>
            </div>
            {/* Min marker at 32h/45h = 71% */}
            <div className="h-1.5 bg-white rounded-full overflow-hidden border border-primary-100 relative">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-300 ease-out',
                  pct >= 90 ? 'bg-red-500' : isUnder ? 'bg-amber-400' : 'bg-primary-500'
                )}
                style={{ width: `${pct}%` }}
              />
              {/* Min line at 32h */}
              <div className="absolute top-0 bottom-0 w-px bg-cta-400 opacity-60"
                style={{ left: `${Math.round((MIN_HOURS_PER_WEEK / MAX_HOURS_PER_WEEK) * 100)}%` }}
              />
            </div>
            <div className="text-[9px] text-primary-300 text-right">{MAX_HOURS_PER_WEEK}h max</div>
          </div>
        </div>

        {/* Action buttons — stop drag propagation */}
        <div
          className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onPointerDown={e => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            className="p-1 rounded-lg text-primary-400 hover:text-primary-700 hover:bg-primary-100 transition-colors cursor-pointer"
            aria-label="Edit"
          >
            <Edit2 size={11} strokeWidth={2.5} />
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded-lg text-primary-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            aria-label="Remove"
          >
            <Trash2 size={11} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
