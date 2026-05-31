import { CalendarDays, Users, MessageSquare, BookOpen, Cpu, Download, Upload, Zap } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { id: 'roster',    icon: CalendarDays,  label: 'Roster'  },
  { id: 'employees', icon: Users,         label: 'Staff'   },
  { id: 'chat',      icon: MessageSquare, label: 'Import'  },
  { id: 'ai',        icon: Cpu,           label: 'AI Chat' },
  { id: 'more',      icon: Download,      label: 'Export'  },
]

export default function MobileNav({ active, onNav, onExport, onAutoSchedule }) {
  function handleTap(id) {
    if (id === 'more') { onExport(); return }
    onNav(id)
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch"
      style={{
        background: '#16181C',
        borderTop: '0.5px solid #2A2D33',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV.map(({ id, icon: Icon, label }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => handleTap(id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-150"
            style={{
              color: isActive ? '#00D9B5' : '#5A5D65', minHeight: 56,
              transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: '0.02em' }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
