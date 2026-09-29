# Requirements Document

## Introduction

The Complaint History Heatmap feature extends the FixMyCity citizen app with a dedicated screen that lets citizens visualise the historical distribution and resolution patterns of reported issues in their area. The screen offers two complementary views: a heatmap overlay on the existing map (showing complaint density by location) and a chronological timeline list (showing complaints ordered by date). Filters for category, severity, status, and date range allow citizens to drill into specific problem types, while summary statistics surface recurring hotspots and resolution rates. The goal is to support data-driven awareness and community accountability without requiring any changes to the existing Hotspot Map screen.

---

## Glossary

- **History_Screen**: The new React Native / Expo screen (`history.tsx`) that hosts the heatmap and timeline views.
- **Heatmap_View**: The map sub-view that renders a density overlay derived from historical complaint coordinates.
- **Timeline_View**: The scrollable list sub-view that renders complaints sorted by `createdAt` descending.
- **History_API**: The new backend endpoint `GET /api/complaints/history` that returns filtered historical complaint data.
- **Filter_Panel**: The UI component that exposes category, severity, status, and date-range filter controls.
- **Complaint**: A citizen-reported civic issue stored in the MongoDB `Complaint` collection, as defined by the existing Mongoose schema.
- **Heatmap_Point**: A coordinate-weight pair `{ latitude, longitude, weight }` derived from a Complaint and consumed by the map heatmap renderer.
- **Summary_Stats**: Aggregated metrics (total count, resolution rate, most-reported category) computed from the filtered complaint set.
- **Category**: One of `pothole`, `garbage`, `water_leak`, `streetlight`, `road_damage`, `power_cut`, `other`.
- **Severity**: One of `LOW`, `MEDIUM`, `HIGH`.
- **Status**: One of `RECEIVED`, `JOB_CREATED`, `IN_PROGRESS`, `COMPLETED`.

---

## Requirements

### Requirement 1: History Screen Navigation

**User Story:** As a citizen, I want to navigate to a dedicated history screen from the main app, so that I can access complaint history without disrupting my current map view.

#### Acceptance Criteria

1. THE `History_Screen` SHALL be accessible via a navigation entry point in the existing app tab bar or home screen.
2. WHEN the citizen taps the history navigation entry, THE `History_Screen` SHALL load and display within 300 ms of the tap event on a device with an active network connection.
3. WHEN the citizen presses the back control on `History_Screen`, THE app SHALL navigate back to the previous screen without data loss on the previous screen.

---

### Requirement 2: Fetch Historical Complaint Data

**User Story:** As a citizen, I want the app to load historical complaint data from the backend, so that I can see past issues reported in my area.

#### Acceptance Criteria

1. THE `History_API` SHALL accept optional query parameters: `category` (string), `severity` (string), `status` (string), `startDate` (ISO 8601 date string), `endDate` (ISO 8601 date string).
2. WHEN a request is received with no query parameters, THE `History_API` SHALL return all complaints that have a valid `location.lat` and `location.lng`, sorted by `createdAt` descending, limited to 500 documents.
3. WHEN a request is received with a `category` parameter, THE `History_API` SHALL return only complaints whose `category` field matches the provided value.
4. WHEN a request is received with a `severity` parameter, THE `History_API` SHALL return only complaints whose `severity` field matches the provided value.
5. WHEN a request is received with a `status` parameter, THE `History_API` SHALL return only complaints whose `status` field matches the provided value.
6. WHEN a request is received with `startDate` and `endDate` parameters, THE `History_API` SHALL return only complaints whose `createdAt` falls within the inclusive date range `[startDate, endDate]`.
7. IF a `startDate` or `endDate` parameter is not a valid ISO 8601 date string, THEN THE `History_API` SHALL return HTTP 422 with a JSON body containing an `error` field describing the invalid parameter.
8. THE `History_API` SHALL return each complaint with the fields: `_id`, `location`, `category`, `severity`, `status`, `description`, `createdAt`, `imageUrl`.
9. WHEN the `History_Screen` mounts, THE `History_Screen` SHALL call `History_API` with the current active filter values and display a loading indicator until the response is received.
10. IF the `History_API` call fails, THEN THE `History_Screen` SHALL display an error message and a retry control without crashing.

---

### Requirement 3: Heatmap View

**User Story:** As a citizen, I want to see a heatmap of complaint density on a map, so that I can visually identify recurring problem areas at a glance.

#### Acceptance Criteria

1. WHEN the citizen selects the heatmap view mode, THE `Heatmap_View` SHALL render a density overlay on the map using the `location.lat` and `location.lng` of each complaint in the current filtered dataset.
2. THE `Heatmap_View` SHALL assign a higher visual weight to complaints with `severity` equal to `HIGH` than to complaints with `severity` equal to `MEDIUM`, and a higher weight to `MEDIUM` than to `LOW`, using the weight mapping `HIGH=3`, `MEDIUM=2`, `LOW=1`.
3. WHEN the filtered dataset contains zero complaints, THE `Heatmap_View` SHALL display an empty-state message: "No complaints found for the selected filters."
4. WHEN the citizen taps a cluster area on the heatmap, THE `Heatmap_View` SHALL display a summary callout showing the count of complaints at that location and the most common category.
5. THE `Heatmap_View` SHALL re-render the overlay within 500 ms of a filter change that produces a new dataset.

---

### Requirement 4: Timeline View

**User Story:** As a citizen, I want to browse a chronological list of past complaints, so that I can track the history and resolution progress of issues over time.

#### Acceptance Criteria

1. WHEN the citizen selects the timeline view mode, THE `Timeline_View` SHALL render a scrollable list of complaints sorted by `createdAt` descending.
2. THE `Timeline_View` SHALL display for each complaint: the category emoji, category label, severity badge, status label, address (if available), and formatted `createdAt` date in `DD MMM YYYY` format.
3. WHEN the citizen taps a complaint item in `Timeline_View`, THE `Timeline_View` SHALL display a detail modal showing all available complaint fields including `description`, `imageUrl` (if present), `location.address`, `severity`, `status`, and `createdAt`.
4. WHEN the filtered dataset contains zero complaints, THE `Timeline_View` SHALL display an empty-state message: "No complaints found for the selected filters."
5. THE `Timeline_View` SHALL support incremental loading: WHEN the citizen scrolls to within 5 items of the end of the list, THE `Timeline_View` SHALL request the next page of results from `History_API` using an `offset` query parameter.

---

### Requirement 5: Filter Panel

**User Story:** As a citizen, I want to filter complaint history by category, severity, status, and date range, so that I can focus on the specific types of issues I care about.

#### Acceptance Criteria

1. THE `Filter_Panel` SHALL expose a category selector with the values: `ALL`, `pothole`, `garbage`, `water_leak`, `streetlight`, `road_damage`, `power_cut`, `other`.
2. THE `Filter_Panel` SHALL expose a severity selector with the values: `ALL`, `LOW`, `MEDIUM`, `HIGH`.
3. THE `Filter_Panel` SHALL expose a status selector with the values: `ALL`, `RECEIVED`, `JOB_CREATED`, `IN_PROGRESS`, `COMPLETED`.
4. THE `Filter_Panel` SHALL expose a date-range picker with a `Start Date` and `End Date` control, each accepting a calendar date selection.
5. WHEN the citizen changes any filter value, THE `History_Screen` SHALL re-fetch data from `History_API` with the updated filter parameters and refresh both the `Heatmap_View` and `Timeline_View`.
6. WHEN the citizen taps a "Reset Filters" control, THE `Filter_Panel` SHALL reset all selectors to `ALL` and clear the date range, and THE `History_Screen` SHALL re-fetch with no filter parameters.
7. WHILE a data fetch triggered by a filter change is in progress, THE `Filter_Panel` SHALL disable all filter controls to prevent concurrent requests.

---

### Requirement 6: Summary Statistics

**User Story:** As a citizen, I want to see summary statistics for the filtered complaint set, so that I can quickly understand the scale and resolution rate of issues in my area.

#### Acceptance Criteria

1. THE `History_Screen` SHALL display a statistics bar showing: total complaint count, resolved complaint count (status `COMPLETED`), and the most-reported category for the current filtered dataset.
2. WHEN the filtered dataset changes, THE `History_Screen` SHALL update the statistics bar within 200 ms of receiving the new dataset.
3. THE `History_Screen` SHALL compute the resolution rate as `(resolved count / total count) × 100`, rounded to the nearest integer, and display it as a percentage.
4. WHEN the total complaint count is zero, THE `History_Screen` SHALL display "0%" as the resolution rate and "—" as the most-reported category.

---

### Requirement 7: View Mode Toggle

**User Story:** As a citizen, I want to switch between the heatmap and timeline views, so that I can choose the most useful representation for my current task.

#### Acceptance Criteria

1. THE `History_Screen` SHALL display a toggle control with two options: "Heatmap" and "Timeline".
2. WHEN the citizen selects "Heatmap", THE `History_Screen` SHALL display the `Heatmap_View` and hide the `Timeline_View`.
3. WHEN the citizen selects "Timeline", THE `History_Screen` SHALL display the `Timeline_View` and hide the `Heatmap_View`.
4. THE `History_Screen` SHALL default to the "Heatmap" view mode on initial load.
5. WHEN the citizen switches view mode, THE active filter state and fetched dataset SHALL be preserved without re-fetching from the API.

---

### Requirement 8: Authentication and Authorization

**User Story:** As a system operator, I want the history endpoint to require authentication, so that complaint data is only accessible to logged-in citizens.

#### Acceptance Criteria

1. THE `History_API` SHALL require a valid JWT Bearer token in the `Authorization` header, enforced by the existing `authMiddleware`.
2. IF a request to `History_API` is received without a valid JWT token, THEN THE `History_API` SHALL return HTTP 401 with a JSON body containing an `error` field.
3. WHEN the `History_Screen` receives a 401 response from `History_API`, THE `History_Screen` SHALL invoke the existing session-expiry handler in `api.js`, which clears stored credentials and redirects the citizen to the login screen.
