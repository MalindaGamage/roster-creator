import {
  BookMarked, CheckCircle, AlertTriangle, Zap, MessageSquare,
  Users, Download, Cpu, Info, Moon, ChevronRight,
} from 'lucide-react'

/* ─── tiny helpers ─────────────────────────────────────── */
const C = {
  bg:      '#0E0F11',
  card:    '#16181C',
  card2:   '#1C1E22',
  card3:   '#26292F',
  border:  '#2A2D33',
  border2: '#3A3D45',
  text:    '#F0EEE9',
  muted:   '#8A8D95',
  subtle:  '#5A5D65',
  accent:  '#00D9B5',
  code:    '#0B0C0E',
}

function Card({ children, delay = 1, style = {} }) {
  return (
    <div
      className={`anim-rise d-${delay}`}
      style={{
        background: C.card,
        border: `0.5px solid ${C.border}`,
        borderRadius: 12,
        padding: '24px 28px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: C.accent,
      marginBottom: 12,
    }}>
      {children}
    </p>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      {Icon && <Icon size={18} color={C.accent} strokeWidth={1.5} />}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>
        {children}
      </h2>
    </div>
  )
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 13,
        color: C.text,
      }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: C.muted,
                borderBottom: `0.5px solid ${C.border}`,
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: `0.5px solid ${C.border}` }}
            >
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '10px 12px',
                  color: j === 0 ? C.accent : C.text,
                  fontWeight: j === 0 ? 600 : 400,
                  verticalAlign: 'top',
                  lineHeight: 1.5,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RuleItem({ children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0' }}>
      <ChevronRight size={14} color={C.accent} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>{children}</span>
    </div>
  )
}

function Pill({ children, color = C.accent }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      background: color + '1A',
      color: color,
      border: `0.5px solid ${color}40`,
    }}>
      {children}
    </span>
  )
}

/* ─── main component ───────────────────────────────────── */
export default function GuidelinesPage() {
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: C.bg,
        padding: '24px 20px 48px',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page Header ─────────────────────────────── */}
        <div className="anim-rise d-1" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: C.accent + '18',
            border: `0.5px solid ${C.accent}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <BookMarked size={20} color={C.accent} strokeWidth={1.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Guidelines</h1>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, marginTop: 2 }}>
              How to use Roster Creator — from setup to export
            </p>
          </div>
        </div>

        {/* ── Section 1: Overview ─────────────────────── */}
        <Card delay={2}>
          <SectionLabel>Section 1</SectionLabel>
          <SectionTitle icon={Info}>Overview</SectionTitle>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.75, marginBottom: 14 }}>
            <strong style={{ color: C.accent }}>Roster Creator</strong> is a browser-based shift scheduling tool
            designed to automate weekly roster generation for small operational teams. It handles shift assignment,
            hour tracking, constraint enforcement, and Excel export — all without an account or server.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              flex: '1 1 220px',
              background: C.card2,
              border: `0.5px solid ${C.border}`,
              borderRadius: 8,
              padding: '14px 16px',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>What it does</p>
              <ul style={{ margin: 0, paddingLeft: 16, color: C.text, fontSize: 13, lineHeight: 1.8 }}>
                <li>Auto-schedules employees across 6 shift types</li>
                <li>Enforces hours, rest periods, and night-shift rules</li>
                <li>Parses WhatsApp manager messages into schedule changes</li>
                <li>Exports a formatted Excel roster file</li>
              </ul>
            </div>
            <div style={{
              flex: '1 1 220px',
              background: C.card2,
              border: `0.5px solid ${C.border}`,
              borderRadius: 8,
              padding: '14px 16px',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Who it's for</p>
              <ul style={{ margin: 0, paddingLeft: 16, color: C.text, fontSize: 13, lineHeight: 1.8 }}>
                <li>Team leads managing shift rosters</li>
                <li>Operations managers in 24/7 environments</li>
                <li>Teams that share schedules via WhatsApp</li>
                <li>Anyone who needs a zero-login scheduling tool</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* ── Section 2: Weekly Workflow ───────────────── */}
        <Card delay={2}>
          <SectionLabel>Section 2 — Most Important</SectionLabel>
          <SectionTitle icon={Zap}>Weekly Workflow</SectionTitle>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Follow these steps every week to generate and export your roster.
          </p>

          {[
            {
              n: 1,
              icon: Users,
              title: 'Add Employees',
              tag: 'One-time setup',
              desc: 'Open the Employees panel. Click the ≡ icon to bulk-add employee names (one per line), or use Import → CSV / Google Sheets. You only need to do this once — employees are saved in localStorage.',
            },
            {
              n: 2,
              icon: MessageSquare,
              title: 'Paste WhatsApp Messages',
              tag: 'Weekly',
              desc: 'Click "Chat Import" in the sidebar. Paste the raw manager messages from your WhatsApp group into the text area. Multiple messages can be pasted at once.',
            },
            {
              n: 3,
              icon: CheckCircle,
              title: 'Parse Messages',
              tag: 'Weekly',
              desc: 'Click the "Parse Messages" button. Review the parsed preview to confirm shifts and days were detected correctly. Each detected instruction appears as a coloured row.',
            },
            {
              n: 4,
              icon: Zap,
              title: 'Apply & Fill Full Roster',
              tag: 'Critical step',
              tagColor: '#F59E0B',
              desc: 'Click "Apply & Fill Full Roster" — NOT "Apply Specific Only". This applies the parsed preferences AND runs the auto-scheduler to fill every remaining slot.',
            },
            {
              n: 5,
              icon: CheckCircle,
              title: 'Review & Adjust',
              tag: 'Optional',
              desc: 'On desktop: drag employees from the panel into roster cells. Click × on any assigned name to remove them. The hour counter updates in real time.',
            },
            {
              n: 6,
              icon: Download,
              title: 'Export',
              tag: 'Final step',
              desc: 'Click "Export Excel" in the sidebar. A file named Roster_YYYY-MM-DD.xlsx downloads immediately, formatted to match the standard roster template.',
            },
          ].map(({ n, icon: Icon, title, tag, tagColor, desc }) => (
            <div key={n} style={{
              display: 'flex',
              gap: 16,
              padding: '16px 0',
              borderBottom: n < 6 ? `0.5px solid ${C.border}` : 'none',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: C.accent + '1A',
                border: `1.5px solid ${C.accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 700, fontSize: 15,
                color: C.accent,
              }}>
                {n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <Icon size={14} color={C.accent} strokeWidth={1.5} />
                  <span style={{ fontWeight: 600, fontSize: 14.5, color: C.text }}>{title}</span>
                  {tag && <Pill color={tagColor || C.accent}>{tag}</Pill>}
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: C.muted, lineHeight: 1.7 }}>{desc}</p>
              </div>
            </div>
          ))}
        </Card>

        {/* ── Section 3: WhatsApp Patterns ────────────── */}
        <Card delay={3}>
          <SectionLabel>Section 3</SectionLabel>
          <SectionTitle icon={MessageSquare}>Supported WhatsApp Message Patterns</SectionTitle>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
            Paste messages exactly as received. The parser is flexible — it handles varied spelling, punctuation, and ordering.
          </p>

          {/* Terminal block */}
          <div style={{
            background: C.code,
            border: `0.5px solid ${C.border}`,
            borderRadius: 8,
            padding: '16px 18px',
            marginBottom: 20,
            overflowX: 'auto',
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
                <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
              ))}
            </div>
            {[
              'Haribabuji - 3rd & 7th shift E, 5th - shiftD, 6th -shift C',
              'Shihara onsite night shifts on 5th and 6th',
              'Lakshitha - Need to free 1st and 3rd',
              'Ravishka - Need onsite night shift on 4th and free on 7th',
              'Uminda - need to free on 7th, No Onsite night shifts',
              'Other 6 employees: available for any shift',
            ].map((line, i) => (
              <div key={i} style={{
                fontFamily: 'monospace',
                fontSize: 12.5,
                color: i === 5 ? C.muted : C.text,
                lineHeight: 1.9,
                whiteSpace: 'nowrap',
              }}>
                <span style={{ color: C.subtle, marginRight: 10, userSelect: 'none' }}>$</span>
                {line}
              </div>
            ))}
          </div>

          <Table
            headers={['Pattern', 'Example', 'Description']}
            rows={[
              ['Specific shift on date', 'shift E on 5th', 'Assigns named shift on that day'],
              ['Shorthand shift code', '5th - shiftD', 'Shift key D, E, A, B, C, or Backup'],
              ['Onsite night', 'onsite night shift on 4th', 'Maps to Shift B (5PM–8AM)'],
              ['Free day', 'Need to free 1st and 3rd', 'Employee unavailable those days'],
              ['No night shifts', 'No Onsite night shifts', 'Excludes Shift B for the week'],
              ['Multiple dates', '3rd & 7th shift E', 'Same shift across multiple days'],
              ['Any shift', 'available for any shift', 'No constraints — fill as needed'],
            ]}
          />
        </Card>

        {/* ── Section 4: Shift Reference ───────────────── */}
        <Card delay={3}>
          <SectionLabel>Section 4</SectionLabel>
          <SectionTitle icon={Moon}>Shift Reference</SectionTitle>
          <Table
            headers={['Key', 'Name', 'Hours', 'Type', 'Staff Needed']}
            rows={[
              ['A', 'Shift A', '8h', 'Onsite Day — 8AM to 5PM', '1'],
              ['B', 'Shift B', '15h', 'Onsite Night — 5PM to 8AM', '1'],
              ['C', 'Shift C', '8h', 'Remote Early — 5AM to 1PM', '1'],
              ['D', 'Shift D', '8h', 'Remote Afternoon — 1PM to 9PM', '1'],
              ['E', 'Shift E', '8h', 'Remote Night — 9PM to 5AM', '2'],
              ['Backup', 'Backup', '0h', 'On-call — not counted toward hours', '1'],
            ]}
          />
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            background: C.accent + '0D',
            border: `0.5px solid ${C.accent}30`,
            borderRadius: 8,
            fontSize: 13,
            color: C.muted,
            lineHeight: 1.6,
          }}>
            <strong style={{ color: C.accent }}>Note:</strong> Shift E is the only shift requiring 2 employees simultaneously.
            Backup shifts count as scheduled but contribute 0 hours to weekly totals.
          </div>
        </Card>

        {/* ── Section 5: Auto-Scheduler Rules ─────────── */}
        <Card delay={4}>
          <SectionLabel>Section 5</SectionLabel>
          <SectionTitle icon={AlertTriangle}>Auto-Scheduler Rules</SectionTitle>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
            These constraints are enforced automatically when running Auto-Schedule or Apply &amp; Fill Full Roster.
          </p>
          <div style={{
            background: C.card2,
            border: `0.5px solid ${C.border}`,
            borderRadius: 8,
            padding: '10px 16px',
          }}>
            {[
              'Min 32h / Max 45h per employee per week',
              'Shift E requires exactly 2 employees per slot; all others require 1',
              'Every employee works exactly 2 night shifts per week (Shift B or E)',
              'No employee works more than 1 shift per day',
              'Max 1 Backup shift per week per employee',
              'Backup hours (0h) are NOT counted toward the 32–45h weekly total',
              'Rest after Shift E (ends 5AM): cannot work Shift A (8AM) or Shift C (5AM) the next day',
              'Rest after Shift B (ends 8AM): full rest day required — only Shift D (afternoon) is allowed next day',
              'No consecutive night shifts auto-assigned (B or E followed by B or E)',
              'Exception: employee-requested consecutive nights via Chat Import are honoured',
            ].map((r, i) => <RuleItem key={i}>{r}</RuleItem>)}
          </div>
        </Card>

        {/* ── Section 6: Employee-Specific Rules ──────── */}
        <Card delay={4}>
          <SectionLabel>Section 6</SectionLabel>
          <SectionTitle icon={Users}>Employee-Specific Rules (Pre-configured)</SectionTitle>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
            Some employees have fixed constraints baked into the scheduler. These override general rules.
          </p>
          <Table
            headers={['Employee', 'Rule']}
            rows={[
              ['Yashodara', 'Primarily assigned to Shift C (Remote Early 5AM–1PM)'],
              ['Lahiru', 'Exactly 1 Shift E per week; remaining shifts filled with Shift A'],
              ['Uminda', 'No Shift B (Onsite Night); compensates with 2 Shift E (Remote Night) instead'],
            ]}
          />
        </Card>

        {/* ── Section 7: AI Chat Assistant ────────────── */}
        <Card delay={5}>
          <SectionLabel>Section 7</SectionLabel>
          <SectionTitle icon={Cpu}>AI Chat Assistant</SectionTitle>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
            Click <strong style={{ color: C.text }}>AI Chat</strong> in the sidebar to open the assistant panel.
            Ask natural-language questions about the current roster — the AI has full context of all assignments and hours.
          </p>

          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Example questions</p>
            <div style={{
              background: C.code,
              border: `0.5px solid ${C.border}`,
              borderRadius: 8,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              {[
                'Who has hours left?',
                'Who can cover Shift B on Friday?',
                'Which employees are under 32h?',
                'Show me the full roster for Wednesday.',
                'Which employees have no night shifts assigned yet?',
              ].map((q, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: 12.5, color: C.text }}>
                  <span style={{ color: C.accent, marginRight: 8 }}>?</span>{q}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: C.card2,
            border: `0.5px solid ${C.border}`,
            borderRadius: 8,
            padding: '14px 16px',
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Setup — Ollama required
            </p>
            {[
              ['1', 'Install Ollama from ollama.com'],
              ['2', 'Run: ollama pull llama3.2'],
              ['3', 'Start Ollama — it runs on localhost:11434 by default'],
              ['4', 'For a deployed/remote URL: set OLLAMA_ORIGINS=* in your environment before starting Ollama'],
            ].map(([n, s]) => (
              <div key={n} style={{ display: 'flex', gap: 10, padding: '5px 0', fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0, width: 16 }}>{n}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Section 8: Import Options ────────────────── */}
        <Card delay={5}>
          <SectionLabel>Section 8</SectionLabel>
          <SectionTitle icon={Users}>Import Options</SectionTitle>
          <Table
            headers={['Method', 'Steps']}
            rows={[
              ['Bulk Add (names)', 'Employee Panel → click ≡ icon → paste names, one per line → confirm'],
              ['CSV Upload', 'Sidebar → Import → Upload CSV tab → select file'],
              ['Google Sheets', 'Sidebar → Import → Google Sheets URL tab → paste public sheet URL'],
              ['Google Form setup', 'Create a form with fields: Name, Employee ID, Preferred Shifts, Available Days, Notes — link the response sheet to Import'],
            ]}
          />
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            background: C.card2,
            border: `0.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            color: C.muted,
            lineHeight: 1.6,
          }}>
            <strong style={{ color: C.text }}>Google Sheets requirement:</strong> the sheet must be publicly accessible
            (Share → Anyone with the link → Viewer). The URL can be the normal browser URL or the sheet's published CSV link.
          </div>
        </Card>

        {/* ── Section 9: Export ────────────────────────── */}
        <Card delay={6}>
          <SectionLabel>Section 9</SectionLabel>
          <SectionTitle icon={Download}>Export</SectionTitle>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              flex: '1 1 220px',
              background: C.card2,
              border: `0.5px solid ${C.border}`,
              borderRadius: 8,
              padding: '14px 16px',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>How to export</p>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8 }}>
                Click <strong>Export Excel</strong> in the sidebar.<br />
                A file named <span style={{ fontFamily: 'monospace', color: C.accent, fontSize: 12 }}>Roster_YYYY-MM-DD.xlsx</span> downloads immediately.
              </div>
            </div>
            <div style={{
              flex: '1 1 220px',
              background: C.card2,
              border: `0.5px solid ${C.border}`,
              borderRadius: 8,
              padding: '14px 16px',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Format</p>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8 }}>
                The exported file matches the original roster template — dates as columns, shift rows, employee names in cells, and hour totals per employee.
              </div>
            </div>
          </div>
        </Card>

        {/* ── Section 10: Tips & Keyboard Shortcuts ───── */}
        <Card delay={6}>
          <SectionLabel>Section 10</SectionLabel>
          <SectionTitle icon={CheckCircle}>Tips &amp; Keyboard Shortcuts</SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {[
              { label: 'Persistent data', tip: 'All data is stored in localStorage — no account or server needed.' },
              { label: 'Navigate weeks', tip: 'Use ← → arrow buttons in the TopBar to move between weeks.' },
              { label: 'Drag to assign', tip: 'Drag an employee chip from the panel onto any roster cell (desktop).' },
              { label: 'Tap to assign', tip: 'On mobile: tap an employee → then tap a cell to assign them.' },
              { label: 'Remove assignment', tip: 'Click the × button on any assigned employee chip in a cell.' },
              { label: 'Clear roster', tip: 'Settings → Clear Entire Roster to start fresh for the week.' },
              { label: 'Re-run scheduler', tip: 'Click Auto-Schedule anytime to fill remaining empty slots.' },
              { label: 'Hours counter', tip: 'The employee panel shows live hour totals. Red = under/over limits.' },
            ].map(({ label, tip }) => (
              <div key={label} style={{
                background: C.card2,
                border: `0.5px solid ${C.border}`,
                borderRadius: 8,
                padding: '12px 14px',
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>{tip}</p>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}
