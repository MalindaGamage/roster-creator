import { useState, useEffect } from 'react'
import {
  DndContext, PointerSensor, TouchSensor,
  KeyboardSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import useRosterStore from './store/rosterStore'
import { getEmployeeColor } from './utils/constants'
import { autoSchedule } from './utils/rosterEngine'
import { exportToExcel } from './utils/excelExport'
import { applyKnownPreferences } from './utils/applyPreferences'
import { useMobile } from './hooks/useMobile'

import Sidebar         from './components/Sidebar'
import MobileNav       from './components/MobileNav'
import TopBar          from './components/TopBar'
import RosterGrid      from './components/RosterGrid'
import EmployeePanel   from './components/EmployeePanel'
import ImportModal     from './components/ImportModal'
import AIPanel         from './components/AIPanel'
import RulesModal      from './components/RulesModal'
import SettingsModal   from './components/SettingsModal'
import ChatImportModal from './components/ChatImportModal'

export default function App() {
  const { assignEmployee, employees, weekStart, numDays, setAssignments } = useRosterStore()
  const isMobile = useMobile()

  const [activeNav,      setActiveNav]      = useState('roster')
  const [showImport,     setShowImport]     = useState(false)
  const [showAI,         setShowAI]         = useState(false)
  const [showRules,      setShowRules]      = useState(false)
  const [showSettings,   setShowSettings]   = useState(false)
  const [showChat,       setShowChat]       = useState(false)
  const [showEmpPanel,   setShowEmpPanel]   = useState(true)
  const [activeEmp,      setActiveEmp]      = useState(null)
  const [selectedEmp,    setSelectedEmp]    = useState(null)
  const [flashCell,      setFlashCell]      = useState(null)      // cell key that just received an employee

  useEffect(() => {
    if (employees.length > 0) applyKnownPreferences(useRosterStore)
  }, [employees.length])

  // Close employee panel on mobile when navigating away
  useEffect(() => {
    if (isMobile && activeNav !== 'employees') setShowEmpPanel(false)
  }, [isMobile, activeNav])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleNav(id) {
    setActiveNav(id)
    if (id === 'import')    { setShowImport(true);               return }
    if (id === 'chat')      { setShowChat(true);                 return }
    if (id === 'rules')     { setShowRules(true);                return }
    if (id === 'ai')        { setShowAI(true);                   return }
    if (id === 'employees') { setShowEmpPanel(v => !v);          return }
    if (id === 'roster')    { setShowEmpPanel(!isMobile);        return }
  }

  function handleAutoSchedule() {
    if (!employees.length) return toast.error('Add employees first')
    setAssignments(autoSchedule(employees, numDays))
    toast.success('Roster auto-scheduled')
  }

  function handleExport() {
    try {
      const { assignments } = useRosterStore.getState()
      exportToExcel(weekStart, numDays, assignments, employees)
      toast.success('Excel exported')
    } catch (e) { toast.error(e.message) }
  }

  function onDragStart({ active }) {
    setSelectedEmp(null)  // clear tap selection when dragging
    if (active.id.startsWith('employee-')) {
      const emp = employees.find(e => e.id === active.id.replace('employee-', ''))
      setActiveEmp(emp || null)
    }
  }

  function onDragEnd({ active, over }) {
    setActiveEmp(null)
    if (!over || !active.id.startsWith('employee-')) return
    const empId = active.id.replace('employee-', '')
    if (over.id.startsWith('cell-')) {
      const rest     = over.id.slice(5)
      const dash     = rest.indexOf('-')
      const dayIdx   = parseInt(rest.slice(0, dash))
      const shiftKey = rest.slice(dash + 1)
      assignEmployee(dayIdx, shiftKey, empId)
      // Trigger flash animation on the assigned cell
      const cellKey = `${dayIdx}-${shiftKey}`
      setFlashCell(cellKey)
      setTimeout(() => setFlashCell(null), 520)
    }
  }

  // ── Tap-to-assign (mobile) ─────────────────────────────────────────
  function handleEmployeeTap(emp) {
    if (!isMobile) return
    setSelectedEmp(prev => prev?.id === emp.id ? null : emp)
    if (selectedEmp?.id !== emp.id) toast(`Tap a shift cell to assign ${emp.name}`, { duration: 2000, icon: '→' })
  }

  function handleCellTap(dayIdx, shiftKey) {
    if (!isMobile || !selectedEmp) return
    assignEmployee(dayIdx, shiftKey, selectedEmp.id)
    toast.success(`${selectedEmp.name} assigned`, { duration: 1200 })
    const cellKey = `${dayIdx}-${shiftKey}`
    setFlashCell(cellKey)
    setTimeout(() => setFlashCell(null), 520)
    setSelectedEmp(null)
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: '#0E0F11' }}
        onClick={() => { if (selectedEmp) setSelectedEmp(null) }}
      >

        {/* Desktop sidebar */}
        {!isMobile && (
          <Sidebar
            active={activeNav}
            onNav={handleNav}
            onAutoSchedule={handleAutoSchedule}
            onExport={handleExport}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar isMobile={isMobile} onOpenSettings={() => setShowSettings(true)} />

          <div className="flex flex-1 overflow-hidden">
            {/* Employee panel — desktop: sidebar, mobile: bottom drawer via state */}
            {showEmpPanel && (
              <EmployeePanel
                isMobile={isMobile}
                selectedEmpId={selectedEmp?.id}
                onEmployeeTap={handleEmployeeTap}
                onClose={() => { setShowEmpPanel(false); setActiveNav('roster') }}
              />
            )}

            <main
              className="flex-1 overflow-auto"
              style={{
                background: '#0E0F11',
                padding: isMobile ? '8px' : '16px',
                paddingBottom: isMobile ? '72px' : '16px',  // space for mobile nav
              }}
            >
              {/* Tap-to-assign banner */}
              {selectedEmp && isMobile && (
                <div
                  className="mb-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between"
                  style={{ background: '#00D9B520', border: '1px solid #00D9B540', color: '#00D9B5' }}
                  onClick={e => e.stopPropagation()}
                >
                  <span>Tap a cell to assign <strong>{selectedEmp.name}</strong></span>
                  <button onClick={() => setSelectedEmp(null)} style={{ color: '#00D9B5', fontSize: 18 }}>×</button>
                </div>
              )}

              <RosterGrid onCellTap={handleCellTap} isMobile={isMobile} flashCell={flashCell} />

              {!isMobile && (
                <p className="text-center text-xs mt-3 pb-1" style={{ color: '#3A3D45' }}>
                  Drag employees onto cells · Click × to remove · Auto-Schedule fills all slots
                </p>
              )}
            </main>
          </div>
        </div>

        {/* Mobile bottom nav */}
        {isMobile && (
          <MobileNav
            active={activeNav}
            onNav={handleNav}
            onExport={handleExport}
            onAutoSchedule={handleAutoSchedule}
          />
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 120 }}>
        {activeEmp && <DragChip emp={activeEmp} employees={employees} />}
      </DragOverlay>

      {/* Modals */}
      {showImport   && <ImportModal     onClose={() => { setShowImport(false);   setActiveNav('roster') }} />}
      {showChat     && <ChatImportModal onClose={() => { setShowChat(false);     setActiveNav('roster') }} />}
      {showRules    && <RulesModal      onClose={() => { setShowRules(false);    setActiveNav('roster') }} />}
      {showAI       && <AIPanel         onClose={() => { setShowAI(false);       setActiveNav('roster') }} />}
      {showSettings && <SettingsModal   onClose={() => setShowSettings(false)} />}
    </DndContext>
  )
}

function DragChip({ emp, employees }) {
  const color = getEmployeeColor(emp.id, employees)
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
      style={{
        background: '#26292F', color: '#F0EEE9',
        border: `0.5px solid ${color}`, borderLeft: `2px solid ${color}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)', transform: 'rotate(1.5deg)',
      }}
    >
      {emp.name}
    </div>
  )
}
