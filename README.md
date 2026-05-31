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

## Deployment

The app is a pure static site (no backend) — it can be hosted for free on any static hosting platform.

**Live URL:** [https://roster-creator.vercel.app](https://roster-creator.vercel.app)

---

### Vercel (recommended — zero config)

#### First deploy

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Deploy from the project root
cd "E:\roster_creator"
vercel
```

Answer the prompts:
```
? Which team?                        → select your account
? Link to existing project?          → no
? Name?                              → roster-creator
? In which directory is your code?   → ./  (press Enter)
? Customize settings?                → no
```

Vercel auto-detects Vite and deploys in ~30 seconds. You get two URLs:
- **Preview:** `https://roster-creator-<hash>.vercel.app`
- **Aliased:** `https://roster-creator.vercel.app`

#### Redeploy after code changes

```powershell
vercel --prod
```

#### Auto-deploy on every git push

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import the GitHub repository
4. Click **Deploy**

From that point, every `git push origin main` triggers an automatic production deployment.

---

### Netlify (alternative)

```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Build then deploy
npm run build
netlify deploy --prod --dir=dist
```

Or drag and drop the `dist/` folder at [app.netlify.com](https://app.netlify.com).

---

### GitHub Pages

Add `base` to `vite.config.js` (replace `roster-creator` with your repo name):

```js
export default defineConfig({
  base: '/roster-creator/',
  plugins: [react()],
})
```

Then build and push the `dist/` folder to the `gh-pages` branch:

```powershell
npm run build
npx gh-pages -d dist
```

Enable GitHub Pages in **repo Settings → Pages → Branch: gh-pages**.

---

### Platform comparison

| Platform | Free tier | Auto-deploy | Custom domain |
|---|---|---|---|
| **Vercel** ← used | Unlimited static, 100 GB/month | Yes (GitHub) | Free subdomain + custom |
| Netlify | 100 GB/month | Yes (GitHub) | Free subdomain + custom |
| Cloudflare Pages | Unlimited | Yes (GitHub) | Free subdomain + custom |
| GitHub Pages | Unlimited | Via Actions | `username.github.io/repo` |

---

### AI Chat on the deployed app

The AI assistant calls **your local Ollama** — each user needs Ollama running on their own machine. Because browsers allow `http://localhost` connections even from HTTPS pages, this works without any additional proxy.

**Run Ollama with CORS open** (required for the deployed URL):

```powershell
# Windows — set environment variable then start Ollama
$env:OLLAMA_ORIGINS = "*"
ollama serve
```

To make it permanent, add `OLLAMA_ORIGINS=*` to your System Environment Variables and restart Ollama.

```bash
# macOS / Linux
OLLAMA_ORIGINS="*" ollama serve
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

## Core Software Engineering Concepts

This project applies a range of fundamental software engineering principles. Each concept is documented here with the specific reason it was chosen.

---

### 1. Component-Based Architecture

**Where:** Every UI element is an isolated React component (`RosterGrid`, `EmployeePanel`, `AIPanel`, etc.)

**Why:** Breaks a complex UI into small, independently testable, reusable pieces. A change to `ChatImportModal` cannot accidentally break `RosterGrid` because they share no internal state. New features (e.g. a new modal) are added by creating a new component without touching existing ones — following the **Open/Closed Principle**.

---

### 2. Single Source of Truth (Centralised State Management)

**Where:** `src/store/rosterStore.js` — one Zustand store holds all app state: employees, assignments, rules, week, settings.

**Why:** Multiple components (`Header`, `RosterGrid`, `EmployeePanel`, `AIPanel`) all need to read and write the same roster data. Without a single store, each component would maintain its own copy of the data, leading to inconsistency (e.g. the grid showing different assignments than the export). Centralising state ensures every component always sees the same truth.

---

### 3. Persistence Layer (localStorage)

**Where:** Zustand `persist` middleware in `rosterStore.js` automatically serialises and deserialises state to `localStorage`.

**Why:** A roster takes significant effort to build. Without persistence, refreshing the browser would destroy all work. Since there is no backend, `localStorage` acts as the database. This is a deliberate architectural trade-off: zero infrastructure cost in exchange for data being device-local.

---

### 4. Separation of Concerns

**Where:** Business logic, UI, and data are strictly separated:
- `rosterEngine.js` — scheduling algorithm (pure functions, no UI imports)
- `excelExport.js` — file generation (no UI imports)
- `googleSheets.js` — data parsing (no UI imports)
- `constants.js` — domain constants (shift hours, colours)
- Components — UI only, call utilities via imports

**Why:** The scheduling engine can be tested, modified, or replaced without touching any component. If the Excel format changes, only `excelExport.js` needs updating. This directly reduces the scope of bugs and makes the codebase easier to reason about.

---

### 5. Pure Functions and Immutability

**Where:** `fillEmptySlots()`, `autoSchedule()`, `calcEmployeeHours()`, `calcEmployeeNights()`, `parseMessages()` — all return new data structures rather than mutating inputs.

**Why:** Pure functions with no side effects are predictable — the same inputs always produce the same outputs. This makes the scheduling logic trivially testable and prevents subtle bugs where one pass of the algorithm corrupts state used by the next pass. Zustand state updates also use immutable patterns (`{ ...state, employees: [...state.employees, newEmp] }`).

---

### 6. Multi-Pass Algorithm Design

**Where:** `fillEmptySlots()` in `rosterEngine.js` runs three sequential passes over the data:
1. **Pass 1** — fill all empty/understaffed slots (nights first)
2. **Night Quota Pass** — ensure every employee reaches their night shift target
3. **Pass 2** — top up anyone still below the minimum weekly hours

**Why:** A single-pass greedy algorithm cannot simultaneously optimise for coverage, night quotas, and minimum hours — these constraints interact. Breaking the problem into ordered passes makes each pass's responsibility clear, makes the algorithm easier to debug (you can inspect state between passes), and allows new constraints to be added as new passes without restructuring existing logic.

---

### 7. Greedy Algorithm with Priority Sorting

**Where:** Inside each pass of `fillEmptySlots()`, eligible employees are sorted by:
1. Night shift deficit (highest deficit first)
2. Explicit shift preference match
3. Hour deficit from minimum
4. Total hours (least first — fairness)

**Why:** A greedy algorithm makes locally optimal choices at each step. The priority sort ensures that employees most in need of a particular type of shift (e.g. haven't had their 2 nights yet) are assigned first, naturally satisfying constraints without backtracking. This produces good-enough results in O(n·m) time (employees × slots), which is fast enough for any real team size.

---

### 8. Rule-Based / RAG (Retrieval-Augmented Generation) System

**Where:** `RulesModal.jsx` + `rosterStore.js` rules array + `buildAIPrompt()` in `rosterEngine.js`.

**Why:** Hard-coding scheduling rules into the algorithm makes the system rigid — every new rule requires a code change and redeployment. Instead, rules are stored as plain text in the store (the "knowledge base"), retrieved at generation time, and injected into the AI's context prompt. This is the core pattern of RAG: augment a generative model with domain-specific retrieved knowledge. Managers can add, edit, or remove rules at runtime without touching code.

---

### 9. Natural Language Processing — Rule-Based Parsing

**Where:** `extractEntries()` in `ChatImportModal.jsx` — parses free-form WhatsApp messages into structured `{ person, action, days, shift }` objects using regular expressions.

**Why:** The input source (WhatsApp messages) is unstructured human language. Rather than forcing users to use a rigid form, the parser meets users where they are. A regex-based approach was chosen over a full AI parser because: (1) the message patterns are consistent and enumerable, (2) regex is deterministic and never hallucinates, (3) it works offline with zero latency. The AI is reserved only for genuinely ambiguous conversational Q&A where deterministic rules cannot help.

---

### 10. Proxy Pattern (Vite Dev Proxy)

**Where:** `vite.config.js` — proxies `/ollama/*` → `http://localhost:11434` and `/sheets-proxy/*` → `https://docs.google.com`.

**Why:** Browsers enforce the Same-Origin Policy, which blocks direct `fetch()` calls to `localhost:11434` (Ollama) and `docs.google.com` (Google Sheets) from a page on a different origin. The Vite proxy acts as a same-origin relay during development, forwarding requests to those servers transparently. This is the standard pattern for decoupling frontend development from CORS restrictions without building a backend.

---

### 11. Drag and Drop — Sensor Abstraction

**Where:** `App.jsx` — `DndContext` with `PointerSensor` and `KeyboardSensor` from `@dnd-kit/core`. Draggable employee cards (`useDraggable`) and droppable roster cells (`useDroppable`).

**Why:** Drag-and-drop is the most natural interaction for assigning employees to shifts — it mirrors the physical act of placing a name card on a schedule board. `@dnd-kit` was chosen over browser-native drag events because it provides: sensor abstraction (works with mouse, touch, and keyboard — accessibility), a `DragOverlay` for a smooth floating preview, and clean separation between drag state and drop handling via the `onDragEnd` callback.

---

### 12. Optimistic UI Updates

**Where:** `assignEmployee()` and `unassignEmployee()` in `rosterStore.js` update the Zustand store immediately — the grid re-renders instantly without waiting for any async operation.

**Why:** Since this app has no backend, all operations are synchronous. The UI reflects changes in under 1ms, giving the user immediate visual feedback when they drop an employee onto the grid or click to remove them. This is the same pattern used in production apps to hide network latency — here it also eliminates the need for loading states entirely.

---

### 13. Deterministic Colour Assignment

**Where:** `getEmployeeColor()` in `constants.js` — maps employee array index to a fixed 12-colour palette.

**Why:** Each employee must have a consistent, distinguishable colour throughout the UI (panel badge, roster chip, drag overlay). Using the array index as a deterministic key means the same employee always gets the same colour within a session, with no additional state needed. This is a simple form of **hash-based identity mapping**.

---

### 14. Data Normalisation

**Where:** The assignments store uses the key format `"dayIndex-shiftKey"` (e.g. `"2-B"`) mapping to an array of employee IDs.

**Why:** This is a normalised data model — employees are stored once in the `employees` array and referenced by ID everywhere else. There is no duplication of employee name or details inside `assignments`. Benefits: updating an employee's name only requires changing one record, not scanning all assignments; the assignment map is compact and fast to query; and deriving computed values (hours, nights) is a single pass over the map.

---

### 15. Constraint Satisfaction (Multi-Constraint Scheduling)

**Where:** `fillEmptySlots()` enforces simultaneously: coverage requirements, one-shift-per-day, max hours, min hours, night quota, employee shift preferences, employee day availability, employee-specific exceptions (Uminda, Lahiru).

**Why:** Workforce scheduling is a classic **Constraint Satisfaction Problem (CSP)**. Rather than using a full CSP solver (which would be overkill for a team of ~15 people), a structured greedy approach with priority sorting satisfies all constraints in practice. Each constraint is encoded once — in the eligibility filter, the sort key, or a dedicated pass — making it easy to add new constraints (e.g. "no one works 3 nights in a row") without breaking existing ones.

---

### 16. Progressive Disclosure (UX Pattern)

**Where:** Features are revealed progressively: the main view shows only the roster grid; Import, Rules, Settings, Chat Import, and AI are behind header buttons; each modal focuses on one task.

**Why:** Showing all features at once creates cognitive overload. A manager opening the app for the first time sees only the roster grid and a few clear actions. Advanced features (bulk import, rules editor, AI chat) are one click away but don't clutter the default view. This follows the UX principle that the most common action should be the most accessible.

---

### 17. Design System (Tokens + Flat Design)

**Where:** `tailwind.config.js` defines a token-based colour system (`primary`, `cta`). `constants.js` defines shift colours and employee colour palettes. All component styles use these tokens, not raw hex values. Design system generated using the **UI/UX Pro Max** skill (Flat Design style for workforce scheduling tools).

**Why:** A design token system means changing the primary colour requires editing one value in `tailwind.config.js`, not hunting through 50 component files. Flat design was chosen for this tool because it prioritises information density, fast rendering, and accessibility (WCAG AA contrast ratios) — appropriate for a data-heavy scheduling tool used by managers, not a marketing landing page.

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
