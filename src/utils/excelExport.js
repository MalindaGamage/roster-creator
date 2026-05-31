import * as XLSX from 'xlsx'
import { format, addDays, parseISO } from 'date-fns'
import { SHIFTS } from './constants'

/**
 * Generates an Excel file matching the Roster Template structure:
 * Row 1: Shift | Time Slot | Date1 | Date2 | ...
 * Row 2+: ShiftA | 8AM-5PM | [names] | ...
 */
export function exportToExcel(weekStart, numDays, assignments, employees) {
  const wb = XLSX.utils.book_new()
  const ws = {}

  const startDate = parseISO(weekStart)

  // --- Build column widths and header row ---
  const headers = ['Shift', 'Time Slot']
  const dates = []
  for (let d = 0; d < numDays; d++) {
    const day = addDays(startDate, d)
    headers.push(format(day, 'EEE d MMM yyyy'))
    dates.push(day)
  }

  // Row 1 – header
  headers.forEach((h, col) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    ws[cellRef] = {
      v: h,
      t: 's',
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borders(),
      },
    }
  })

  // Rows 2+ – one per shift
  SHIFTS.forEach((shift, rowIdx) => {
    const row = rowIdx + 1

    // Col 0: shift name
    const nameCell = XLSX.utils.encode_cell({ r: row, c: 0 })
    ws[nameCell] = {
      v: shift.label,
      t: 's',
      s: {
        font: { bold: true },
        fill: { fgColor: { rgb: shiftFill(shift.key) } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borders(),
      },
    }

    // Col 1: time slot
    const timeCell = XLSX.utils.encode_cell({ r: row, c: 1 })
    ws[timeCell] = {
      v: shift.time.replace('–', '-'),
      t: 's',
      s: {
        fill: { fgColor: { rgb: shiftFill(shift.key) } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borders(),
      },
    }

    // Cols 2+: employee names per day
    for (let d = 0; d < numDays; d++) {
      const key = `${d}-${shift.key}`
      const empIds = assignments[key] || []
      const names = empIds
        .map((id) => employees.find((e) => e.id === id)?.name || '')
        .filter(Boolean)
        .join('\n')

      const cellRef = XLSX.utils.encode_cell({ r: row, c: d + 2 })
      ws[cellRef] = {
        v: names,
        t: 's',
        s: {
          alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
          border: borders(),
        },
      }
    }
  })

  // Sheet range
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: SHIFTS.length, c: numDays + 1 },
  })

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, // Shift
    { wch: 12 }, // Time Slot
    ...Array(numDays).fill({ wch: 22 }),
  ]

  // Row heights
  ws['!rows'] = [
    { hpt: 28 }, // header
    ...Array(SHIFTS.length).fill({ hpt: 60 }),
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Roster')
  const weekStr = format(startDate, 'yyyy-MM-dd')
  XLSX.writeFile(wb, `Roster_${weekStr}.xlsx`)
}

function borders() {
  const side = { style: 'thin', color: { rgb: 'CBD5E1' } }
  return { top: side, bottom: side, left: side, right: side }
}

const SHIFT_FILLS = {
  A: 'EFF6FF',
  B: 'EEF2FF',
  C: 'F0FDFA',
  D: 'FFF7ED',
  E: 'FFF1F2',
  Backup: 'F8FAFC',
}

function shiftFill(key) {
  return SHIFT_FILLS[key] || 'F8FAFC'
}
