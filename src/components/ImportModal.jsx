import { useState, useRef } from 'react'
import { X, Upload, Link, FileText, CheckCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import useRosterStore from '../store/rosterStore'
import { parseCSV, fetchSheetCSV, extractSheetId, mapRowsToEmployees } from '../utils/googleSheets'

const MS = { background: '#16181C', border: '0.5px solid #2A2D33', borderRadius: 12 }
const TABS = [
  { id: 'file',  label: 'Upload CSV',       icon: Upload   },
  { id: 'url',   label: 'Google Sheets',    icon: Link     },
  { id: 'paste', label: 'Paste CSV',        icon: FileText },
]

export default function ImportModal({ onClose }) {
  const { importEmployees } = useRosterStore()
  const [tab, setTab]         = useState('file')
  const [sheetUrl, setSheetUrl] = useState('')
  const [csvText, setCsvText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed]   = useState(null)
  const [colMap, setColMap]   = useState({ name: '', employeeId: '', shifts: '', days: '', notes: '' })
  const [replace, setReplace] = useState(false)
  const fileRef = useRef()

  const parseCsvText = text => {
    try {
      const result = parseCSV(text)
      setParsed(result)
      const auto = { name: '', employeeId: '', shifts: '', days: '', notes: '' }
      result.headers.forEach(h => {
        const l = h.toLowerCase()
        if (!auto.name && /name|employee/.test(l)) auto.name = h
        if (!auto.employeeId && /\bid\b|number|code/.test(l)) auto.employeeId = h
        if (!auto.shifts && /shift|preferred/.test(l)) auto.shifts = h
        if (!auto.days && /day|avail/.test(l)) auto.days = h
        if (!auto.notes && /note|comment/.test(l)) auto.notes = h
      })
      setColMap(auto)
    } catch (e) { toast.error(e.message) }
  }

  async function handleFetchSheet() {
    const id = extractSheetId(sheetUrl)
    if (!id) return toast.error('Invalid Google Sheets URL')
    setLoading(true)
    try {
      const result = await fetchSheetCSV(id)
      setParsed(result)
      toast.success(`Loaded ${result.rows.length} rows`)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function handleImport() {
    if (!colMap.name) return toast.error('Select the Name column')
    try {
      const emps = mapRowsToEmployees(parsed.rows, colMap)
      importEmployees(emps, replace)
      toast.success(`Imported ${emps.length} employees`)
      onClose()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-sheet w-full max-w-2xl max-h-[88vh] flex flex-col shadow-modal" style={MS}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '0.5px solid #2A2D33' }}>
          <div className="flex items-center gap-2">
            <Upload size={15} strokeWidth={1.5} style={{ color: '#00D9B5' }} />
            <span className="text-sm font-medium" style={{ color: '#F0EEE9' }}>Import Employees</span>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} strokeWidth={1.5} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Google Form guide */}
          <div className="rounded-lg p-3 text-xs" style={{ background: '#1C1E22', border: '0.5px solid #2A2D33' }}>
            <p className="font-medium mb-1" style={{ color: '#00D9B5' }}>Using Google Forms?</p>
            <p style={{ color: '#8A8D95' }}>
              Create a form with: <span style={{ color: '#F0EEE9' }}>Employee Name, Employee ID, Preferred Shifts, Available Days, Notes</span>.
              Responses auto-save to Sheets — share with "Anyone can view", paste URL below.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '0.5px solid #2A2D33' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setTab(id); setParsed(null) }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors duration-150"
                style={{
                  background: tab === id ? '#00D9B5' : '#1C1E22',
                  color:      tab === id ? '#0E0F11' : '#8A8D95',
                  borderRight: id !== 'paste' ? '0.5px solid #2A2D33' : 'none',
                }}
              >
                <Icon size={13} strokeWidth={1.5} />{label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'file' && (
            <>
              <input type="file" accept=".csv" ref={fileRef} className="hidden"
                onChange={async e => { if (e.target.files[0]) parseCsvText(await e.target.files[0].text()) }} />
              <button onClick={() => fileRef.current.click()}
                className="w-full py-12 flex flex-col items-center gap-2 rounded-xl transition-all duration-150 text-sm"
                style={{ border: '1px dashed #3A3D45', color: '#5A5D65' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00D9B5'; e.currentTarget.style.color = '#00D9B5' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3D45'; e.currentTarget.style.color = '#5A5D65' }}
              >
                <Upload size={22} strokeWidth={1} />
                Click to upload CSV
              </button>
            </>
          )}
          {tab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="label">Google Sheets URL</label>
                <input className="input" placeholder="https://docs.google.com/spreadsheets/d/…"
                  value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} />
              </div>
              <button onClick={handleFetchSheet} disabled={loading || !sheetUrl} className="btn-primary">
                {loading ? 'Fetching…' : 'Fetch Sheet Data'}
              </button>
            </div>
          )}
          {tab === 'paste' && (
            <div>
              <label className="label">Paste CSV Data</label>
              <textarea className="input resize-none font-mono text-xs" rows={6}
                placeholder="First row must be headers…" value={csvText}
                onChange={e => setCsvText(e.target.value)} />
              <button onClick={() => parseCsvText(csvText)} disabled={!csvText.trim()} className="btn-primary mt-2">
                Parse
              </button>
            </div>
          )}

          {/* Column mapping + preview */}
          {parsed && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs" style={{ color: '#00D9B5' }}>
                <CheckCircle size={13} strokeWidth={1.5} />
                {parsed.rows.length} rows · {parsed.headers.length} columns
              </div>

              <div>
                <label className="label">Map Columns</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'name',       label: 'Name *'          },
                    { key: 'employeeId', label: 'Employee ID'     },
                    { key: 'shifts',     label: 'Preferred Shifts' },
                    { key: 'days',       label: 'Available Days'  },
                    { key: 'notes',      label: 'Notes'           },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <select className="input text-xs" value={colMap[key]}
                        onChange={e => setColMap({ ...colMap, [key]: e.target.value })}
                        style={{ background: '#1C1E22', color: '#F0EEE9' }}
                      >
                        <option value="">(skip)</option>
                        {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="label">Preview</label>
                <div className="rounded-lg overflow-hidden text-xs" style={{ border: '0.5px solid #2A2D33' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#1C1E22', borderBottom: '0.5px solid #2A2D33' }}>
                        {parsed.headers.map(h => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium" style={{ color: '#8A8D95' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < 2 ? '0.5px solid #1C1E22' : 'none' }}>
                          {parsed.headers.map(h => (
                            <td key={h} className="px-2 py-1.5 max-w-[120px] truncate" style={{ color: '#F0EEE9' }}>
                              {row[h] || '–'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: '#8A8D95' }}>
                <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)}
                  className="accent-accent" />
                Replace existing employees
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: '0.5px solid #2A2D33' }}>
          <button onClick={onClose} className="btn flex-1 justify-center">Cancel</button>
          <button onClick={handleImport} disabled={!parsed || !colMap.name}
            className="btn-primary flex-1 justify-center disabled:opacity-40">
            <ArrowRight size={14} strokeWidth={1.5} />
            Import Employees
          </button>
        </div>
      </div>
    </div>
  )
}
