import { useState, useEffect, useRef } from 'react'
import { X, MessageSquare, Send, RefreshCw, Check, AlertTriangle, Bot, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { format, parseISO, addDays } from 'date-fns'
import useRosterStore from '../store/rosterStore'
import { ollamaChat, pingOllama, listModels } from '../utils/ollama'
import { SHIFTS, SHIFT_HOURS } from '../utils/constants'
import { calcEmployeeHours } from '../utils/rosterEngine'

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const EXAMPLE_QUESTIONS = [
  'Who can cover Shift B on Friday if Shihara is sick?',
  'Which employees are under 32 hours this week?',
  'Who is available for an extra shift on Sunday?',
  'Suggest a swap if Uminda wants Saturday off',
]

export default function AIPanel({ onClose }) {
  const { employees, rules, assignments, weekStart, numDays, ollamaModel, addChatMessage, clearChat, chatHistory } = useRosterStore()

  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [ollamaOk, setOllamaOk] = useState(null)
  const [streamText, setStream] = useState('')
  const chatEndRef = useRef()

  useEffect(() => { checkOllama() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, streamText])

  async function checkOllama() {
    setOllamaOk(null)
    setOllamaOk(await pingOllama())
  }

  // Build a rich context snapshot for the AI
  const weekLabel = (() => {
    const s = parseISO(weekStart)
    return `${format(s, 'MMM d')} – ${format(addDays(s, numDays - 1), 'MMM d, yyyy')}`
  })()

  function buildSystemPrompt() {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    // Employee summary with hours and current assignments
    const empSummary = employees.map(e => {
      const h = calcEmployeeHours(e.id, assignments)
      const assignedCells = Object.entries(assignments)
        .filter(([, ids]) => ids.includes(e.id))
        .map(([key]) => {
          const dash = key.indexOf('-')
          const d    = parseInt(key.slice(0, dash))
          const sk   = key.slice(dash + 1)
          return `${dayNames[d]} ${SHIFTS.find(s => s.key === sk)?.label || sk}`
        })
      const prefShifts = e.shifts.length ? e.shifts.join(',') : 'Any'
      const availDays  = e.days.length   ? e.days.map(d => dayNames[d]).join(',') : 'Any'
      const offDays    = [0,1,2,3,4,5,6].filter(d => !e.days.includes(d)).map(d => dayNames[d])

      return [
        `${e.name}:`,
        `  Scheduled ${h}h/week (min 32h, max 45h)`,
        `  Prefers: ${prefShifts} | Days off: ${offDays.join(',') || 'none'}`,
        assignedCells.length ? `  Assigned: ${assignedCells.join(', ')}` : '  Not yet assigned',
      ].join('\n')
    }).join('\n')

    const rulesSummary = rules.map(r => `- ${r.text}`).join('\n')

    return `You are a helpful workforce scheduling assistant for a team roster.

WEEK: ${weekLabel}
SHIFTS:
  A = Onsite Day  8AM-5PM  (8h)
  B = Onsite Night 5PM-8AM (15h)  ← overnight
  C = Remote Early 5AM-1PM (8h)
  D = Remote Afternoon 1PM-9PM (8h)
  E = Remote Night 9PM-5AM (8h, needs 2 staff)
  Backup = On-call (8h)

HOUR LIMITS: min 32h/week, max 45h/week per employee

SCHEDULING RULES:
${rulesSummary}

CURRENT EMPLOYEE STATUS:
${empSummary}

Answer concisely and practically. Suggest real employee names when making recommendations. If asked about availability, check their days-off and hour limits.`
  }

  async function sendChat() {
    const msg = input.trim()
    if (!msg || sending) return
    setInput('')
    addChatMessage({ role: 'user', content: msg })

    if (!ollamaOk) {
      addChatMessage({ role: 'assistant', content: '⚠️ Ollama is offline. Start Ollama on your machine to use the chat assistant.' })
      return
    }

    setSending(true)
    setStream('')
    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ...chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: msg },
      ]
      let full = ''
      await ollamaChat(ollamaModel, messages, (_, acc) => { full = acc; setStream(acc) })
      addChatMessage({ role: 'assistant', content: full || '(no response)' })
      setStream('')
    } catch (e) {
      addChatMessage({ role: 'assistant', content: `Error: ${e.message}` })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-primary-900/20 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-md bg-white border-l-2 border-primary-100 flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cta-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Scheduling Assistant</p>
              <p className="text-[10px] text-primary-400 font-semibold mt-0.5">Ask anything about this week's roster</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <OllamaStatus ok={ollamaOk} onRecheck={checkOllama} />
            <button onClick={onClose} className="p-1.5 text-primary-400 hover:text-white rounded-lg transition-colors cursor-pointer">
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Offline notice */}
        {ollamaOk === false && (
          <div className="bg-red-50 border-b-2 border-red-200 px-4 py-3">
            <p className="text-xs font-bold text-red-700">Ollama is not running</p>
            <p className="text-[11px] text-red-600 font-semibold mt-0.5">
              Install Ollama → run <code className="bg-red-100 px-1 rounded">ollama pull llama3.2</code> → restart the app.
            </p>
          </div>
        )}

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatHistory.length === 0 && !streamText && (
            <EmptyState questions={EXAMPLE_QUESTIONS} onPick={setInput} />
          )}
          {chatHistory.map((msg, i) => <Bubble key={i} msg={msg} />)}
          {streamText && <Bubble msg={{ role: 'assistant', content: streamText }} streaming />}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t-2 border-primary-100 space-y-2">
          <div className="flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Ask about the roster…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              disabled={sending}
            />
            <button
              onClick={sendChat}
              disabled={!input.trim() || sending}
              className="btn-primary px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2.5} />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-primary-400 font-semibold">
              Powered by Ollama (local) · Model: {ollamaModel}
            </p>
            <button
              onClick={() => { clearChat(); setStream('') }}
              className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-600 font-semibold transition-colors cursor-pointer"
            >
              <Trash2 size={10} /> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function OllamaStatus({ ok, onRecheck }) {
  return (
    <button onClick={onRecheck} className="flex items-center gap-1 cursor-pointer" title="Check Ollama connection">
      {ok === null && <span className="text-[10px] text-primary-400 font-semibold">Checking…</span>}
      {ok === true  && <span className="flex items-center gap-1 text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded-md font-bold"><Check size={9} strokeWidth={3} /> Online</span>}
      {ok === false && <span className="flex items-center gap-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-bold"><AlertTriangle size={9} /> Offline</span>}
      <RefreshCw size={11} className="text-primary-500 hover:text-white transition-colors ml-0.5" />
    </button>
  )
}

function Bubble({ msg, streaming }) {
  const isUser = msg.role === 'user'
  return (
    <div className={clsx('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={12} className="text-white" />
        </div>
      )}
      <div className={clsx(
        'max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap font-medium',
        isUser
          ? 'bg-primary-600 text-white rounded-tr-sm'
          : 'bg-primary-50 text-primary-900 border-2 border-primary-100 rounded-tl-sm',
        streaming && 'after:content-["▋"] after:animate-pulse after:ml-0.5 after:text-primary-400'
      )}>
        {msg.content}
      </div>
    </div>
  )
}

function EmptyState({ questions, onPick }) {
  return (
    <div className="text-center py-6 px-3">
      <div className="w-14 h-14 bg-primary-50 border-2 border-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <MessageSquare size={24} className="text-primary-400" strokeWidth={2} />
      </div>
      <p className="text-sm font-bold text-primary-800">Scheduling Assistant</p>
      <p className="text-xs text-primary-500 font-semibold mt-1">
        Ask me anything about this week's roster — availability, swaps, coverage gaps.
      </p>
      <div className="mt-5 space-y-2 text-left">
        {questions.map(q => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="w-full text-left text-xs p-2.5 rounded-xl bg-primary-50 border-2 border-primary-100 text-primary-700 font-semibold hover:border-primary-300 hover:bg-primary-100 transition-colors duration-150 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
