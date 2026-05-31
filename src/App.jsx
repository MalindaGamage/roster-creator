import { useState, useEffect } from 'react'
import {
  DndContext, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import useRosterStore from './store/rosterStore'
import { getEmployeeColor, EMPLOYEE_COLORS } from './utils/constants'
import { autoSchedule } from './utils/rosterEngine'
import { exportToExcel } from './utils/excelExport'
import { applyKnownPreferences } from './utils/applyPreferences'

import Sidebar         from './components/Sidebar'
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

  const [activeNav,    setActiveNav]    = useState('roster')
  const [showImport,   setShowImport]   = useState(false)
  const [showAI,       setShowAI]       = useState(false)
  const [showRules,    setShowRules]    = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChat,     setShowChat]     = useState(false)
  const [showEmpPanel, setShowEmpPanel] = useState(true)
  const [activeEmp,    setActiveEmp]    = useState(null)

  useEffect(() => {
    if (employees.length > 0) applyKnownPreferences(useRosterStore)
  }, [employees.length])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleNav(id) {
    setActiveNav(id)
    if (id === 'import')    { setShowImport(true);   return }
    if (id === 'chat')      { setShowChat(true);      return }
    if (id === 'rules')     { setShowRules(true);     return }
    if (id === 'ai')        { setShowAI(true);        return }
    if (id === 'employees') { setShowEmpPanel(v => !v); return }
  }

  function handleAutoSchedule() {
    if (!employees.length) return toast.error('Add employees first')
    const result = autoSchedule(employees, numDays)
    setAssignments(result)
    toast.success('Roster auto-scheduled')
  }

  function handleExport() {
    try {
      const { assignments } = useRosterStore.getState()
      exportToExcel(weekStart, numDays, assignments, employees)
      toast.success('Excel exported')
    } catch (e) {
      toast.error(e.message)
    }
  }

  function onDragStart({ active }) {
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
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0E0F11' }}>

        {/* Left sidebar */}
        <Sidebar
          active={activeNav}
          onNav={handleNav}
          onAutoSchedule={handleAutoSchedule}
          onExport={handleExport}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />

          <div className="flex flex-1 overflow-hidden">
            {showEmpPanel && <EmployeePanel />}

            <main className="flex-1 overflow-auto p-4" style={{ background: '#0E0F11' }}>
              <RosterGrid />
              <p
                className="text-center text-xs mt-3 pb-1"
                style={{ color: '#3A3D45' }}
              >
                Drag employees onto cells · Click × to remove · Auto-Schedule fills all slots
              </p>
            </main>
          </div>
        </div>
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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-grabbing"
      style={{
        background: '#26292F',
        color: '#F0EEE9',
        border: `0.5px solid ${color}`,
        borderLeft: `2px solid ${color}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        transform: 'rotate(1.5deg)',
      }}
    >
      {emp.name}
    </div>
  )
}
