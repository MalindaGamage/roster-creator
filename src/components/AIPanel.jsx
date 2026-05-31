import { useState, useEffect, useRef } from 'react'
import { X, Terminal, Send, RefreshCw, Check, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { format, parseISO, addDays } from 'date-fns'
import toast from 'react-hot-toast'
import useRosterStore from '../store/rosterStore'
import { ollamaChat, pingOllama } from '../utils/ollama'
import { SHIFTS, SHIFT_HOURS } from '../utils/constants'
import { calcEmployeeHours, calcEmployeeNights } from '../utils/rosterEngine'

const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const SUGGESTIONS = [
  'Who has hours left for an extra shift?',
  'Who can cover Shift B if Shihara is sick on Friday?',
  'Which employees are under 32 hours?',
  'Suggest a swap if Uminda wants Saturday off',
]

export default function AIPanel({ onClose }) {
  const { employees, rules, assignments, weekStart, numDays, ollamaModel, addChatMessage, clearChat, chatHistory } = useRosterStore()
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const [online, setOnline]   = useState(null)
  const [stream, setStream]   = useState('')
  const endRef   = useRef()
  const inputRef = useRef()

  useEffect(() => { pingOllama().then(setOnline) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, stream])

  const weekLabel = (() => {
    const s = parseISO(weekStart)
    return `${format(s, 'MMM d')} – ${format(addDays(s, numDays - 1), 'MMM d, yyyy')}`
  })()

  function buildSystemPrompt() {
    const empSummary = employees.map(e => {
      const h = calcEmployeeHours(e.id, assignments)
      const n = calcEmployeeNights(e.id, assignments)
      const cells = Object.entries(assignments)
        .filter(([, ids]) => ids.includes(e.id))
        .map(([k]) => { const dash = k.indexOf('-'); return `${DAY_SHORT[parseInt(k.slice(0, dash))]}-${k.slice(dash + 1)}` })
      const pref = e.shifts.length ? e.shifts.join(',') : 'any'
      return `${e.name}: ${h}h ${n}nights prefer=${pref} scheduled=${cells.join(',') || 'none'}`
    }).join('\n')

    return `You are a concise workforce scheduling assistant for week ${weekLabel}.
Shifts: A=OnSite-Day(8h) B=OnSite-Night(15h) C=Remote-Early(8h) D=Remote-Afternoon(8h) E=Remote-Night(8h,2staff) Backup(8h)
Hour limits: min 32h max 45h. One shift/day. 2 nights/employee target.
Rules: ${rules.map(r => r.text).join(' | ')}
Employee status:
${empSummary}
Answer in 1-3 concise sentences. Use real names.`
  }

  async function send() {
    const msg = input.trim()
    if (!msg || sending) return
    setInput('')
    addChatMessage({ role: 'user', content: msg })
    if (!online) {
      addChatMessage({ role: 'assistant', content: 'OFFLINE: Ollama is not running. Start Ollama on localhost:11434.' })
      return
    }
    setSending(true); setStream('')
    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ...chatHistory.slice(-8),
        { role: 'user', content: msg },
      ]
      let full = ''
      await ollamaChat(ollamaModel, messages, (_, acc) => { full = acc; setStream(acc) })
      addChatMessage({ role: 'assistant', content: full || '(no response)' })
      setStream('')
    } catch (e) {
      addChatMessage({ role: 'assistant', content: `ERROR: ${e.message}` })
    } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose} />

      <div
        className="flex flex-col h-full"
        style={{ width: 420, background: '#0B0C0E', borderLeft: '0.5px solid #2A2D33' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '0.5px solid #1C1E22' }}
        >
          <div className="flex items-center gap-2">
            <Terminal size={15} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <div>
              <p className="text-sm font-medium font-mono" style={{ color: '#F0EEE9' }}>
                <span style={{ color: '#00D9B5' }}>›</span> scheduling_assistant
              </p>
              <p className="text-2xs font-mono" style={{ color: '#5A5D65' }}>
                model: {ollamaModel} · ollama:11434
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {online === true  && <span className="text-2xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#00D9B510', color: '#00D9B5', border: '0.5px solid #00D9B530' }}>online</span>}
            {online === false && <span className="text-2xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#3A1010', color: '#D94040', border: '0.5px solid #D9404030' }}>offline</span>}
            {online === null  && <span className="text-2xs font-mono" style={{ color: '#5A5D65' }}>checking…</span>}
            <button onClick={onClose} className="btn-icon"><X size={14} strokeWidth={1.5} /></button>
          </div>
        </div>

        {/* Offline notice */}
        {online === false && (
          <div className="px-4 py-2 flex-shrink-0" style={{ background: '#130A0A', borderBottom: '0.5px solid #3A1010' }}>
            <p className="text-xs font-mono" style={{ color: '#D94040' }}>
              $ ollama pull llama3.2 && ollama serve
            </p>
          </div>
        )}

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 font-mono">
          {chatHistory.length === 0 && !stream && (
            <EmptyState onPick={setInput} />
          )}
          {chatHistory.map((msg, i) => <Message key={i} msg={msg} />)}
          {stream && <Message msg={{ role: 'assistant', content: stream }} streaming />}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '0.5px solid #1C1E22' }}>
          <div className="flex items-center gap-2">
            {/* Prompt prefix */}
            <span className="text-sm font-mono flex-shrink-0" style={{ color: '#00D9B5' }}>›</span>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-sm font-mono outline-none terminal-input"
              style={{ color: '#F0EEE9', caretColor: '#00D9B5' }}
              placeholder="ask a question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={sending}
            />
            <button onClick={send} disabled={!input.trim() || sending} className="btn-icon disabled:opacity-30">
              {sending
                ? <RefreshCw size={13} strokeWidth={1.5} className="animate-spin" />
                : <Send size={13} strokeWidth={1.5} />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xs font-mono" style={{ color: '#3A3D45' }}>
              Week: {weekLabel}
            </p>
            <button onClick={() => { clearChat(); setStream('') }}
              className="text-2xs font-mono transition-colors duration-150"
              style={{ color: '#3A3D45' }}
              onMouseEnter={e => e.currentTarget.style.color = '#8A8D95'}
              onMouseLeave={e => e.currentTarget.style.color = '#3A3D45'}
            >
              clear history
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Message({ msg, streaming }) {
  const isUser = msg.role === 'user'
  return (
    <div className={clsx('text-xs font-mono', isUser ? 'text-right' : '')}>
      {isUser ? (
        <div className="inline-block text-left">
          <span style={{ color: '#5A5D65' }}>[you] </span>
          <span style={{ color: '#F0EEE9' }}>{msg.content}</span>
        </div>
      ) : (
        <div>
          <div className="mb-0.5 text-2xs" style={{ color: '#3A3D45' }}>
            [ai] ›
          </div>
          <div
            className="rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap"
            style={{ background: '#16181C', color: '#F0EEE9', border: '0.5px solid #2A2D33' }}
          >
            {msg.content}
            {streaming && <span className="terminal-cursor" />}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ onPick }) {
  return (
    <div className="py-6">
      <p className="text-xs font-mono mb-1" style={{ color: '#00D9B5' }}>scheduling_assistant v1.0</p>
      <p className="text-xs font-mono mb-4" style={{ color: '#3A3D45' }}>
        # context: employees, hours, assignments, rules loaded
      </p>
      <p className="text-2xs font-mono mb-2" style={{ color: '#5A5D65' }}>// suggested queries</p>
      {SUGGESTIONS.map(q => (
        <button
          key={q}
          onClick={() => onPick(q)}
          className="block w-full text-left text-xs font-mono mb-1.5 px-2 py-1.5 rounded transition-all duration-150"
          style={{ color: '#8A8D95', background: '#16181C', border: '0.5px solid #2A2D33' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F0EEE9'; e.currentTarget.style.borderColor = '#00D9B530' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8D95'; e.currentTarget.style.borderColor = '#2A2D33' }}
        >
          <span style={{ color: '#00D9B5' }}>›</span> {q}
        </button>
      ))}
    </div>
  )
}
