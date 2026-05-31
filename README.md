# Roster Creator

An AI-assisted shift roster management app for scheduling teams. Built with React + Vite — no backend required. All data is stored locally in the browser.

---

## Features

| Feature | Description |
|---|---|
| **Drag & Drop Grid** | Drag employees onto the weekly roster grid (Mon–Sun, 6 shifts) |
| **Chat Import** | Paste WhatsApp/chat messages — smart parser extracts shift assignments automatically |
| **Auto-Schedule** | Heuristic engine fills the full roster respecting all constraints |
| **Excel Export** | Downloads a formatted `.xlsx` file matching the original roster template |
| **CSV / Google Sheets Import** | Import employee lists from a CSV file or Google Sheets URL |
| **AI Chat Assistant** | Ask scheduling questions in natural language (requires Ollama) |
| **Rules / RAG System** | Manage scheduling rules that guide both the auto-scheduler and AI |
| **Persistent State** | All data saved to `localStorage` — survives page refresh |

---

## Shifts

| Key | Name | Hours | Type |
|---|---|---|---|
| A | Shift A | 8h | Onsite Day (8AM – 5PM) |
| B | Shift B | **15h** | Onsite Night (5PM – 8AM) |
| C | Shift C | 8h | Remote Early (5AM – 1PM) |
| D | Shift D | 8h | Remote Afternoon (1PM – 9PM) |
| E | Shift E | 8h | Remote Night (9PM – 5AM) — needs **2 staff** |
| Backup | Backup | 8h | On-call |

---

## Scheduling Rules (enforced by Auto-Schedule)

- **Min 32h / Max 45h** per employee per week
- **One shift per day** — no employee can be assigned two shifts on the same day
- **2 night shifts per week** per employee (Shift B or E)
- **Shift E** requires 2 employees per slot; all other shifts require 1
- **Workload balanced** — employees with fewer hours are prioritised

### Employee-specific rules

| Employee | Rule |
|---|---|
| Yashodara | Primarily assigned to Shift C (Remote Early) |
| Lahiru | Exactly 1 Shift E (remote night), rest Shift A. No Shift B |
| Uminda | No Shift B (onsite night). 2 × Shift E (remote night) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+

### Install & Run

```bash
npm install
npm run dev
```

Opens at **http://localhost:3000**

### Build for Production

```bash
npm run build
npm run preview
```

---

## Workflow

### 1. Add Employees

**Option A — Bulk add** (list icon next to "Add" in the employee panel):
```
Lakshitha
Ravishka
Lahiru
Shanaka
...
```

**Option B — Individual add**: Click **Add** → fill name, ID, preferred shifts, available days.

**Option C — Import from CSV / Google Sheets**: Click **Import** in the header.

---

### 2. Import Shift Preferences from WhatsApp

Click **Chat Import** in the header and paste your manager's messages:

```
Haribabuji - 3rd & 7th shift E, 5th - shiftD, 6th -shift C
Shihara onsite night shifts on 5th and 6th
Lakshitha - Need to free 1st and 3rd
Ravishka - Need onsite night shift on 4th and free on 7th
Uminda - need to free on 7th, No Onsite night shifts
Other 6 employees: available for any shift
```

Supported patterns:

| Pattern | Meaning |
|---|---|
| `Name - 3rd & 7th shift E` | Assign Shift E on those dates |
| `Name onsite night shifts on 5th and 6th` | Assign Shift B on those dates |
| `Name - Need to free 1st and 3rd` | Mark those days as off |
| `Name - free on 7th` | Mark Sunday as off |
| `Name - No Onsite night shifts` | Exclude from Shift B permanently |
| `Other N employees: available for any shift` | Skipped (no constraints) |

Click **Parse Messages** → review the preview → **Apply & Fill Full Roster** to apply constraints and auto-schedule everyone.

---

### 3. Auto-Schedule

Click **Auto-Schedule** in the header to fill the entire roster using the heuristic engine. It will:

1. Process night shifts first to meet everyone's 2-night quota
2. Fill remaining slots, balancing hours across employees
3. Top up anyone below 32h (minimum hours)

---

### 4. Manual Adjustments

- **Drag** an employee card from the left panel onto any roster cell
- **Click ×** on an employee badge in the grid to remove that assignment
- **Edit** an employee (pencil icon) to change their shift preferences or available days

---

### 5. Export to Excel

Click **Export** — downloads `Roster_YYYY-MM-DD.xlsx` formatted to match the original roster template.

---

## Google Form Setup (Recommended)

Create a Google Form with these fields so employees can submit their availability:

1. **Employee Name** (Short answer)
2. **Employee ID** (Short answer, optional)
3. **Preferred Shifts** (Checkboxes: Shift A, Shift B, Shift C, Shift D, Shift E, Backup)
4. **Available Days** (Checkboxes: Monday – Sunday)
5. **Notes / Constraints** (Paragraph)

Responses auto-save to Google Sheets. Share the sheet with "Anyone with the link → Viewer", then paste the URL into **Import → Google Sheets URL**.

---

## AI Chat Assistant (Optional)

The **Ask AI** button opens a chat panel powered by [Ollama](https://ollama.com) running locally on your machine. The AI has full context about the current roster — employee hours, assignments, rules, and constraints.

### Setup

```bash
# 1. Install Ollama from https://ollama.com
# 2. Pull a model
ollama pull llama3.2

# 3. Ollama starts automatically at localhost:11434
```

### Example Questions

- *"Who has hours left for an extra shift this week?"*
- *"Shihara is sick on Friday — who can cover Shift B?"*
- *"Which employees are under 32 hours?"*
- *"Suggest a swap if Uminda wants Saturday off"*

> The app works 100% without Ollama. AI is only used for the chat Q&A assistant.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS (Flat Design — teal + orange) |
| State | Zustand (persisted to localStorage) |
| Drag & Drop | @dnd-kit/core |
| Excel Export | SheetJS (xlsx) |
| CSV Parsing | PapaParse |
| Date Handling | date-fns |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| AI | Ollama (local, optional) |

---

## Project Structure

```
src/
├── components/
│   ├── Header.jsx            # Navigation, week selector, action buttons
│   ├── RosterGrid.jsx        # Weekly drag-and-drop grid
│   ├── EmployeePanel.jsx     # Employee list sidebar
│   ├── AddEmployeeModal.jsx  # Add / edit employee form
│   ├── BulkAddModal.jsx      # Paste multiple employee names
│   ├── ImportModal.jsx       # CSV / Google Sheets import
│   ├── ChatImportModal.jsx   # WhatsApp message parser
│   ├── AIPanel.jsx           # Ollama chat assistant
│   ├── RulesModal.jsx        # Scheduling rules manager
│   └── SettingsModal.jsx     # Days per week, Ollama model
├── store/
│   └── rosterStore.js        # Zustand store (all app state)
├── utils/
│   ├── constants.js          # Shifts, hours, colours, palettes
│   ├── rosterEngine.js       # Auto-scheduler (3-pass heuristic)
│   ├── excelExport.js        # Excel generation
│   ├── googleSheets.js       # CSV / Sheets parsing
│   ├── ollama.js             # Ollama API wrapper
│   └── applyPreferences.js   # Employee-specific defaults
└── App.jsx                   # DnD context + modal wiring
```

---

## License

MIT
