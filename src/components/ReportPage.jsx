import { useMemo } from 'react'
import { parseISO, addDays, format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell, PieChart, Pie, Legend,
  ReferenceLine,
} from 'recharts'
import useRosterStore from '../store/rosterStore'
import { SHIFTS, DAYS_SHORT, SHIFT_BAR_COLOR, MAX_HOURS_PER_WEEK, MIN_HOURS_PER_WEEK } from '../utils/constants'
import { calcEmployeeHours, calcEmployeeNights } from '../utils/rosterEngine'

const REQUIRED = sk => sk === 'E' ? 2 : 1

// ── Recharts dark theme tokens ────────────────────────────────────────
const C = {
  bg:     '#16181C',
  grid:   '#2A2D33',
  text:   '#8A8D95',
  accent: '#00D9B5',
  min:    '#8A7A40',
  over:   '#D94040',
  warn:   '#D97706',
  muted:  '#26292F',
}

const TOOLTIP_STYLE = {
  background: '#1C1E22', border: '0.5px solid #2A2D33',
  borderRadius: 8, fontSize: 12, color: '#F0EEE9',
}

export default function ReportPage() {
  const { employees, assignments, weekStart, numDays } = useRosterStore()
  const startDate = parseISO(weekStart)

  // ── Computed data ───────────────────────────────────────────────────
  const empData = useMemo(() =>
    employees.map(e => ({
      name:   e.name.split(' ')[0],
      full:   e.name,
      hours:  calcEmployeeHours(e.id, assignments),
      nights: calcEmployeeNights(e.id, assignments),
      target: e.nightTarget ?? 2,
    })).sort((a, b) => b.hours - a.hours),
    [employees, assignments]
  )

  const stats = useMemo(() => {
    const totalHours   = empData.reduce((s, e) => s + e.hours, 0)
    const atMin        = empData.filter(e => e.hours >= MIN_HOURS_PER_WEEK).length
    const overMax      = empData.filter(e => e.hours > MAX_HOURS_PER_WEEK).length
    const totalSlots   = numDays * SHIFTS.reduce((s, sh) => s + REQUIRED(sh.key), 0)
    const filledSlots  = Object.values(assignments).reduce((s, ids) => s + ids.length, 0)
    const coverage     = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0
    const nightsMet    = empData.filter(e => e.nights >= e.target).length
    return { totalHours, atMin, overMax, coverage, nightsMet, totalSlots, filledSlots }
  }, [empData, assignments, numDays])

  // Shift distribution data for pie
  const shiftPieData = useMemo(() =>
    SHIFTS.map(sh => {
      const filled = Array.from({ length: numDays }, (_, d) => (assignments[`${d}-${sh.key}`] || []).length)
        .reduce((s, c) => s + c, 0)
      const total  = numDays * REQUIRED(sh.key)
      return { name: sh.label, filled, total, pct: total > 0 ? Math.round((filled / total) * 100) : 0 }
    }),
    [assignments, numDays]
  )

  // Day-by-day total hours (stacked by shift)
  const dailyData = useMemo(() =>
    Array.from({ length: numDays }, (_, d) => {
      const day = { day: DAYS_SHORT[d], date: format(addDays(startDate, d), 'MMM d') }
      SHIFTS.forEach(sh => {
        day[sh.key] = (assignments[`${d}-${sh.key}`] || []).length * sh.hours
      })
      return day
    }),
    [assignments, numDays, startDate]
  )

  if (employees.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: '#5A5D65' }}>
        <div className="text-center">
          <p className="text-sm font-medium mb-1">No data to report</p>
          <p className="text-xs">Add employees and run Auto-Schedule first</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ background: '#0E0F11' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="anim-fade d-0">
        <h1 className="font-display text-lg font-light" style={{ color: '#F0EEE9' }}>
          Weekly Report
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#5A5D65' }}>
          {format(startDate, 'MMM d')} – {format(addDays(startDate, numDays - 1), 'MMM d, yyyy')}
          {' · '}{employees.length} employees
        </p>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 anim-rise d-1">
        <KpiCard label="Total Hours"     value={`${stats.totalHours}h`}    sub={`across ${employees.length} staff`} color={C.accent} />
        <KpiCard label="Coverage"        value={`${stats.coverage}%`}      sub={`${stats.filledSlots}/${stats.totalSlots} slots`} color={stats.coverage >= 90 ? C.accent : C.warn} />
        <KpiCard label="Hours Met (≥32h)" value={`${stats.atMin}/${employees.length}`} sub="employees above minimum" color={stats.atMin === employees.length ? C.accent : C.warn} />
        <KpiCard label="Nights Met"      value={`${stats.nightsMet}/${employees.length}`} sub="at target night shifts" color={stats.nightsMet === employees.length ? C.accent : C.warn} />
      </div>

      {/* ── Employee Hours Bar ──────────────────────────────────────── */}
      <Card title="Employee Hours" subtitle={`Min ${MIN_HOURS_PER_WEEK}h · Max ${MAX_HOURS_PER_WEEK}h`} delay="d-2">
        <ResponsiveContainer width="100%" height={empData.length * 44 + 20}>
          <BarChart data={empData} layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke={C.grid} strokeWidth={0.5} />
            <XAxis type="number" domain={[0, 50]} tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#F0EEE9', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v, _, { payload }) => [`${payload.hours}h`, payload.full]}
              cursor={{ fill: '#2A2D3340' }}
            />
            <ReferenceLine x={MIN_HOURS_PER_WEEK} stroke={C.min}  strokeDasharray="3 3" strokeWidth={1} label={{ value: '32h min', position: 'top', fill: C.min, fontSize: 10 }} />
            <ReferenceLine x={MAX_HOURS_PER_WEEK} stroke={C.over} strokeDasharray="3 3" strokeWidth={1} label={{ value: '45h max', position: 'top', fill: C.over, fontSize: 10 }} />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {empData.map((e, i) => (
                <Cell key={i} fill={e.hours > MAX_HOURS_PER_WEEK ? C.over : e.hours < MIN_HOURS_PER_WEEK ? C.warn : C.accent} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Night Shifts + Shift Coverage ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Night shifts per employee */}
        <Card title="Night Shifts" subtitle="Target: 2 per employee" delay="d-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={empData} margin={{ left: -10, right: 10, top: 4, bottom: 20 }}>
              <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={0.5} />
              <XAxis dataKey="name" tick={{ fill: C.text, fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 4]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} nights`]} cursor={{ fill: '#2A2D3340' }} />
              <ReferenceLine y={2} stroke={C.accent} strokeDasharray="3 3" strokeWidth={1} />
              <Bar dataKey="nights" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {empData.map((e, i) => (
                  <Cell key={i} fill={e.nights >= e.target ? C.accent : e.nights > 0 ? C.warn : C.over} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Shift coverage donut */}
        <Card title="Shift Coverage" subtitle="Filled vs required slots" delay="d-3">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={shiftPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="filled" nameKey="name" paddingAngle={2}>
                {shiftPieData.map((entry, i) => (
                  <Cell key={i} fill={SHIFT_BAR_COLOR[SHIFTS[i].key]} opacity={entry.pct >= 100 ? 1 : 0.5} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(v, name, { payload }) => [`${v}/${payload.total} (${payload.pct}%)`, name]} />
              <Legend
                formatter={(v, entry) => {
                  const pct = entry?.payload?.pct ?? 0
                  return <span style={{ color: '#8A8D95', fontSize: 11 }}>{v} {pct}%</span>
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Daily Hours Stacked ─────────────────────────────────────── */}
      <Card title="Daily Hours by Shift" subtitle="Hours generated each day per shift type" delay="d-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={0.5} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}h`]} cursor={{ fill: '#2A2D3340' }} />
            <Legend formatter={v => <span style={{ color: '#8A8D95', fontSize: 11 }}>{v}</span>} />
            {SHIFTS.filter(s => s.key !== 'Backup').map(sh => (
              <Bar key={sh.key} dataKey={sh.key} stackId="a" fill={SHIFT_BAR_COLOR[sh.key]}
                name={sh.label} radius={sh.key === 'Backup' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Coverage Heatmap ────────────────────────────────────────── */}
      <Card title="Coverage Heatmap" subtitle="Filled / Required per shift per day" delay="d-5">
        <div className="overflow-x-auto">
          <table style={{ borderCollapse: 'separate', borderSpacing: '4px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 80, fontSize: 11, color: C.text, textAlign: 'left', paddingBottom: 6 }}>Shift</th>
                {Array.from({ length: numDays }, (_, i) => {
                  const d = addDays(startDate, i)
                  return (
                    <th key={i} style={{ fontSize: 11, color: C.text, fontWeight: 500, paddingBottom: 6, minWidth: 52 }}>
                      <div>{DAYS_SHORT[i]}</div>
                      <div style={{ color: '#5A5D65', fontSize: 10 }}>{format(d, 'd')}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {SHIFTS.map((sh, si) => (
                <tr key={sh.key} className={`anim-rise d-${si + 1}`}>
                  <td style={{ fontSize: 11, color: '#F0EEE9', paddingRight: 8, whiteSpace: 'nowrap', paddingBottom: 4 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 1, background: SHIFT_BAR_COLOR[sh.key], marginRight: 6, verticalAlign: 'middle' }} />
                    {sh.label}
                  </td>
                  {Array.from({ length: numDays }, (_, d) => {
                    const count    = (assignments[`${d}-${sh.key}`] || []).length
                    const required = REQUIRED(sh.key)
                    const isFull   = count >= required
                    const isEmpty  = count === 0
                    const bg       = isEmpty ? '#D9404022' : isFull ? '#00D9B522' : '#D9740022'
                    const color    = isEmpty ? '#D94040'   : isFull ? '#00D9B5'   : '#D97406'
                    const names    = (assignments[`${d}-${sh.key}`] || [])
                      .map(id => employees.find(e => e.id === id)?.name.split(' ')[0] || '')
                      .join(', ')
                    return (
                      <td key={d} title={names || 'Empty'} style={{
                        height: 36, borderRadius: 6, background: bg,
                        textAlign: 'center', fontSize: 11, fontWeight: 600, color,
                        border: `0.5px solid ${color}30`, cursor: 'default',
                        transition: 'background 150ms ease',
                      }}>
                        {count}/{required}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#16181C', border: '0.5px solid #2A2D33' }}>
      <p style={{ fontSize: 10, color: '#5A5D65', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: '#5A5D65', marginTop: 4 }}>{sub}</p>
    </div>
  )
}

function Card({ title, subtitle, delay, children }) {
  return (
    <div className={`rounded-xl p-5 anim-rise ${delay}`}
      style={{ background: '#16181C', border: '0.5px solid #2A2D33' }}>
      <div className="mb-4">
        <p className="text-sm font-medium" style={{ color: '#F0EEE9' }}>{title}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#5A5D65' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
