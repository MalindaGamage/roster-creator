import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Search, Trash2, Edit2, Users, List, X } from 'lucide-react'
import clsx from 'clsx'
import useRosterStore from '../store/rosterStore'
import { getEmployeeColor, MAX_HOURS_PER_WEEK, MIN_HOURS_PER_WEEK } from '../utils/constants'
import { calcEmployeeHours, calcEmployeeNights } from '../utils/rosterEngine'
import AddEmployeeModal from './AddEmployeeModal'
import BulkAddModal     from './BulkAddModal'

export default function EmployeePanel({ isMobile, selectedEmpId, onEmployeeTap, onClose }) {
  const { employees, removeEmployee } = useRosterStore()
  const assignments = useRosterStore(s => s.assignments)
  const [search,   setSearch]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [editEmp,  setEditEmp]  = useState(null)

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
  const totalH   = employees.reduce((s, e) => s + calcEmployeeHours(e.id, assignments), 0)

  const panelStyle = isMobile
    ? {
        // Mobile: full-width bottom drawer
        position: 'fixed', bottom: 56, left: 0, right: 0,
        height: '65vh',
        background: '#16181C',
        borderTop: '0.5px solid #2A2D33',
        borderRadius: '16px 16px 0 0',
        zIndex: 30,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
      }
    : {
        // Desktop: fixed left sidebar
        width: 232, flexShrink: 0,
        background: '#16181C',
        borderRight: '0.5px solid #2A2D33',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }

  return (
    <div style={panelStyle}>
      {/* Handle bar (mobile only) */}
      {isMobile && (
        <div className="flex items-center justify-center pt-2 pb-1 flex-shrink-0">
          <div style={{ width: 36, height: 4, background: '#3A3D45', borderRadius: 2 }} />
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '0.5px solid #2A2D33' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <span className="text-sm font-medium" style={{ color: '#F0EEE9' }}>Employees</span>
            {employees.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: '#00D9B510', color: '#00D9B5', border: '0.5px solid #00D9B530' }}>
                {employees.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowBulk(true)} className="btn-icon" style={{ width: 28, height: 28 }} title="Bulk add">
              <List size={13} strokeWidth={1.5} />
            </button>
            <button onClick={() => { setEditEmp(null); setShowAdd(true) }} className="btn-icon" style={{ width: 28, height: 28 }}>
              <Plus size={13} strokeWidth={2} />
            </button>
            {isMobile && (
              <button onClick={onClose} className="btn-icon" style={{ width: 28, height: 28 }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {employees.length > 0 && (
          <div className="flex gap-2 mb-3">
            <StatBox value={employees.length} label="staff" />
            <StatBox value={`${totalH}h`} label="scheduled" />
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={12} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#5A5D65' }} />
          <input className="input pl-8 text-xs py-1.5" placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Mobile hint */}
      {isMobile && (
        <div className="px-4 py-1.5 flex-shrink-0" style={{ borderBottom: '0.5px solid #2A2D33' }}>
          <p className="text-xs text-center" style={{ color: '#5A5D65' }}>
            Tap an employee, then tap a shift cell to assign
          </p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {filtered.length === 0 && (
          <div className="text-center py-8 px-3">
            <Users size={20} strokeWidth={1} className="mx-auto mb-2" style={{ color: '#3A3D45' }} />
            <p className="text-xs" style={{ color: '#5A5D65' }}>
              {employees.length === 0 ? 'No employees added' : 'No results'}
            </p>
          </div>
        )}
        {filtered.map((emp, idx) => (
          <EmployeeCard
            key={emp.id}
            emp={emp}
            assignments={assignments}
            isMobile={isMobile}
            isSelected={selectedEmpId === emp.id}
            staggerIdx={idx}
            onTap={() => onEmployeeTap(emp)}
            onEdit={() => { setEditEmp(emp); setShowAdd(true) }}
            onRemove={() => removeEmployee(emp.id)}
          />
        ))}
      </div>

      {!isMobile && (
        <div className="px-4 py-2.5 text-center text-xs flex-shrink-0"
          style={{ color: '#3A3D45', borderTop: '0.5px solid #2A2D33' }}>
          Drag cards onto the roster grid
        </div>
      )}

      {showAdd  && <AddEmployeeModal existing={editEmp} onClose={() => { setShowAdd(false); setEditEmp(null) }} />}
      {showBulk && <BulkAddModal onClose={() => setShowBulk(false)} />}
    </div>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="flex-1 rounded-lg px-2 py-1.5 text-center"
      style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}>
      <p className="text-sm font-semibold" style={{ color: '#00D9B5' }}>{value}</p>
      <p className="text-xs uppercase" style={{ color: '#5A5D65', letterSpacing: '0.06em', fontSize: 10 }}>{label}</p>
    </div>
  )
}

function EmployeeCard({ emp, assignments, isMobile, isSelected, staggerIdx, onTap, onEdit, onRemove }) {
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

  const delay   = Math.min(staggerIdx, 8) * 40
  const cardStyle = {
    transform:  CSS.Translate.toString(transform),
    opacity:    isDragging ? 0.3 : 1,
    background: isSelected ? '#1C1E22' : '#16181C',
    border:     `0.5px solid ${isSelected ? color : '#2A2D33'}`,
    borderLeft: `2px solid ${color}`,
    borderRadius: 8,
    cursor:     isMobile ? 'pointer' : 'grab',
    boxShadow:  isSelected ? `0 0 0 1px ${color}40` : 'none',
    padding:    isMobile ? '10px 12px' : '10px 10px',
    transition: 'transform 150ms ease, border-color 150ms ease, background 150ms ease',
    animation:  `riseUp 350ms ${delay}ms ease-out both`,
  }

  return (
    <div
      ref={!isMobile ? setNodeRef : undefined}
      style={cardStyle}
      className="group relative select-none"
      onClick={isMobile ? onTap : undefined}
      {...(!isMobile ? { ...attributes, ...listeners } : {})}
      onMouseEnter={!isMobile ? e => { e.currentTarget.style.transform = 'translateY(-1px)' } : undefined}
      onMouseLeave={!isMobile ? e => { e.currentTarget.style.transform = CSS.Translate.toString(transform) || 'none' } : undefined}
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-xs font-semibold mt-0.5"
          style={{ background: color + '20', color }}>
          {emp.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#F0EEE9' }}>{emp.name}</p>
          {emp.employeeId && <p className="text-xs" style={{ color: '#5A5D65' }}>{emp.employeeId}</p>}

          {emp.shifts.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {emp.shifts.map(sk => (
                <span key={sk} className="text-xs px-1 rounded"
                  style={{ background: '#1C1E22', color: '#8A8D95', border: '0.5px solid #3A3D45', fontSize: 10 }}>
                  {sk}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2">
            <div className="flex justify-between mb-1">
              <span className="text-xs" style={{ color: '#5A5D65', fontSize: 10 }}>
                {empNights}n · {empHours}h
                {isUnder && <span style={{ color: '#8A7A40' }}> ↑{MIN_HOURS_PER_WEEK - empHours}h</span>}
              </span>
              <span className="text-xs font-medium" style={{ color: pct >= 90 ? '#D94040' : '#5A5D65', fontSize: 10 }}>
                {pct}%
              </span>
            </div>
            <div style={{ height: 2, background: '#26292F', borderRadius: 1, position: 'relative' }}>
              <div
                className="bar-fill"
                style={{
                  height: '100%', width: `${pct}%`, borderRadius: 1,
                  background: pct >= 90 ? '#D94040' : isUnder ? '#8A7A40' : '#00D9B5',
                  animationDelay: `${delay + 300}ms`,
                }}
              />
              <div style={{
                position: 'absolute', top: -1, bottom: -1, width: 1,
                background: '#3A3D45',
                left: `${Math.round((MIN_HOURS_PER_WEEK / MAX_HOURS_PER_WEEK) * 100)}%`,
              }} />
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onPointerDown={e => e.stopPropagation()}>
            <button onClick={onEdit}   className="btn-icon" style={{ width: 22, height: 22 }}><Edit2  size={11} strokeWidth={1.5} /></button>
            <button onClick={onRemove} className="btn-icon hover:text-red-400" style={{ width: 22, height: 22 }}><Trash2 size={11} strokeWidth={1.5} /></button>
          </div>
        )}

        {isMobile && (
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={onEdit}   className="btn-icon" style={{ width: 28, height: 28 }}><Edit2  size={13} strokeWidth={1.5} /></button>
            <button onClick={onRemove} className="btn-icon" style={{ width: 28, height: 28, color: '#D94040' }}><Trash2 size={13} strokeWidth={1.5} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
