import Papa from 'papaparse'

/**
 * Extract spreadsheet ID from a Google Sheets URL
 */
export function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

/**
 * Fetch and parse a public Google Sheet as CSV via Vite proxy.
 * The sheet must be shared with "Anyone with the link can view".
 */
export async function fetchSheetCSV(sheetId) {
  const csvUrl = `/sheets-proxy/spreadsheets/d/${sheetId}/export?format=csv`
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error(`Failed to fetch sheet (${res.status})`)
  const text = await res.text()
  return parseCSV(text)
}

/**
 * Parse CSV text (from file upload or manual paste) into row objects.
 */
export function parseCSV(csvText) {
  const result = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  if (result.errors.length) {
    const serious = result.errors.filter((e) => e.type === 'FieldMismatch')
    if (serious.length) throw new Error(result.errors[0].message)
  }
  return { headers: result.meta.fields || [], rows: result.data }
}

/**
 * Map parsed CSV rows to employee objects using a column mapping config.
 *
 * columnMap shape:
 * {
 *   name: 'Employee Name',          // required
 *   employeeId: 'Employee ID',      // optional
 *   shifts: 'Preferred Shifts',     // optional - comma-separated shift keys
 *   days: 'Available Days',         // optional - comma-separated day indices or names
 *   notes: 'Notes',                 // optional
 * }
 */
export function mapRowsToEmployees(rows, columnMap) {
  const SHIFT_KEYS = ['A', 'B', 'C', 'D', 'E', 'Backup']
  const DAY_MAP = {
    mon: 0, monday: 0,
    tue: 1, tuesday: 1,
    wed: 2, wednesday: 2,
    thu: 3, thursday: 3,
    fri: 4, friday: 4,
    sat: 5, saturday: 5,
    sun: 6, sunday: 6,
  }

  return rows
    .map((row) => {
      const name = row[columnMap.name]?.trim()
      if (!name) return null

      let shifts = []
      if (columnMap.shifts && row[columnMap.shifts]) {
        const raw = row[columnMap.shifts]
        shifts = raw
          .split(/[,;|]/)
          .map((s) => s.trim().replace(/shift\s*/i, '').toUpperCase())
          .filter((s) => SHIFT_KEYS.includes(s))
      }

      let days = [0, 1, 2, 3, 4] // default Mon-Fri
      if (columnMap.days && row[columnMap.days]) {
        const raw = row[columnMap.days]
        const parsed = raw
          .split(/[,;|]/)
          .map((d) => {
            const key = d.trim().toLowerCase()
            return DAY_MAP[key] ?? (isNaN(Number(key)) ? null : Number(key))
          })
          .filter((d) => d !== null && d >= 0 && d <= 6)
        if (parsed.length) days = parsed
      }

      return {
        name,
        employeeId: columnMap.employeeId ? row[columnMap.employeeId]?.trim() || '' : '',
        shifts,
        days,
        notes: columnMap.notes ? row[columnMap.notes]?.trim() || '' : '',
      }
    })
    .filter(Boolean)
}
