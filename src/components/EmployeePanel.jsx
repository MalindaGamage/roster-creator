import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Search, Trash2, Edit2, Users, List } from 'lucide-react'
import clsx from 'clsx'
import useRosterStore from '../store/rosterStore'
import { getEmployeeColor, MAX_HOURS_PER_WEEK, MIN_HOURS_PER_WEEK } from '../utils/constants'
import { calcEmployeeHours, calcEmployeeNights } from '../utils/rosterEngine'
import AddEmployeeModal from './AddEmployeeModal'
import BulkAddModal     from './BulkAddModal'

export default function EmployeePanel() {
  const { employees, removeEmployee } = useRosterStore()
  const assignments = useRosterStore(s => s.assignments)
  const [search,    setSearch]    = useState('')
  const [showAdd,   setShowAdd]   = useState(false)
  const [showBulk,  setShowBulk]  = useState(false)
  const [editEmp,   setEditEmp]   = useState(null)

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalH = employees.reduce((s, e) => s + calcEmployeeHours(e.id, assignments), 0)

  return (
    <aside
      className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        width: 232,
        background: '#16181C',
        borderRight: '0.5px solid #2A2D33',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '0.5px solid #2A2D33' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <span className="text-sm font-medium" style={{ color: '#F0EEE9' }}>
              Employees
            </span>
            {employees.length > 0 && (
              <span
                className="text-2xs font-medium px-1.5 py-0.5 rounded"
                style={{ background: '#00D9B510', color: '#00D9B5', border: '0.5px solid #00D9B530' }}
              >
                {employees.length}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowBulk(true)} className="btn-icon" title="Bulk add">
              <List size={13} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => { setEditEmp(null); setShowAdd(true) }}
              className="btn-icon"
              title="Add employee"
            >
              <Plus size={13} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        {employees.length > 0 && (
          <div className="flex gap-2 mb-3">
            <div
              className="flex-1 rounded-lg px-2 py-1.5 text-center"
              style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#00D9B5' }}>{employees.length}</p>
              <p className="text-2xs uppercase tracking-label" style={{ color: '#5A5D65' }}>staff</p>
            </div>
            <div
              className="flex-1 rounded-lg px-2 py-1.5 text-center"
              style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#00D9B5' }}>{totalH}h</p>
              <p className="text-2xs uppercase tracking-label" style={{ color: '#5A5D65' }}>scheduled</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search
            size={12}
            strokeWidth={1.5}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: '#5A5D65' }}
          />
          <input
            className="input pl-8 text-xs py-1.5"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Employee list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {filtered.length === 0 && (
          <div className="text-center py-10 px-3">
            <Users size={20} strokeWidth={1} className="mx-auto mb-2" style={{ color: '#3A3D45' }} />
            <p className="text-xs font-medium" style={{ color: '#5A5D65' }}>
              {employees.length === 0 ? 'No employees added' : `No results`}
            </p>
          </div>
        )}
        {filtered.map(emp => (
          <EmployeeCard
            key={emp.id}
            emp={emp}
            assignments={assignments}
            onEdit={() => { setEditEmp(emp); setShowAdd(true) }}
            onRemove={() => removeEmployee(emp.id)}
          />
        ))}
      </div>

      {/* Drag hint */}
      <div
        className="px-4 py-2.5 text-center text-xs"
        style={{ color: '#3A3D45', borderTop: '0.5px solid #2A2D33' }}
      >
        Drag cards onto the roster grid
      </div>

      {showAdd  && <AddEmployeeModal existing={editEmp} onClose={() => { setShowAdd(false); setEditEmp(null) }} />}
      {showBulk && <BulkAddModal onClose={() => setShowBulk(false)} />}
    </aside>
  )
}

function EmployeeCard({ emp, assignments, onEdit, onRemove }) {
  const employees = useRosterStore(s => s.employees)
  const color     = getEmployeeColor(emp.id, employees)
  const empHours  = calcEmployeeHours(emp.id, assignments)
  const empNights = calcEmployeeNights(emp.id, assignments)
  const pct       = Math.min(100, Math.round((empHours / MAX_HOURS_PER_WEEK) * 100))
  const isUnder   = empHours > 0 && empHours < MIN_HOURS_PER_WEEK

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   `employee-${emp.id}`,
    data: { employeeId: emp.id, name: emp.name },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        background: isDragging ? '#1C1E22' : '#16181C',
        border: `0.5px solid ${isDragging ? color + '60' : '#2A2D33'}`,
        borderLeft: `2px solid ${color}`,
        borderRadius: 8,
        cursor: 'grab',
      }}
      className="group relative p-2.5 transition-all duration-150 hover:bg-surface-2 select-none"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        {/* Initial avatar */}
        <div
          className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-xs font-semibold mt-0.5"
          style={{ background: color + '20', color }}
        >
          {emp.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#F0EEE9' }}>{emp.name}</p>
          {emp.employeeId && (
            <p className="text-2xs" style={{ color: '#5A5D65' }}>{emp.employeeId}</p>
          )}

          {/* Shift preference chips */}
          {emp.shifts.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {emp.shifts.map(sk => (
                <span
                  key={sk}
                  className="text-2xs px-1 rounded"
                  style={{ background: '#1C1E22', color: '#8A8D95', border: '0.5px solid #3A3D45' }}
                >
                  {sk}
                </span>
              ))}
            </div>
          )}

          {/* Hours bar */}
          <div className="mt-2">
            <div className="flex justify-between mb-1">
              <span className="text-2xs" style={{ color: '#5A5D65' }}>
                {empNights}n · {empHours}h
                {isUnder && <span style={{ color: '#8A7A40' }}> ↑{MIN_HOURS_PER_WEEK - empHours}h</span>}
              </span>
              <span className="text-2xs font-medium" style={{ color: pct >= 90 ? '#D94040' : '#5A5D65' }}>
                {pct}%
              </span>
            </div>
            {/* Track */}
            <div style={{ height: 2, background: '#26292F', borderRadius: 1, position: 'relative' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct >= 90 ? '#D94040' : isUnder ? '#8A7A40' : '#00D9B5',
                  borderRadius: 1,
                  transition: 'width 300ms ease',
                }}
              />
              {/* Min marker at 32/45 = 71% */}
              <div style={{
                position: 'absolute', top: -1, bottom: -1, width: 1,
                background: '#3A3D45',
                left: `${Math.round((MIN_HOURS_PER_WEEK / MAX_HOURS_PER_WEEK) * 100)}%`,
              }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onPointerDown={e => e.stopPropagation()}
        >
          <button onClick={onEdit}   className="btn-icon" style={{ width: 22, height: 22 }} title="Edit">
            <Edit2 size={11} strokeWidth={1.5} />
          </button>
          <button onClick={onRemove} className="btn-icon hover:text-red-400" style={{ width: 22, height: 22 }} title="Remove">
            <Trash2 size={11} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
