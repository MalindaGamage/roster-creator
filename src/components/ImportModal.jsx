import { useState, useRef } from 'react'
import { X, Upload, Link, FileText, CheckCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import useRosterStore from '../store/rosterStore'
import { parseCSV, fetchSheetCSV, extractSheetId, mapRowsToEmployees } from '../utils/googleSheets'

const TABS = [
  { id: 'file',  label: 'Upload CSV',       icon: Upload   },
  { id: 'url',   label: 'Google Sheets URL', icon: Link     },
  { id: 'paste', label: 'Paste CSV',         icon: FileText },
]

export default function ImportModal({ onClose }) {
  const { importEmployees } = useRosterStore()
  const [tab, setTab] = useState('file')
  const [sheetUrl, setSheetUrl] = useState('')
  const [csvText, setCsvText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState(null)
  const [colMap, setColMap] = useState({ name: '', employeeId: '', shifts: '', days: '', notes: '' })
  const [replace, setReplace] = useState(false)
  const fileRef = useRef()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    parseCsvText(await file.text())
  }

  function parseCsvText(text) {
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
        if (!auto.notes && /note|comment|remark/.test(l)) auto.notes = h
      })
      setColMap(auto)
    } catch (e) {
      toast.error('CSV parse error: ' + e.message)
    }
  }

  async function handleFetchSheet() {
    const id = extractSheetId(sheetUrl)
    if (!id) return toast.error('Invalid Google Sheets URL')
    setLoading(true)
    try {
      const result = await fetchSheetCSV(id)
      setParsed(result)
      toast.success(`Loaded ${result.rows.length} rows from Google Sheets`)
    } catch (e) {
      toast.error(e.message)
    } finally { setLoading(false) }
  }

  function handleImport() {
    if (!parsed) return
    if (!colMap.name) return toast.error('Select the Name column')
    try {
      const employees = mapRowsToEmployees(parsed.rows, colMap)
      importEmployees(employees, replace)
      toast.success(`Imported ${employees.length} employees!`)
      onClose()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-primary-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Upload size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-bold text-primary-900">Import Employees</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Google Form guide */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
            <p className="text-xs font-bold text-primary-800 mb-1">Using Google Forms?</p>
            <p className="text-[11px] text-primary-700 font-semibold leading-relaxed">
              Create a Google Form with fields: <strong>Employee Name, Employee ID, Preferred Shifts, Available Days, Notes</strong>.
              Responses auto-save to Google Sheets — share it ("Anyone with link → View"),
              then paste the URL below or download as CSV.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-2 border-primary-200 rounded-xl overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setParsed(null) }}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors duration-150 cursor-pointer',
                  tab === id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-primary-600 hover:bg-primary-50'
                )}
              >
                <Icon size={13} strokeWidth={2.5} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab: File upload */}
          {tab === 'file' && (
            <div>
              <input type="file" accept=".csv" ref={fileRef} className="hidden" onChange={handleFile} />
              <button
                onClick={() => fileRef.current.click()}
                className="w-full border-2 border-dashed border-primary-300 rounded-xl py-12 flex flex-col items-center gap-2 text-primary-400 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-150 cursor-pointer"
              >
                <Upload size={24} strokeWidth={2} />
                <span className="text-sm font-bold">Click to upload CSV file</span>
                <span className="text-xs font-semibold text-primary-300">First row must be column headers</span>
              </button>
            </div>
          )}

          {/* Tab: URL */}
          {tab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="label">Google Sheets URL</label>
                <input
                  className="input"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                />
              </div>
              <button
                onClick={handleFetchSheet}
                disabled={loading || !sheetUrl}
                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Fetching...' : 'Fetch Sheet Data'}
              </button>
            </div>
          )}

          {/* Tab: Paste */}
          {tab === 'paste' && (
            <div>
              <label className="label">Paste CSV Data</label>
              <textarea
                className="input resize-none font-mono text-xs"
                rows={6}
                placeholder="Paste CSV content here — first row must be column headers..."
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
              <button
                onClick={() => parseCsvText(csvText)}
                disabled={!csvText.trim()}
                className="btn-primary mt-2 disabled:opacity-40"
              >
                Parse CSV
              </button>
            </div>
          )}

          {/* Column mapping + preview */}
          {parsed && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary-600">
                <CheckCircle size={15} strokeWidth={2.5} />
                <span className="text-xs font-bold">
                  Loaded {parsed.rows.length} rows · {parsed.headers.length} columns
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-3">Map Columns</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'name',       label: 'Employee Name *' },
                    { key: 'employeeId', label: 'Employee ID'     },
                    { key: 'shifts',     label: 'Preferred Shifts' },
                    { key: 'days',       label: 'Available Days'  },
                    { key: 'notes',      label: 'Notes'           },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <select
                        className="input text-xs"
                        value={colMap[key]}
                        onChange={e => setColMap({ ...colMap, [key]: e.target.value })}
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
                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-2">Preview (first 3 rows)</p>
                <div className="overflow-x-auto rounded-xl border-2 border-primary-100">
                  <table className="w-full text-[11px]">
                    <thead className="bg-primary-50">
                      <tr>
                        {parsed.headers.map(h => (
                          <th key={h} className="px-3 py-2 text-left text-primary-600 font-bold border-b-2 border-primary-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-primary-50 last:border-0">
                          {parsed.headers.map(h => (
                            <td key={h} className="px-3 py-2 text-primary-700 font-semibold max-w-[120px] truncate">
                              {row[h] || '–'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-2 border-primary-300 text-primary-600 focus:ring-primary-500"
                  checked={replace}
                  onChange={e => setReplace(e.target.checked)}
                />
                <span className="text-xs font-semibold text-primary-700">
                  Replace existing employees instead of merging
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t-2 border-primary-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleImport}
            disabled={!parsed || !colMap.name}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRight size={14} strokeWidth={2.5} />
            Import {parsed ? `${parsed.rows.length} Employees` : 'Employees'}
          </button>
        </div>
      </div>
    </div>
  )
}

function clsx(...classes) {
  return classes.filter(Boolean).join(' ')
}
