import { useState } from 'react'
import { X, Settings, RefreshCw, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import useRosterStore from '../store/rosterStore'
import { pingOllama, listModels } from '../utils/ollama'

const MS = { background: '#16181C', border: '0.5px solid #2A2D33', borderRadius: 12 }

export default function SettingsModal({ onClose }) {
  const { numDays, setNumDays, ollamaModel, setOllamaModel, clearRoster } = useRosterStore()
  const [testing,     setTesting]     = useState(false)
  const [ollamaOk,    setOllamaOk]    = useState(null)
  const [models,      setModels]      = useState([])
  const [confirmClear, setConfirmClear] = useState(false)

  async function testOllama() {
    setTesting(true); setOllamaOk(null)
    try {
      const ok = await pingOllama()
      if (ok) {
        const ms = await listModels(); setModels(ms); setOllamaOk(true)
        toast.success(`Ollama connected — ${ms.length} model(s)`)
      } else { setOllamaOk(false); toast.error('Cannot reach Ollama on localhost:11434') }
    } catch (e) { setOllamaOk(false); toast.error(e.message) }
    finally { setTesting(false) }
  }

  const OptionBtn = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150"
      style={{
        background: active ? '#00D9B5' : '#1C1E22',
        color:      active ? '#0E0F11' : '#8A8D95',
        border: `0.5px solid ${active ? '#00D9B5' : '#3A3D45'}`,
      }}
    >{children}</button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md shadow-modal" style={MS}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '0.5px solid #2A2D33' }}>
          <div className="flex items-center gap-2">
            <Settings size={15} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <span className="text-sm font-medium" style={{ color: '#F0EEE9' }}>Settings</span>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} strokeWidth={1.5} /></button>
        </div>

        <div className="p-5 space-y-6">

          {/* Roster */}
          <section>
            <p className="label">Roster Days</p>
            <div className="flex gap-2">
              <OptionBtn active={numDays === 6} onClick={() => setNumDays(6)}>6 days (Mon–Sat)</OptionBtn>
              <OptionBtn active={numDays === 7} onClick={() => setNumDays(7)}>7 days (Mon–Sun)</OptionBtn>
            </div>
          </section>

          {/* Ollama */}
          <section>
            <p className="label">AI — Ollama (Local)</p>
            <div className="rounded-lg p-3 text-xs mb-3 font-mono space-y-1"
              style={{ background: '#0B0C0E', border: '0.5px solid #2A2D33' }}>
              <p style={{ color: '#5A5D65' }}># setup</p>
              <p style={{ color: '#8A8D95' }}>$ brew install ollama</p>
              <p style={{ color: '#8A8D95' }}>$ ollama pull <span style={{ color: '#00D9B5' }}>llama3.2</span></p>
              <p style={{ color: '#8A8D95' }}>$ ollama serve <span style={{ color: '#3A3D45' }}># auto on Windows</span></p>
            </div>
            <div className="space-y-2">
              {models.length > 0 ? (
                <select className="input text-xs" value={ollamaModel}
                  onChange={e => setOllamaModel(e.target.value)}
                  style={{ background: '#1C1E22', color: '#F0EEE9' }}>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input className="input text-xs" placeholder="llama3.2"
                  value={ollamaModel} onChange={e => setOllamaModel(e.target.value)} />
              )}
              <button onClick={testOllama} disabled={testing} className="btn w-full justify-center text-xs">
                {testing
                  ? <RefreshCw size={13} strokeWidth={1.5} className="animate-spin" />
                  : ollamaOk === true  ? <Check size={13} strokeWidth={2} style={{ color: '#00D9B5' }} />
                  : ollamaOk === false ? <span style={{ color: '#D94040' }}>✗</span>
                  : null}
                {testing ? 'Testing…' : 'Test Connection'}
              </button>
            </div>
          </section>

          {/* Danger */}
          <section>
            <p className="label" style={{ color: '#D94040' }}>Danger Zone</p>
            <button
              onClick={() => { if (!confirmClear) { setConfirmClear(true); return } clearRoster(); setConfirmClear(false); toast.success('Roster cleared') }}
              className="btn-danger w-full justify-center text-xs"
              style={{ background: confirmClear ? '#D94040' : 'transparent', color: confirmClear ? '#F0EEE9' : '#D94040' }}
            >
              <Trash2 size={13} strokeWidth={1.5} />
              {confirmClear ? 'Click again to confirm' : 'Clear Entire Roster'}
            </button>
          </section>
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn-primary w-full justify-center">Done</button>
        </div>
      </div>
    </div>
  )
}
