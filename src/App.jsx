import { useState, useEffect } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import useRosterStore from './store/rosterStore'
import { getEmployeeColor } from './utils/constants'
import Header from './components/Header'
import RosterGrid from './components/RosterGrid'
import EmployeePanel from './components/EmployeePanel'
import ImportModal from './components/ImportModal'
import AIPanel from './components/AIPanel'
import RulesModal from './components/RulesModal'
import SettingsModal from './components/SettingsModal'
import ChatImportModal from './components/ChatImportModal'
import { applyKnownPreferences } from './utils/applyPreferences'

export default function App() {
  const { assignEmployee, employees } = useRosterStore()

  // Apply employee-specific preferences and rules once employees are loaded
  useEffect(() => {
    if (employees.length > 0) applyKnownPreferences(useRosterStore)
  }, [employees.length])

  const [showImport,   setShowImport]   = useState(false)
  const [showAI,       setShowAI]       = useState(false)
  const [showRules,    setShowRules]    = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChat,     setShowChat]     = useState(false)
  const [activeEmp,    setActiveEmp]    = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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
      const rest = over.id.slice(5)                    // remove "cell-"
      const dash = rest.indexOf('-')
      const dayIdx   = parseInt(rest.slice(0, dash), 10)
      const shiftKey = rest.slice(dash + 1)
      assignEmployee(dayIdx, shiftKey, empId)
      const name = employees.find(e => e.id === empId)?.name || 'Employee'
      toast.success(`${name} assigned`, { duration: 1500 })
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col h-screen bg-primary-50">

        <Header
          onOpenImport={() => setShowImport(true)}
          onOpenAI={() => setShowAI(true)}
          onOpenRules={() => setShowRules(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenChat={() => setShowChat(true)}
        />

        <div className="flex flex-1 overflow-hidden">
          <EmployeePanel />

          <main className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
            <RosterGrid />

            {/* Footer hint */}
            <p className="text-[11px] font-semibold text-primary-400 text-center pb-1 tracking-wide">
              Drag employees from the panel · Click × on a badge to remove · AI powered by Ollama (local)
            </p>
          </main>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 150 }}>
        {activeEmp && <DragChip emp={activeEmp} employees={employees} />}
      </DragOverlay>

      {showImport   && <ImportModal   onClose={() => setShowImport(false)}   />}
      {showAI       && <AIPanel       onClose={() => setShowAI(false)}       />}
      {showRules    && <RulesModal    onClose={() => setShowRules(false)}    />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showChat     && <ChatImportModal onClose={() => setShowChat(false)} />}
    </DndContext>
  )
}

function DragChip({ emp, employees }) {
  const color = getEmployeeColor(emp.id, employees)
  return (
    <div
      className={`badge text-sm px-3 py-2 cursor-grabbing font-bold ${color.bg} ${color.text} ${color.border}`}
      style={{ transform: 'rotate(2deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color.dot }} />
      {emp.name}
    </div>
  )
}
