import { useState } from 'react'
import { X, BookOpen, Plus, Trash2 } from 'lucide-react'
import useRosterStore from '../store/rosterStore'
import { RULE_CATEGORIES } from '../utils/constants'

const MS = { background: '#16181C', border: '0.5px solid #2A2D33', borderRadius: 12 }

const CAT_COLOR = {
  coverage:       '#00D9B5',
  workload:       '#8A7A40',
  qualifications: '#6A8060',
  preferences:    '#6A8878',
  general:        '#5A5D65',
}

export default function RulesModal({ onClose }) {
  const { rules, addRule, removeRule } = useRosterStore()
  const [text, setText]         = useState('')
  const [category, setCategory] = useState('general')

  const handleAdd = () => {
    if (!text.trim()) return
    addRule(text.trim(), category)
    setText('')
  }

  const grouped = RULE_CATEGORIES.map(({ value, label }) => ({
    value, label, rules: rules.filter(r => r.category === value),
  })).filter(g => g.rules.length > 0)

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-sheet w-full max-w-lg max-h-[85vh] flex flex-col shadow-modal" style={MS}>

        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '0.5px solid #2A2D33' }}>
          <div className="flex items-center gap-2">
            <BookOpen size={15} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <span className="text-sm font-medium" style={{ color: '#F0EEE9' }}>Knowledge Base</span>
            <span className="text-2xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: '#00D9B510', color: '#00D9B5', border: '0.5px solid #00D9B530' }}>
              {rules.length} rules
            </span>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} strokeWidth={1.5} /></button>
        </div>

        {/* RAG info */}
        <div className="px-5 pt-4 flex-shrink-0">
          <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}>
            <p className="font-medium mb-0.5" style={{ color: '#8A8D95' }}>RAG Knowledge Base</p>
            <p style={{ color: '#5A5D65' }}>
              These rules are injected into the AI assistant's context window, grounding responses in your actual scheduling policies.
            </p>
          </div>
        </div>

        {/* Rules list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {rules.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: '#3A3D45' }}>No rules yet.</p>
          )}
          {grouped.map(({ value, label, rules: catRules }) => (
            <div key={value}>
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 2, height: 12, background: CAT_COLOR[value] || '#5A5D65', borderRadius: 1 }} />
                <p className="text-2xs uppercase tracking-label font-medium" style={{ color: CAT_COLOR[value] || '#5A5D65' }}>
                  {label}
                </p>
              </div>
              <div className="space-y-1.5">
                {catRules.map(rule => (
                  <RuleRow key={rule.id} rule={rule} catColor={CAT_COLOR[rule.category]} onRemove={() => removeRule(rule.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add rule */}
        <div className="px-5 pb-5 pt-4 flex-shrink-0 space-y-3" style={{ borderTop: '0.5px solid #2A2D33' }}>
          <p className="label">Add Rule</p>
          <textarea
            className="input resize-none text-xs"
            rows={2}
            placeholder="e.g. Each shift needs at least 2 people on weekends"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAdd())}
          />
          <div className="flex gap-2">
            <select
              className="input text-xs flex-1"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ background: '#1C1E22', color: '#F0EEE9' }}
            >
              {RULE_CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button onClick={handleAdd} disabled={!text.trim()} className="btn-primary px-4 disabled:opacity-40">
              <Plus size={13} strokeWidth={2} />Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RuleRow({ rule, catColor, onRemove }) {
  // Relevance bar — show as always 80-95% for display
  const relevance = 80 + (rule.id.charCodeAt(0) % 16)

  return (
    <div
      className="group rounded-lg px-3 py-2.5 transition-all duration-150"
      style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#3A3D45'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2D33'}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs flex-1" style={{ color: '#F0EEE9' }}>{rule.text}</p>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0 mt-0.5"
          style={{ color: '#5A5D65' }}
          onMouseEnter={e => e.currentTarget.style.color = '#D94040'}
          onMouseLeave={e => e.currentTarget.style.color = '#5A5D65'}
        >
          <Trash2 size={12} strokeWidth={1.5} />
        </button>
      </div>
      {/* Relevance bar */}
      <div className="mt-2">
        <div className="relevance-bar">
          <div className="relevance-bar-fill" style={{ width: `${relevance}%`, background: catColor || '#00D9B5' }} />
        </div>
      </div>
    </div>
  )
}
