import {
  CalendarDays, Users, Upload, MessageSquare,
  BookOpen, Cpu, Settings, Zap, Download, BarChart2, BookMarked,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { id: 'roster',     icon: CalendarDays,  label: 'Roster'      },
  { id: 'report',     icon: BarChart2,     label: 'Reports'     },
  { id: 'guidelines', icon: BookMarked,    label: 'Guidelines'  },
  { id: 'employees',  icon: Users,         label: 'Employees'   },
  { id: 'import',    icon: Upload,         label: 'Import'      },
  { id: 'chat',      icon: MessageSquare,  label: 'Chat Import' },
  { id: 'rules',     icon: BookOpen,       label: 'Rules'       },
  { id: 'ai',        icon: Cpu,            label: 'AI Chat'     },
]

export default function Sidebar({ active, onNav, onAutoSchedule, onExport, onOpenSettings }) {
  return (
    <aside
      className="flex flex-col h-screen select-none flex-shrink-0"
      style={{
        width: 216,
        background: '#16181C',
        borderRight: '0.5px solid #2A2D33',
      }}
    >
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '0.5px solid #2A2D33' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#00D9B5' }}
          >
            <CalendarDays size={14} color="#0E0F11" strokeWidth={2} />
          </div>
          <div>
            <p className="font-display text-sm font-light" style={{ color: '#F0EEE9', letterSpacing: '0.01em' }}>
              Roster
            </p>
            <p className="text-2xs font-medium uppercase tracking-label" style={{ color: '#5A5D65' }}>
              Creator
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        <p className="px-3 py-2 text-2xs font-medium uppercase tracking-label" style={{ color: '#5A5D65' }}>
          Navigation
        </p>
        {NAV.map(({ id, icon: Icon, label }, idx) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={clsx(
                'relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                'hover-slide anim-left',
                `d-${idx + 1}`,
                isActive ? 'nav-item-active' : ''
              )}
              style={{
                background: isActive ? '#1C1E22' : 'transparent',
                color: isActive ? '#F0EEE9' : '#8A8D95',
              }}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
              {isActive && (
                <span
                  className="absolute left-0 top-1/4 bottom-1/4 rounded-r"
                  style={{ width: 2, background: '#00D9B5' }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Separator */}
      <div className="sep mx-2" />

      {/* Bottom actions */}
      <div className="p-3 space-y-1.5">
        <button
          onClick={onAutoSchedule}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ background: '#00D9B5', color: '#0E0F11' }}
        >
          <Zap size={15} strokeWidth={2} />
          Auto-Schedule
        </button>
        <button
          onClick={onExport}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ border: '0.5px solid #3A3D45', color: '#F0EEE9' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1C1E22'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Download size={15} strokeWidth={1.5} />
          Export Excel
        </button>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150"
          style={{ color: '#5A5D65' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1C1E22'; e.currentTarget.style.color = '#8A8D95' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5A5D65' }}
        >
          <Settings size={15} strokeWidth={1.5} />
          Settings
        </button>
      </div>
    </aside>
  )
}
