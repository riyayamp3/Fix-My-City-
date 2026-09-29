# FixMyCity — Citizen Mobile App

A React Native (Expo) app that lets citizens report civic issues directly from their phones. Built for speed, trust, and accessibility — with AI-assisted reporting, voice input, a live hotspot map, gamified impact points, and a complaint history heatmap.

---

## What It Does

Citizens can report broken infrastructure, garbage, water leaks, and other civic problems in under a minute. Every report is verified with a live photo and GPS location, then routed to the relevant authority portal for action. Citizens earn Impact Points for their contributions and can track recurring problem areas through an interactive heatmap.

---

## Key Features

### 📷 Live Photo Capture
- Camera-only capture (gallery not allowed) to prevent fake or old photos
- Photo is immediately uploaded to Cloudinary on capture
- GPS coordinates are recorded at the exact moment of the shutter press
- A "✅ VERIFIED" badge confirms both photo and location are locked in

### ✨ AI Autofill
- After capturing a photo, tap "AI Autofill" to let AI analyze the image
- The AI identifies the issue and auto-fills:
  - **Category** — pothole, garbage, water leak, streetlight, road damage, power cut, other
  - **Severity** — low, medium, high
  - **Description** — a short, clear complaint description
- If the AI doesn't detect a civic issue, the citizen is prompted to retake the photo
- If AI is unavailable, the form falls back to manual entry gracefully

### 🎙️ Voice Input (Multilingual)
- Citizens can dictate their complaint description instead of typing
- Powered by Sarvam AI speech-to-text
- Supports 8 Indian languages: English, Hindi, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati
- Auto-detects language or citizen can select manually
- Auto-stops after 60 seconds

### 📍 GPS Location Verification
- Location is captured automatically on screen load using high-accuracy GPS
- Reverse geocoded to a detailed human-readable address
- Location must be verified before a complaint can be submitted
- Citizens can retry if location fails

### 🗺️ Hotspot Map
- Interactive map showing all active civic complaints in the area
- Color-coded pins by severity: 🔴 High, 🟠 Medium, 🟢 Low
- Filter by severity level
- Tap any pin to see complaint details, photo, status, and address
- Category summary strip at the bottom (pothole count, garbage count, etc.)

### 📊 Issue History & Heatmap
- Dedicated screen showing historical complaint data across the city
- **Heatmap view** — density overlay using Circle overlays sized and colored by complaint severity weight (HIGH=3, MEDIUM=2, LOW=1); tap a cluster to see count and top issue type
- **Timeline view** — chronological scrollable list of all complaints with severity badges, status, address, and date; tap for full detail modal
- **Filters** — filter by category, severity, status, and date range; reset with one tap
- **Stats bar** — total complaints, resolution rate %, and top issue category
- Paginated loading (50 per page, auto-loads on scroll)

### 🏆 Impact Points & Gamification
- Citizens earn points for civic contributions:
  - **+1 pt** for every complaint submitted
  - **+10 pts** when a complaint is verified by authorities
  - **+20 pts** when a complaint is resolved (COMPLETED)
  - **+5 pts** for upvoting another citizen's complaint
- Three-tier progression: 🥉 Bronze (0–199) → 🥈 Silver (200–499) → 🥇 Gold (500+)
- Idempotent — the same event never awards points twice

### ⭐ Profile & Points
- View total Impact Points and current tier badge
- Visual progress bar toward Gold tier
- Full points history showing every earning event with reason, description, and date
- Pull-to-refresh

### 🏅 Leaderboard
- Top 20 citizens ranked by total Impact Points
- Shows username, tier badge, and point total for each entry
- Your own row is highlighted in blue
- 🥇🥈🥉 medals for top 3

### � Upvote Complaints
- Tap "Upvote this Issue" on any complaint detail screen to confirm you've seen the same problem
- Earns 5 Impact Points for the upvoter
- Self-upvoting and duplicate upvoting are blocked

### �📋 My Complaints
- View all complaints submitted by the logged-in citizen
- Real-time status tracking: Received → Job Created → In Progress → Resolved
- Pull-to-refresh
- Tap any complaint to view full details and upvote

### 🔐 Authentication
- JWT-based login and signup (30-day token expiry)
- Auto-logout and redirect to login when token expires
- Role-enforced: only Citizens can log in (Authority/Contractor use separate web portals)
- Token stored securely in AsyncStorage

---

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `/` | Dashboard with all quick actions |
| Login | `/login` | Citizen sign-in |
| Sign Up | `/signup` | New citizen registration |
| Report Issue | `/report` | Full complaint submission flow |
| My Complaints | `/my-complaints` | Complaint history and status |
| Hotspot Map | `/map` | Live map of active civic issues |
| Issue History | `/history` | Heatmap + timeline of all historical complaints |
| Complaint Detail | `/complaint/[id]` | Single complaint view with upvote |
| Profile | `/profile` | Impact Points, tier, and points history |
| Leaderboard | `/leaderboard` | Top 20 citizens by Impact Points |
| Success | `/success` | Post-submission confirmation |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo (SDK 54) |
| Routing | Expo Router (file-based) |
| Language | TypeScript / JavaScript |
| Image Picker | expo-image-picker |
| Location | expo-location |
| Audio | expo-av |
| Maps | react-native-maps (MapView, Marker, Circle, Callout) |
| Storage | @react-native-async-storage/async-storage |
| HTTP | Fetch API (custom `api.js` wrapper with auto-logout on 401) |
| AI Analysis | Backend → Gemini AI via `/api/complaints/analyze-image` |
| Voice STT | Sarvam AI via `/api/voice/transcribe` |
| Image Storage | Cloudinary (via backend `/api/upload`) |
| Auth | JWT Bearer tokens (30-day expiry) |

---

## Project Structure

```
app/
  _layout.tsx            # Root layout (Expo Router stack)
  index.tsx              # Home screen
  login.tsx              # Login screen
  signup.tsx             # Sign up screen
  report.tsx             # Report issue screen (AI + voice + GPS)
  my-complaints.tsx      # Complaint history
  map.tsx                # Hotspot map
  history.jsx            # Issue history heatmap + timeline
  profile.jsx            # Impact Points and tier
  leaderboard.jsx        # Top 20 citizens leaderboard
  success.tsx            # Submission success
  complaint/
    [id].tsx             # Complaint detail + upvote

components/
  PrimaryButton.tsx      # Reusable button
  InputField.tsx         # Reusable text input
  ComplaintCard.js       # Complaint list item
  VoiceMicButton.tsx     # Mic button with recording state
  TierBadge.jsx          # Bronze/Silver/Gold tier badge
  FilterPanel.jsx        # History screen filter chips
  StatsBar.jsx           # History screen stats (total, rate, top issue)
  ViewToggle.jsx         # Heatmap / Timeline toggle
  HeatmapView.jsx        # Circle overlay heatmap component
  TimelineView.jsx       # Paginated complaint timeline list

hooks/
  useVoiceRecorder.ts    # Voice recording + Sarvam STT hook

services/
  api.js                 # HTTP client with auto-logout on 401
  authService.js         # Login, logout, token management
  complaintService.js    # Complaint API calls

utils/
  historyUtils.js        # Clustering, stats, query builder, date formatter
```

---

## Report Flow (Step by Step)

```
1. Open app → Home screen
2. Tap "📷 Report an Issue"
3. GPS location is captured automatically
4. Tap the camera area → live photo taken
5. Photo uploads to Cloudinary in the background
6. Tap "✨ AI Autofill" → AI analyzes the image
7. Category, severity, and description are auto-filled
8. Edit any field if needed
9. Add/edit description (or use 🎙️ voice input)
10. Tap "Submit Report" → complaint sent to backend
11. Redirected to success screen
12. +1 Impact Point awarded for the submission
```

---

## Complaint Categories

| Emoji | Category |
|-------|----------|
| 🕳️ | Pothole |
| 🗑️ | Garbage |
| 💧 | Water Leak |
| 💡 | Streetlight |
| 🚧 | Road Damage |
| ⚡ | Power Cut |
| ⚠️ | Other |

---

## Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| High | 🔴 Red | Immediate danger or major disruption |
| Medium | 🟠 Amber | Significant issue needing prompt attention |
| Low | 🟢 Green | Minor issue, can be scheduled |

---

## Complaint Status Lifecycle

```
RECEIVED → JOB_CREATED → IN_PROGRESS → COMPLETED
```

---

## Impact Points Reference

| Action | Points |
|--------|--------|
| Submit a complaint | +1 |
| Complaint verified by authority | +10 |
| Complaint resolved (COMPLETED) | +20 |
| Upvote another citizen's complaint | +5 |

| Tier | Points Required |
|------|----------------|
| 🥉 Bronze | 0 – 199 |
| 🥈 Silver | 200 – 499 |
| 🥇 Gold | 500+ |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone, or Android/iOS simulator

### Install & Run

```bash
cd FixMyCityCitizen_App
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android / `i` for iOS simulator.

### Configure API URL

Update the base URL in `services/api.js` to point to your backend:

```js
const BASE_URL = "http://<your-machine-ip>:5000/api";
```

Use your machine's local IP (not `localhost`) when testing on a physical device.

---

## Backend Dependencies

This app requires the FixMyCity backend (`/backend`) to be running. Key endpoints used:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Citizen login |
| `/api/auth/signup` | POST | Citizen registration |
| `/api/complaints` | POST | Submit complaint |
| `/api/complaints/my` | GET | Fetch citizen's complaints |
| `/api/complaints/:id` | GET | Single complaint detail |
| `/api/complaints/analyze-image` | POST | AI image analysis |
| `/api/complaints/hotspots` | GET | Active complaints for map |
| `/api/complaints/history` | GET | Historical complaints (filtered) |
| `/api/complaints/:id/verification` | PATCH | Update verification status |
| `/api/upload` | POST | Upload image to Cloudinary |
| `/api/voice/transcribe` | POST | Voice-to-text (Sarvam AI) |
| `/api/rewards/me` | GET | Citizen's points, tier, ledger |
| `/api/rewards/leaderboard` | GET | Top 20 citizens by points |
| `/api/rewards/upvote/:id` | POST | Upvote a complaint (+5 pts) |
| `/api/rewards/redeem` | POST | Reward redemption (coming soon) |

---

## Anti-Fraud Measures

- Camera-only photo capture (no gallery uploads)
- GPS coordinates locked at time of photo capture
- `capturedAt` ISO timestamp sent with every complaint — backend flags submissions older than 2 minutes
- `deviceVerified: true` flag on all submissions
- Location must be verified before submission is allowed
- JWT tokens expire after 30 days; app auto-redirects to login on expiry
