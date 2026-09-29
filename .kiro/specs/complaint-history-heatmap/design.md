# Design Document: Complaint History Heatmap

## Overview

The Complaint History Heatmap feature adds a dedicated `history.tsx` screen to the FixMyCity citizen app. It gives citizens a spatial and chronological view of historical complaint data — a heatmap overlay (simulated with `Circle` overlays from `react-native-maps`) and a scrollable timeline list — backed by a new authenticated backend endpoint `GET /api/complaints/history`.

The feature is entirely additive: no existing screens, routes, or models are modified. The new screen is reachable from `index.tsx` via a new `PrimaryButton` entry, and the new backend route is registered alongside the existing complaint routes.

### Key Design Decisions

- **No native Heatmap component**: The managed Expo workflow does not expose `react-native-maps`'s `Heatmap` component. Density is simulated using `Circle` overlays whose radius and fill opacity scale with the aggregate weight of complaints clustered within a ~100 m grid cell.
- **No new date-picker library**: Date range input uses plain `TextInput` fields (ISO date strings) to avoid adding a dependency. An `Alert`-based confirmation pattern is used for mobile-friendly feedback on invalid input.
- **Client-side stats**: Summary statistics (total, resolved count, resolution rate, most-reported category) are computed on the client from the fetched dataset — no extra aggregation endpoint needed.
- **Pagination via offset**: The timeline supports incremental loading using `?offset=N&limit=50` query parameters, consistent with the existing API style.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Citizen App (React Native / Expo)                          │
│                                                             │
│  index.tsx  ──push──►  history.tsx                          │
│                           │                                 │
│                    ┌──────┴──────┐                          │
│                    │             │                          │
│              HeatmapView   TimelineView                     │
│                    │             │                          │
│              (Circle overlays)  (FlatList)                  │
│                    │             │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│                     FilterPanel (ScrollView chips)          │
│                     StatsBar                                │
│                     ViewToggle                              │
│                           │                                 │
│                      api.get('/complaints/history?...')     │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP GET (JWT Bearer)
┌───────────────────────────▼─────────────────────────────────┐
│  Backend (Node.js / Express)                                │
│                                                             │
│  complaintRoutes.js                                         │
│    GET /api/complaints/history  ──►  getComplaintHistory()  │
│                                          │                  │
│                                   Complaint.find(filter)    │
│                                   .select(fields)           │
│                                   .sort({ createdAt: -1 })  │
│                                   .skip(offset).limit(lim)  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. `history.tsx` mounts → calls `fetchHistory(filters, offset=0)` → shows `ActivityIndicator`.
2. Backend validates params, queries MongoDB, returns complaint array.
3. Client computes `HeatmapPoint[]` (cluster grid → Circle props) and `SummaryStats`.
4. `HeatmapView` renders `Circle` overlays; `TimelineView` renders `FlatList` items.
5. Filter change → debounced re-fetch with `offset=0`, replaces dataset.
6. Scroll-to-end → fetch next page with `offset=currentLength`, appends to dataset.

---

## Components and Interfaces

### Backend

#### `getComplaintHistory` controller

```js
// controllers/complaintController.js (new export)
export const getComplaintHistory = async (req, res) => { ... }
```

Query parameters parsed: `category`, `severity`, `status`, `startDate`, `endDate`, `offset` (default 0), `limit` (default 50, max 500).

#### Route registration

```js
// routes/complaintRoutes.js — add before the /:id catch-all
router.get('/history', protect, getComplaintHistory);
```

### Frontend Components

#### `history.tsx` (screen)

Top-level screen component. Owns all state:

| State | Type | Description |
|---|---|---|
| `complaints` | `Complaint[]` | Current fetched dataset |
| `loading` | `boolean` | Initial/refresh load |
| `loadingMore` | `boolean` | Pagination load |
| `error` | `string \| null` | API error message |
| `viewMode` | `'heatmap' \| 'timeline'` | Active view |
| `filters` | `FilterState` | Active filter values |
| `hasMore` | `boolean` | Whether more pages exist |

#### `FilterPanel`

Horizontal `ScrollView` of chip `Pressable`s. Props:

```ts
interface FilterPanelProps {
  filters: FilterState;
  disabled: boolean;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}
```

#### `StatsBar`

Stateless component. Props:

```ts
interface StatsBarProps {
  stats: SummaryStats;
}
```

#### `HeatmapView`

Renders a `MapView` with `Circle` overlays derived from clustered complaint coordinates.

```ts
interface HeatmapViewProps {
  points: HeatmapPoint[];       // pre-computed cluster circles
  onClusterPress: (cluster: ClusterInfo) => void;
}
```

#### `TimelineView`

Renders a `FlatList` of complaint cards.

```ts
interface TimelineViewProps {
  complaints: Complaint[];
  onItemPress: (complaint: Complaint) => void;
  onEndReached: () => void;
  loadingMore: boolean;
}
```

#### `ViewToggle`

Simple two-option toggle bar.

```ts
interface ViewToggleProps {
  mode: 'heatmap' | 'timeline';
  onChange: (mode: 'heatmap' | 'timeline') => void;
}
```

---

## Data Models

### `FilterState` (client)

```ts
interface FilterState {
  category: string;   // 'ALL' | 'pothole' | 'garbage' | 'water_leak' | 'streetlight' | 'road_damage' | 'power_cut' | 'other'
  severity: string;   // 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'
  status:   string;   // 'ALL' | 'RECEIVED' | 'JOB_CREATED' | 'IN_PROGRESS' | 'COMPLETED'
  startDate: string;  // ISO date string or ''
  endDate:   string;  // ISO date string or ''
}

const DEFAULT_FILTERS: FilterState = {
  category: 'ALL', severity: 'ALL', status: 'ALL',
  startDate: '', endDate: '',
};
```

### `Complaint` (client, subset of Mongoose doc)

```ts
interface Complaint {
  _id: string;
  location: { lat: number; lng: number; address?: string };
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'RECEIVED' | 'JOB_CREATED' | 'IN_PROGRESS' | 'COMPLETED';
  description: string;
  createdAt: string;   // ISO 8601
  imageUrl?: string;
}
```

### `HeatmapPoint` (client, derived)

```ts
interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;      // sum of severity weights in the cluster cell
  count: number;       // number of complaints in the cell
  topCategory: string; // most common category in the cell
  // Circle rendering props (derived from weight)
  radius: number;      // metres — scales with weight
  fillColor: string;   // rgba — opacity scales with weight
  strokeColor: string;
}
```

### `SummaryStats` (client, derived)

```ts
interface SummaryStats {
  total: number;
  resolved: number;
  resolutionRate: number;  // integer 0–100
  topCategory: string;     // category label or '—'
}
```

### Backend query parameters

| Param | Type | Validation |
|---|---|---|
| `category` | string | optional, no validation (MongoDB query handles mismatch) |
| `severity` | string | optional |
| `status` | string | optional |
| `startDate` | string | optional, must parse as valid Date if present |
| `endDate` | string | optional, must parse as valid Date if present |
| `offset` | integer | optional, default 0, min 0 |
| `limit` | integer | optional, default 50, max 500 |

### Backend response shape (per complaint)

```json
{
  "_id": "...",
  "location": { "lat": 18.52, "lng": 73.85, "address": "..." },
  "category": "pothole",
  "severity": "HIGH",
  "status": "RECEIVED",
  "description": "...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "imageUrl": "https://..."
}
```

### Heatmap clustering algorithm

Complaints are bucketed into a grid using a fixed cell size of ~100 m (≈ 0.0009° lat/lng). For each cell:

```
cellKey = `${Math.round(lat / 0.0009)}_${Math.round(lng / 0.0009)}`
weight  = Σ severityWeight(complaint.severity)   // HIGH=3, MEDIUM=2, LOW=1
radius  = clamp(30 + weight * 15, 30, 300)       // metres
opacity = clamp(0.15 + weight * 0.05, 0.15, 0.7)
fillColor = rgba(239, 68, 68, opacity)            // red family
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Filter parameters are accepted for all valid combinations

*For any* combination of valid `category`, `severity`, `status`, `startDate`, and `endDate` values drawn from their respective allowed sets, a request to `GET /api/complaints/history` SHALL return HTTP 200 (not a 4xx error).

**Validates: Requirements 2.1**

---

### Property 2: Results are sorted descending by createdAt and have valid coordinates

*For any* dataset returned by `GET /api/complaints/history`, every complaint in the response SHALL have a non-null `location.lat` and `location.lng`, and for every adjacent pair `(complaints[i], complaints[i+1])`, `complaints[i].createdAt >= complaints[i+1].createdAt`.

**Validates: Requirements 2.2**

---

### Property 3: Category, severity, and status filters are exclusive

*For any* filter value `f` applied to `category`, `severity`, or `status`, every complaint returned by the API SHALL have its corresponding field equal to `f`. No complaint with a different value for that field SHALL appear in the results.

**Validates: Requirements 2.3, 2.4, 2.5**

---

### Property 4: Date range filter is inclusive

*For any* valid `startDate` S and `endDate` E where S ≤ E, every complaint returned by the API SHALL have `createdAt >= S` and `createdAt <= E`. No complaint outside the range SHALL appear in the results.

**Validates: Requirements 2.6**

---

### Property 5: Invalid date parameters produce HTTP 422 with an error field

*For any* string that is not a valid ISO 8601 date, passing it as `startDate` or `endDate` to `GET /api/complaints/history` SHALL produce an HTTP 422 response whose JSON body contains an `error` field.

**Validates: Requirements 2.7**

---

### Property 6: Response shape contains all required fields

*For any* complaint returned by `GET /api/complaints/history`, the response object SHALL contain the fields `_id`, `location`, `category`, `severity`, `status`, `description`, `createdAt`, and `imageUrl` (imageUrl may be null/undefined but the key must be selectable).

**Validates: Requirements 2.8**

---

### Property 7: Severity weight mapping is strictly ordered

*For any* complaint, the `severityWeight` function SHALL return 3 for `HIGH`, 2 for `MEDIUM`, and 1 for `LOW`, and the ordering `weight(HIGH) > weight(MEDIUM) > weight(LOW)` SHALL always hold.

**Validates: Requirements 3.2**

---

### Property 8: Heatmap points cover all complaint coordinates

*For any* non-empty complaint dataset, the set of `(latitude, longitude)` coordinates in the derived `HeatmapPoint[]` array SHALL contain a point whose cell encompasses every complaint's `location.lat` / `location.lng`. No complaint coordinate SHALL be silently dropped.

**Validates: Requirements 3.1**

---

### Property 9: Most-common-category is correct for any complaint list

*For any* non-empty list of complaints, the `topCategory` function SHALL return the category string that appears most frequently. If two categories tie, either may be returned, but the returned category SHALL appear at least as many times as any other category in the list.

**Validates: Requirements 3.4, 6.1**

---

### Property 10: Stats computation is correct for any dataset

*For any* complaint dataset of size N with R complaints having `status === 'COMPLETED'`, `computeStats` SHALL return `total === N`, `resolved === R`, `resolutionRate === Math.round((R / N) * 100)`, and `topCategory` equal to the most-frequent category. When N === 0, `resolutionRate` SHALL be 0 and `topCategory` SHALL be `'—'`.

**Validates: Requirements 6.1, 6.3, 6.4**

---

### Property 11: Filter reset always produces default state

*For any* `FilterState` value (regardless of what filters were previously set), calling the reset action SHALL produce a `FilterState` equal to `DEFAULT_FILTERS` (`category: 'ALL'`, `severity: 'ALL'`, `status: 'ALL'`, `startDate: ''`, `endDate: ''`).

**Validates: Requirements 5.6**

---

### Property 12: View mode switch preserves filter state and dataset

*For any* `FilterState` F and complaint dataset D, switching `viewMode` from `'heatmap'` to `'timeline'` or vice versa SHALL leave F and D unchanged (no re-fetch, no mutation).

**Validates: Requirements 7.5**

---

### Property 13: Unauthenticated requests are rejected with HTTP 401

*For any* request to `GET /api/complaints/history` that lacks a valid JWT Bearer token (absent, malformed, or expired), the API SHALL return HTTP 401 with a JSON body containing an `error` field.

**Validates: Requirements 8.1, 8.2**

---

## Error Handling

### Backend

| Condition | Response |
|---|---|
| Missing / invalid JWT | 401 `{ error: "Not authorised, no token" }` (from existing `authMiddleware`) |
| `startDate` or `endDate` not parseable as Date | 422 `{ error: "Invalid startDate: must be ISO 8601" }` |
| MongoDB query error | 500 `{ error: "Failed to fetch complaint history" }` |
| `offset` or `limit` not a non-negative integer | Silently coerced to defaults (0 and 50 respectively) |

### Frontend

| Condition | Behaviour |
|---|---|
| API returns 401 | `api.js` clears AsyncStorage and calls `router.replace('/login')` — existing handler, no new code needed |
| API returns any other error | `error` state set; screen shows error message + "Retry" `Pressable` |
| Empty dataset | Both `HeatmapView` and `TimelineView` show "No complaints found for the selected filters." |
| Invalid date text input | `Alert.alert` shown inline; filter not applied until valid |
| Pagination fetch fails | `loadingMore` reset to false; existing data preserved; toast-style error shown |

---

## Testing Strategy

### Unit Tests (Jest)

Focus on pure functions that can be tested in isolation without React Native rendering:

- `severityWeight(severity)` — verify mapping and ordering
- `clusterComplaints(complaints)` — verify all coordinates are covered, weights sum correctly
- `computeStats(complaints)` — verify total, resolved, rate, topCategory for various datasets including empty
- `topCategory(complaints)` — verify most-frequent category returned
- `buildQueryString(filters, offset)` — verify correct URL query string construction
- `formatDate(isoString)` — verify DD MMM YYYY output for various dates
- `getComplaintHistory` controller — verify filter application, date validation (422), sort order, field projection

### Property-Based Tests (fast-check, Jest)

The project uses Jest on the backend. Add `fast-check` as a dev dependency for property-based tests.

Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: complaint-history-heatmap, Property N: <property text>`

| Property | Test file | Generator |
|---|---|---|
| P1: Filter combinations accepted | `__tests__/complaintHistory.property.test.js` | `fc.record({ category: fc.constantFrom(...), severity: ..., status: ... })` |
| P2: Results sorted + valid coords | `__tests__/complaintHistory.property.test.js` | `fc.array(fc.record({ createdAt: fc.date(), location: ... }))` |
| P3: Filter exclusivity | `__tests__/complaintHistory.property.test.js` | `fc.constantFrom('pothole', 'garbage', ...)` + dataset |
| P4: Date range inclusive | `__tests__/complaintHistory.property.test.js` | `fc.tuple(fc.date(), fc.date()).map(sort)` |
| P5: Invalid date → 422 | `__tests__/complaintHistory.property.test.js` | `fc.string().filter(s => isNaN(Date.parse(s)))` |
| P6: Response shape | `__tests__/complaintHistory.property.test.js` | `fc.array(complaintArbitrary)` |
| P7: Severity weight ordering | `__tests__/complaintHistoryUtils.property.test.js` | `fc.constantFrom('LOW','MEDIUM','HIGH')` |
| P8: Heatmap covers all coords | `__tests__/complaintHistoryUtils.property.test.js` | `fc.array(complaintArbitrary, { minLength: 1 })` |
| P9: topCategory correctness | `__tests__/complaintHistoryUtils.property.test.js` | `fc.array(complaintArbitrary, { minLength: 1 })` |
| P10: computeStats correctness | `__tests__/complaintHistoryUtils.property.test.js` | `fc.array(complaintArbitrary)` |
| P11: Filter reset idempotence | `__tests__/complaintHistoryUtils.property.test.js` | `fc.record({ category: ..., severity: ..., ... })` |
| P12: View mode preserves state | `__tests__/complaintHistoryUtils.property.test.js` | `fc.record(filterStateArbitrary)` + `fc.array(complaintArbitrary)` |
| P13: Unauthenticated → 401 | `__tests__/complaintHistory.property.test.js` | `fc.option(fc.string())` (absent/malformed tokens) |

### Integration Tests

- `GET /api/complaints/history` with a real MongoDB test database (using `mongodb-memory-server`):
  - No params → returns up to 500 docs with valid coords, sorted descending
  - With each filter type → returns only matching docs
  - With invalid date → returns 422
  - Without token → returns 401

### Example / Snapshot Tests (React Native Testing Library)

- `FilterPanel` renders all category, severity, and status chips
- `StatsBar` renders correct values for a known dataset
- `ViewToggle` switches between heatmap and timeline
- `TimelineView` renders empty-state when dataset is empty
- `HeatmapView` renders empty-state when dataset is empty
- `history.tsx` shows `ActivityIndicator` on mount before API resolves
- `history.tsx` shows error + retry on API failure
- `history.tsx` shows login redirect on 401
