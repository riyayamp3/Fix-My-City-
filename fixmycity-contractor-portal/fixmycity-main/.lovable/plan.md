

# Civic Repair Contractor Dashboard

A stunning, dark-themed civic-tech dashboard for contractors managing municipal repair jobs.

## Pages & Layout

### Global Shell
- **Sidebar** (desktop) / **Bottom nav** (mobile): Logo, nav links (Dashboard, Jobs, My Bids, My Jobs, Profile), contractor avatar + reputation score badge
- Dark glassmorphic sidebar with subtle blur, 1px border at `rgba(255,255,255,0.06)`

### 1. Dashboard (Home)
- **Stats row**: 4 glowing metric cards — Open Jobs nearby, Active Bids, Jobs In Progress, Reputation Score (animated ring)
- **Quick Actions**: "Browse Jobs" and "View My Jobs" prominent buttons
- **Recent Activity feed**: timeline of latest bid submissions, job awards, status changes
- **Upcoming Deadlines**: compact list of jobs with countdown timers

### 2. Job Discovery (Open Jobs)
- **3 Tabs**: Open Jobs · My Bids · Awarded to Me
- **Filter bar**: Category, Severity, Ward/Area dropdowns + search
- **Job Cards**: Title, location with map pin, severity badge (color-coded pill), category tag, deadline with countdown, "Place Bid" button
- Cards have hover scale + glow micro-interaction

### 3. Bid Submission (Modal/Sheet)
- Triggered from job card's "Place Bid" button
- **Fields**: Proposed amount (optional), Proposed completion time (select), Short note (textarea)
- Blue accent submit button with press animation
- Success toast on submission

### 4. My Jobs (Active Work)
- List of awarded jobs with status pipeline visualization
- **Status stepper**: Accepted → En Route → Work in Progress → Completed (horizontal progress dots)
- Each job expandable to show:
  - Full job details (description, location, severity, deadline)
  - **Status update buttons** — next-step action button prominent in blue
  - **Photo upload** area with drag-drop zone
  - **Notes section** — textarea for on-site notes
- Completion triggers a success animation

### 5. Contractor Profile
- Avatar, name, contact info
- **Reputation Score** — large animated circular progress with score
- **Score breakdown**: Timeliness, Quality, Jobs Completed stats
- **Bid History** — table of past bids with status (Won/Lost/Pending)
- **Job History** — completed jobs with ratings

## Design System
- Background: `#0A0A0A`, cards: `#1F1F1F`, borders: `rgba(255,255,255,0.06)`
- Accent blue `#3B82F6` for primary actions, green `#10B981` for success, amber `#F59E0B` warnings, red `#EF4444` critical
- 12-16px rounded corners, glassmorphic card effects
- Hover: `scale(1.02)` + brightness boost; Click: `scale(0.98)` press
- Lucide icons throughout
- Inter font, clear typographic hierarchy
- Mobile-first responsive: sidebar collapses to bottom nav, cards stack vertically

## Data
All mock data — realistic Indian municipal job titles (pothole repair, streetlight fix, drain clearing), locations, contractor names, and bid amounts.

