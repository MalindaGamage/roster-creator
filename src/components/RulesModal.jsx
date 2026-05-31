import { useState } from 'react'
import { X, BookOpen, Plus, Trash2 } from 'lucide-react'
import useRosterStore from '../store/rosterStore'
import { RULE_CATEGORIES } from '../utils/constants'

const CATEGORY_STYLES = {
  coverage:       'bg-blue-100 text-blue-800 border-blue-300',
  workload:       'bg-cta-100 text-cta-700 border-cta-300',
  qualifications: 'bg-violet-100 text-violet-800 border-violet-300',
  preferences:    'bg-teal-100 text-teal-800 border-teal-300',
  general:        'bg-slate-100 text-slate-700 border-slate-300',
}

export default function RulesModal({ onClose }) {
  const { rules, addRule, removeRule } = useRosterStore()
  const [text, setText] = useState('')
  const [category, setCategory] = useState('general')

  function handleAdd() {
    if (!text.trim()) return
    addRule(text.trim(), category)
    setText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm">
      <div className="card w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-primary-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-bold text-primary-900">Roster Rules</h2>
            <span className="text-[10px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded-md">
              {rules.length}
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-5 pt-4">
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-3">
            <p className="text-xs font-bold text-primary-800">RAG Knowledge Base</p>
            <p className="text-[11px] text-primary-600 font-semibold mt-0.5">
              These rules are injected into the AI prompt when generating the roster,
              guiding smarter scheduling decisions.
            </p>
          </div>
        </div>

        {/* Rules list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {RULE_CATEGORIES.map(({ value, label }) => {
            const catRules = rules.filter(r => r.category === value)
            if (!catRules.length) return null
            return (
              <div key={value}>
                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-2">{label}</p>
                <div className="space-y-1.5">
                  {catRules.map(rule => (
                    <div
                      key={rule.id}
                      className="flex items-start gap-2 p-3 rounded-xl bg-primary-50 border-2 border-primary-100 group"
                    >
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border-2 font-bold flex-shrink-0 mt-0.5 ${CATEGORY_STYLES[rule.category]}`}>
                        {label}
                      </span>
                      <span className="text-xs text-primary-800 font-semibold flex-1">{rule.text}</span>
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="opacity-0 group-hover:opacity-100 text-primary-400 hover:text-red-600 transition-all duration-150 flex-shrink-0 cursor-pointer"
                        aria-label="Delete rule"
                      >
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {rules.length === 0 && (
            <p className="text-xs text-primary-400 font-semibold text-center py-6">No rules yet. Add some below.</p>
          )}
        </div>

        {/* Add rule form */}
        <div className="px-5 pb-5 pt-4 border-t-2 border-primary-100 bg-primary-50 space-y-3">
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Add Rule</p>
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
            >
              {RULE_CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className="btn-primary text-xs px-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={13} strokeWidth={3} />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
