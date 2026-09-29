# Implementation Plan: Complaint History Heatmap

## Overview

Implement the Complaint History Heatmap feature across the Node.js/Express backend and React Native citizen app. Tasks follow the layered architecture from the design: backend endpoint first, then client-side utility functions, then UI components, then the full screen, and finally navigation wiring.

## Tasks

- [x] 1. Implement `getComplaintHistory` backend controller and route
  - [x] 1.1 Add `getComplaintHistory` to `backend/controllers/complaintController.js`
    - Parse query params: `category`, `severity`, `status`, `startDate`, `endDate`, `offset` (default 0), `limit` (default 50, max 500)
    - Validate `startDate` and `endDate` — return HTTP 422 with `{ error: "Invalid startDate: must be ISO 8601" }` if not parseable
    - Build MongoDB filter: `location.lat` and `location.lng` must exist; apply each non-empty param
    - Query: `Complaint.find(filter).select('_id location category severity status description createdAt imageUrl').sort({ createdAt: -1 }).skip(offset).limit(limit)`
    - Return the array as JSON
    - _Requirements: 2.1–2.8, 8.1–8.2_
  - [x] 1.2 Register the route in `backend/routes/complaintRoutes.js`
    - Add `router.get('/history', protect, getComplaintHistory)` before the `/:id` catch-all
    - Import `getComplaintHistory` in the route file
    - _Requirements: 8.1_
  - [ ]* 1.3 Write property tests for the history endpoint (Properties 1–6, 13)
    - File: `backend/__tests__/complaintHistory.property.test.js`
    - P1: All valid filter combinations return HTTP 200
    - P2: Results sorted descending by `createdAt`, all have valid coordinates
    - P3: Category/severity/status filters are exclusive
    - P4: Date range filter is inclusive
    - P5: Invalid date string → HTTP 422 with `error` field
    - P6: Every response item has all 8 required fields
    - P13: Missing/invalid JWT → HTTP 401

- [x] 2. Implement client-side utility functions
  - [x] 2.1 Create `FixMyCityCitizen_App/FixMyCityCitizen_App/utils/historyUtils.js`
    - Export `severityWeight(severity)` → `{ HIGH: 3, MEDIUM: 2, LOW: 1 }[severity] ?? 1`
    - Export `clusterComplaints(complaints)` → groups by `Math.round(lat/0.0009)_Math.round(lng/0.0009)` cell key, returns `HeatmapPoint[]` with `radius = clamp(30 + weight*15, 30, 300)` and `fillColor = rgba(239,68,68,opacity)` where `opacity = clamp(0.15 + weight*0.05, 0.15, 0.7)`
    - Export `computeStats(complaints)` → returns `{ total, resolved, resolutionRate, topCategory }` where `resolutionRate = Math.round((resolved/total)*100)` or 0, `topCategory = '—'` when empty
    - Export `topCategory(complaints)` → returns most-frequent `category` string
    - Export `buildQueryString(filters, offset)` → builds URL query string from `FilterState`, omitting `ALL` values and empty strings
    - Export `formatDate(isoString)` → returns `DD MMM YYYY` formatted string
    - _Requirements: 3.2, 6.1–6.4_
  - [ ]* 2.2 Write property tests for utility functions (Properties 7–12)
    - File: `backend/__tests__/complaintHistoryUtils.property.test.js`
    - P7: `severityWeight` ordering is strictly HIGH > MEDIUM > LOW
    - P8: `clusterComplaints` covers all input coordinates
    - P9: `topCategory` returns most-frequent category
    - P10: `computeStats` returns correct total, resolved, rate, topCategory for any dataset
    - P11: Filter reset always produces `DEFAULT_FILTERS`
    - P12: View mode switch does not mutate filter state or dataset

- [x] 3. Implement `FilterPanel` component
  - [x] 3.1 Create `FixMyCityCitizen_App/FixMyCityCitizen_App/components/FilterPanel.jsx`
    - Renders a horizontal `ScrollView` with chip rows for category, severity, and status
    - Category chips: ALL, pothole, garbage, water_leak, streetlight, road_damage, power_cut, other
    - Severity chips: ALL, LOW, MEDIUM, HIGH
    - Status chips: ALL, RECEIVED, JOB_CREATED, IN_PROGRESS, COMPLETED
    - Date range: two `TextInput` fields for `startDate` and `endDate` (ISO date strings); show `Alert.alert` on invalid input
    - "Reset Filters" `Pressable` calls `onReset`
    - All controls disabled when `disabled` prop is true
    - Active chip highlighted with `backgroundColor: '#2563EB'`
    - _Requirements: 5.1–5.7_

- [x] 4. Implement `StatsBar` component
  - [x] 4.1 Create `FixMyCityCitizen_App/FixMyCityCitizen_App/components/StatsBar.jsx`
    - Accepts `stats: { total, resolved, resolutionRate, topCategory }` prop
    - Renders three stat blocks in a row: "Total" count, "Resolved %" rate, "Top Issue" category
    - Uses same card style as existing screens (white background, `#F3F4F6` border, `#1A1A2E` text)
    - _Requirements: 6.1–6.4_

- [x] 5. Implement `ViewToggle` component
  - [x] 5.1 Create `FixMyCityCitizen_App/FixMyCityCitizen_App/components/ViewToggle.jsx`
    - Accepts `mode: 'heatmap' | 'timeline'` and `onChange` props
    - Renders two `Pressable` buttons: "🗺 Heatmap" and "📋 Timeline"
    - Active button styled with `backgroundColor: '#2563EB'`, inactive with white + border
    - _Requirements: 7.1–7.4_

- [x] 6. Implement `HeatmapView` component
  - [x] 6.1 Create `FixMyCityCitizen_App/FixMyCityCitizen_App/components/HeatmapView.jsx`
    - Accepts `points: HeatmapPoint[]` and `onClusterPress` props
    - Renders a `MapView` (same default region as `map.tsx`: Pune 18.5204, 73.8567) with `showsUserLocation`
    - For each `HeatmapPoint`, renders a `Circle` overlay with the computed `radius`, `fillColor`, `strokeColor`
    - Renders a transparent `Marker` at each cluster centre to capture taps; `onPress` calls `onClusterPress({ count, topCategory, latitude, longitude })`
    - When `points` is empty, renders an overlay `View` with text "No complaints found for the selected filters."
    - _Requirements: 3.1–3.5_

- [x] 7. Implement `TimelineView` component
  - [x] 7.1 Create `FixMyCityCitizen_App/FixMyCityCitizen_App/components/TimelineView.jsx`
    - Accepts `complaints`, `onItemPress`, `onEndReached`, `loadingMore` props
    - Renders a `FlatList` sorted by `createdAt` descending (data already sorted from API)
    - Each row: category emoji, category label, severity badge (colour-coded), status label, address, `formatDate(createdAt)`
    - `onEndReachedThreshold={0.3}` triggers `onEndReached` for pagination
    - Footer shows `ActivityIndicator` when `loadingMore` is true
    - Empty state: "No complaints found for the selected filters."
    - _Requirements: 4.1–4.5_

- [x] 8. Implement `history.jsx` screen
  - [x] 8.1 Create `FixMyCityCitizen_App/FixMyCityCitizen_App/app/history.jsx`
    - State: `complaints`, `loading`, `loadingMore`, `error`, `viewMode` (default `'heatmap'`), `filters` (default `DEFAULT_FILTERS`), `hasMore`
    - On mount: call `fetchHistory(DEFAULT_FILTERS, 0)`
    - `fetchHistory(filters, offset)`: builds query string via `buildQueryString`, calls `api.get('/complaints/history?' + qs)`, replaces dataset on offset=0, appends on offset>0, sets `hasMore = response.length === 50`
    - On filter change: reset offset to 0, replace dataset
    - On `onEndReached`: if `hasMore && !loadingMore`, fetch next page
    - Computes `heatmapPoints = clusterComplaints(complaints)` and `stats = computeStats(complaints)` via `useMemo`
    - Renders: header with back button, `StatsBar`, `ViewToggle`, `FilterPanel`, then either `HeatmapView` or `TimelineView` based on `viewMode`
    - Detail modal: shown when a timeline item is tapped — displays `description`, `imageUrl`, `location.address`, `severity`, `status`, `createdAt`
    - Cluster callout: shown when a heatmap cluster is tapped — displays count and `topCategory`
    - Loading state: `ActivityIndicator` centred
    - Error state: error message + "Retry" `Pressable`
    - _Requirements: 1.1–1.3, 2.9–2.10, 3.3–3.5, 4.3, 5.5–5.7, 6.2, 7.2–7.5, 8.3_

- [x] 9. Add history navigation to home screen
  - [x] 9.1 Add "📊 Issue History & Heatmap" button to `FixMyCityCitizen_App/FixMyCityCitizen_App/app/index.tsx`
    - Add a new `PrimaryButton` with `label="📊  Issue History & Heatmap"` and `onPress={() => router.push('/history')}`
    - Place it after the "View Hotspot Map" button
    - _Requirements: 1.1_

- [x] 10. Final checkpoint — ensure all tests pass
  - Run `node --experimental-vm-modules node_modules/jest/bin/jest.js --passWithNoTests` in `backend/`
  - Verify no regressions in existing test suites
  - Ensure all new property tests pass

## Notes

- Tasks marked with `*` are optional property tests — skip for a faster MVP
- `clusterComplaints` cell size is ~100 m (0.0009°); `radius` and `opacity` clamp values are defined in the design
- The `history` endpoint is registered before `/:id` in `complaintRoutes.js` to avoid route shadowing
- `fast-check` is already a dev dependency in `backend/package.json`
- No new npm packages are required for the citizen app — `react-native-maps` `Circle` and `Marker` are already available
