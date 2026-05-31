import { useState } from 'react'
import { X, Settings, Check, AlertTriangle, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import useRosterStore from '../store/rosterStore'
import { pingOllama, listModels } from '../utils/ollama'

export default function SettingsModal({ onClose }) {
  const { numDays, setNumDays, ollamaModel, setOllamaModel, clearRoster } = useRosterStore()
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState(null) // null | 'ok' | 'fail'
  const [models, setModels] = useState([])
  const [confirmClear, setConfirmClear] = useState(false)

  async function testOllama() {
    setTesting(true); setStatus(null)
    try {
      const ok = await pingOllama()
      if (ok) {
        const ms = await listModels()
        setModels(ms); setStatus('ok')
        toast.success(`Connected — ${ms.length} model(s) available`)
      } else {
        setStatus('fail')
        toast.error('Cannot reach Ollama on localhost:11434')
      }
    } catch (e) {
      setStatus('fail'); toast.error(e.message)
    } finally { setTesting(false) }
  }

  function handleClearRoster() {
    if (!confirmClear) { setConfirmClear(true); return }
    clearRoster(); setConfirmClear(false)
    toast.success('Roster cleared')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm">
      <div className="card w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-primary-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Settings size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-bold text-primary-900">Settings</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* ── Roster ─────────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-3">Roster</p>
            <div>
              <label className="label">Days per week</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { n: 6, label: '6 days', sub: 'Mon – Sat' },
                  { n: 7, label: '7 days', sub: 'Mon – Sun' },
                ].map(({ n, label, sub }) => (
                  <button
                    key={n}
                    onClick={() => setNumDays(n)}
                    className={clsx(
                      'rounded-xl border-2 py-3 text-center transition-all duration-150 cursor-pointer',
                      numDays === n
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'bg-white border-primary-200 text-primary-700 hover:border-primary-400'
                    )}
                  >
                    <p className="text-sm font-bold">{label}</p>
                    <p className={clsx('text-[11px] font-semibold', numDays === n ? 'text-primary-200' : 'text-primary-400')}>
                      {sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Ollama ─────────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-3">
              AI — Ollama (Local)
            </p>

            <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-3 mb-3 space-y-2">
              <p className="text-xs font-bold text-primary-800">Setup Instructions</p>
              <ol className="text-[11px] text-primary-700 font-semibold space-y-1 list-decimal list-inside">
                <li>Install Ollama from <span className="text-primary-600 underline">ollama.com</span></li>
                <li>Run: <code className="bg-primary-900 text-primary-200 px-1.5 py-0.5 rounded font-mono text-[10px]">ollama pull llama3.2</code></li>
                <li>Ollama auto-starts on <code className="bg-primary-900 text-primary-200 px-1.5 py-0.5 rounded font-mono text-[10px]">localhost:11434</code></li>
              </ol>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Model</label>
                {models.length > 0 ? (
                  <select className="input" value={ollamaModel} onChange={e => setOllamaModel(e.target.value)}>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input
                    className="input"
                    placeholder="llama3.2"
                    value={ollamaModel}
                    onChange={e => setOllamaModel(e.target.value)}
                  />
                )}
              </div>

              <button onClick={testOllama} disabled={testing} className="btn-secondary w-full">
                {testing ? <RefreshCw size={14} className="animate-spin" /> :
                 status === 'ok' ? <Check size={14} className="text-primary-600" /> :
                 status === 'fail' ? <AlertTriangle size={14} className="text-red-500" /> : null}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              {status === 'ok' && (
                <p className="text-xs text-primary-600 font-bold text-center">
                  ✓ Connected — {models.length} model(s) available
                </p>
              )}
              {status === 'fail' && (
                <p className="text-xs text-red-600 font-bold text-center">
                  ✗ Cannot reach Ollama — is it running?
                </p>
              )}
            </div>
          </section>

          {/* ── Danger Zone ────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Danger Zone</p>
            <button
              onClick={handleClearRoster}
              className={clsx(
                'w-full btn border-2 justify-center text-sm transition-all duration-150',
                confirmClear
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400'
              )}
            >
              <Trash2 size={14} strokeWidth={2.5} />
              {confirmClear ? 'Confirm — Clear All Assignments?' : 'Clear Entire Roster'}
            </button>
          </section>
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      </div>
    </div>
  )
}

function clsx(...classes) {
  return classes.filter(Boolean).join(' ')
}
