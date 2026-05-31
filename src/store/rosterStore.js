import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, startOfWeek } from 'date-fns'

function currentMonday() {
  const mon = startOfWeek(new Date(), { weekStartsOn: 1 })
  return format(mon, 'yyyy-MM-dd')
}

const useRosterStore = create(
  persist(
    (set, get) => ({
      weekStart: currentMonday(),
      numDays: 7, // 7 = Mon-Sun
      employees: [],
      assignments: {}, // key: "dayIdx-shiftKey", value: string[] (employeeIds)
      rules: [
        { id: 'r1', text: 'Shift E (Remote Night 9PM-5AM) requires exactly 2 employees per slot for adequate coverage. All other shifts (A, B, C, D, Backup) require 1 employee per slot.', category: 'coverage' },
        { id: 'r2', text: 'No employee should work more than 5 days per week', category: 'workload' },
        { id: 'r3', text: 'Night shifts (Shift B and Shift E) require experienced or senior staff', category: 'qualifications' },
        { id: 'r4', text: 'Distribute shifts fairly across all available employees', category: 'preferences' },
      ],
      chatHistory: [],
      ollamaModel: 'llama3.2',

      // Week navigation
      setWeekStart: (dateStr) => set({ weekStart: dateStr }),
      setNumDays: (n) => set({ numDays: n }),
      prevWeek: () => {
        const d = new Date(get().weekStart)
        d.setDate(d.getDate() - 7)
        set({ weekStart: format(d, 'yyyy-MM-dd'), assignments: {} })
      },
      nextWeek: () => {
        const d = new Date(get().weekStart)
        d.setDate(d.getDate() + 7)
        set({ weekStart: format(d, 'yyyy-MM-dd'), assignments: {} })
      },

      // Employees
      addEmployee: (emp) =>
        set((s) => ({
          employees: [
            ...s.employees,
            {
              id: crypto.randomUUID(),
              name: '',
              employeeId: '',
              shifts: [],          // preferred shift keys e.g. ['A', 'C']
              days: [0, 1, 2, 3, 4, 5, 6],
              nightTarget: 2,      // required night shifts per week (B or E)
              notes: '',
              ...emp,
            },
          ],
        })),

      updateEmployee: (id, updates) =>
        set((s) => ({
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      removeEmployee: (id) =>
        set((s) => {
          const newAssign = {}
          for (const [k, ids] of Object.entries(s.assignments)) {
            const filtered = ids.filter((eid) => eid !== id)
            if (filtered.length) newAssign[k] = filtered
          }
          return { employees: s.employees.filter((e) => e.id !== id), assignments: newAssign }
        }),

      // Assignments
      assignEmployee: (dayIdx, shiftKey, employeeId) => {
        const key = `${dayIdx}-${shiftKey}`
        set((s) => ({
          assignments: {
            ...s.assignments,
            [key]: [...new Set([...(s.assignments[key] || []), employeeId])],
          },
        }))
      },

      unassignEmployee: (dayIdx, shiftKey, employeeId) => {
        const key = `${dayIdx}-${shiftKey}`
        set((s) => {
          const updated = (s.assignments[key] || []).filter((id) => id !== employeeId)
          if (!updated.length) {
            const { [key]: _, ...rest } = s.assignments
            return { assignments: rest }
          }
          return { assignments: { ...s.assignments, [key]: updated } }
        })
      },

      clearRoster: () => set({ assignments: {} }),

      setAssignments: (assignments) => set({ assignments }),

      // Merge new assignments into existing (union of employee ids per cell)
      mergeAssignments: (incoming) =>
        set((s) => {
          const merged = { ...s.assignments }
          for (const [key, ids] of Object.entries(incoming)) {
            merged[key] = [...new Set([...(merged[key] || []), ...ids])]
          }
          return { assignments: merged }
        }),

      // Update employee by name (case-insensitive) — useful for bulk preference setup
      updateEmployeeByName: (name, updates) =>
        set((s) => {
          const target = s.employees.find(e => e.name.toLowerCase() === name.toLowerCase())
          if (!target) return {}
          return {
            employees: s.employees.map(e => e.id === target.id ? { ...e, ...updates } : e),
          }
        }),

      // Rules / RAG knowledge base
      addRule: (text, category = 'general') =>
        set((s) => ({
          rules: [...s.rules, { id: crypto.randomUUID(), text, category }],
        })),

      removeRule: (id) =>
        set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),

      // AI chat
      addChatMessage: (msg) =>
        set((s) => ({ chatHistory: [...s.chatHistory.slice(-99), msg] })),

      clearChat: () => set({ chatHistory: [] }),

      setOllamaModel: (model) => set({ ollamaModel: model }),

      // Bulk import employees (merges by name, no duplicates)
      importEmployees: (list, replace = false) =>
        set((s) => {
          const incoming = list.map((e) => ({ id: crypto.randomUUID(), ...e }))
          if (replace) return { employees: incoming }
          const existingNames = new Set(s.employees.map((e) => e.name.toLowerCase().trim()))
          const fresh = incoming.filter((e) => !existingNames.has(e.name.toLowerCase().trim()))
          return { employees: [...s.employees, ...fresh] }
        }),

      // Derived helpers (called at component level, not stored)
      getAssignmentCount: (employeeId) => {
        const { assignments } = get()
        let count = 0
        for (const ids of Object.values(assignments)) {
          if (ids.includes(employeeId)) count++
        }
        return count
      },


      getCellIds: (dayIdx, shiftKey) => {
        const { assignments } = get()
        return assignments[`${dayIdx}-${shiftKey}`] || []
      },
    }),
    { name: 'roster-v2' }
  )
)

export default useRosterStore
