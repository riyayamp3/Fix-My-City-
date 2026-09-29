# Implementation Plan: AI Civic Complaint Capture

## Overview

Incremental implementation across three areas: backend infrastructure fixes, the new AI analysis endpoint, and the Expo mobile ReportScreen. Each task builds on the previous, ending with full integration. All backend code uses ESM (`import`/`export`).

## Tasks

- [x] 1. Fix MongoDB Atlas connection string and error logging
  - In `backend/config/db.js`, append `?retryWrites=true&w=majority` to `MONGO_URI` if those params are not already present before calling `mongoose.connect()`
  - Add error-code detection: if the caught error message/code matches `ECONNREFUSED` or `MongoServerSelectionError`, log a hint about Atlas IP whitelist (`0.0.0.0/0`)
  - Add `retryWrites=true&w=majority` to the `MONGO_URI` value in `backend/.env`
  - _Requirements: 2.2, 2.3_

  - [x] 1.1 Write property test for MONGO_URI parameter injection (P3)
    - **Property 3: MONGO_URI always includes required Atlas parameters**
    - **Validates: Requirements 2.3**
    - File: `backend/__tests__/db.unit.test.js`
    - Use `fc.string()` as arbitrary URI input; assert both `retryWrites=true` and `w=majority` are present in the string passed to `mongoose.connect`

- [x] 2. Unify ports — serve React SPA from Express
  - In `backend/server.js`, import `path` and `url` (for `__dirname` in ESM via `fileURLToPath`)
  - Mount `express.static(...)` pointing at `../fixmycity-authority-portal-main/FixMyCity-authority-portal-main/dist` **after** all `/api/*` route registrations
  - Add a catch-all `app.get('*', ...)` that serves `dist/index.html` for SPA client-side routing, also after all API routes
  - Add `ANTHROPIC_API_KEY` startup validation: log a warning if the env var is missing
  - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.1 Write unit tests for static serving and catch-all (P1, P2)
    - File: `backend/__tests__/server.unit.test.js`
    - **Property 1: Non-API paths always return SPA HTML** — mock `supertest` GET on arbitrary non-`/api/` paths, assert response is HTML / 200
    - **Property 2: API paths are never intercepted by static middleware** — assert `/api/*` paths return JSON, never `index.html`
    - **Validates: Requirements 1.2, 1.3**

- [ ] 3. Install `@anthropic-ai/sdk` package and add `ANTHROPIC_API_KEY` to env
  - Run `npm install @anthropic-ai/sdk` inside `backend/`
  - Add `ANTHROPIC_API_KEY=<your-key>` to `backend/.env`
  - _Requirements: 4.11_

- [ ] 4. Create `backend/controllers/analyzeImageController.js`
  - Export `analyzeImage` async function (ESM)
  - Configure `multer` with `memoryStorage()` — export the multer middleware as `upload`
  - Guard: if `process.env.ANTHROPIC_API_KEY` is falsy → return 503 `{ error: "AI service not configured" }`
  - Guard: if `req.file` is missing → return 400 `{ error: "No image file provided" }`
  - Upload `req.file.buffer` to Cloudinary via `upload_stream`; on failure → return 502 `{ error: "Image upload failed" }`
  - Fetch the Cloudinary image URL, encode to base64, determine MIME type
  - Call Claude claude-3-5-haiku-20241022 via `@anthropic-ai/sdk` with the base64 image + civic-issue prompt; wrap in `AbortController` with 15 s timeout; on timeout → return 504 `{ error: "AI analysis timed out" }`
  - Parse LLM response text as JSON; on parse failure → return 422 `{ error: "AI returned unparseable response" }`
  - Validate/normalize schema fields (`isCivicIssue`, `category`, `severity`, `description`) and return 200 with `{ isCivicIssue, category, severity, description, imageUrl }`
  - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 5.1, 5.2, 5.3, 5.4_

  - [x] 4.1 Write unit tests for analyzeImageController error paths
    - File: `backend/__tests__/analyzeImage.unit.test.js`
    - Mock Cloudinary `upload_stream` to call error callback → assert 502
    - Mock missing `ANTHROPIC_API_KEY` → assert 503
    - Mock Claude call to exceed 15 s (fake timer / AbortError) → assert 504
    - Mock valid LLM JSON response → assert 200 with correct shape
    - _Requirements: 4.8, 4.9, 4.10, 4.11_

  - [x] 4.2 Write property test for non-JSON LLM responses (P6)
    - **Property 6: Non-JSON LLM responses always return HTTP 422**
    - **Validates: Requirements 4.9**
    - File: `backend/__tests__/analyzeImage.property.test.js`
    - Use `fc.string()` filtered to exclude valid JSON; mock Claude to return that string; assert 422

  - [x] 4.3 Write property test for response schema conformance (P7)
    - **Property 7: AI analysis response always conforms to schema**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - File: `backend/__tests__/analyzeImage.property.test.js`
    - Use `fc.record(...)` generating mock LLM responses; assert 200 body always matches the full schema

- [x] 5. Register `/analyze-image` route and add severity normalization
  - In `backend/routes/complaintRoutes.js`, import `analyzeImage` and `upload` from `analyzeImageController.js`
  - Register `router.post('/analyze-image', protect, upload.single('image'), analyzeImage)` **before** the `router.get('/:id', ...)` line
  - In `backend/controllers/complaintController.js`, add `severity?.toUpperCase()` normalization in `createComplaint` before `Complaint.create()`
  - _Requirements: 4.1, 4.2, 8.3_

  - [x] 5.1 Write unit test for route ordering and middleware
    - File: `backend/__tests__/complaintRoutes.test.js`
    - Assert that `POST /api/complaints/analyze-image` is matched before `GET /:id` (i.e., `analyze-image` is not treated as an `:id` param)
    - Assert `protect` middleware is applied to the route
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Write property test for severity normalization (P12)
    - **Property 12: Severity normalization is total and correct**
    - **Validates: Requirements 8.3**
    - File: `backend/__tests__/analyzeImage.property.test.js`
    - Use `fc.constantFrom('low','medium','high','Low','Medium','High','LOW','MEDIUM','HIGH')`; assert stored severity is always the uppercase equivalent

  - [x] 5.3 Write property test for unauthenticated requests (P4)
    - **Property 4: Auth middleware rejects all unauthenticated requests to analyze-image**
    - **Validates: Requirements 4.2, 4.3**
    - File: `backend/__tests__/analyzeImage.property.test.js`
    - Use `fc.option(fc.string())` for the Authorization header value; assert 401 for all missing/invalid tokens

  - [x] 5.4 Write property test for complaint submission round-trip (P13)
    - **Property 13: Complaint submission round-trip**
    - **Validates: Requirements 8.4**
    - File: `backend/__tests__/analyzeImage.property.test.js`
    - Use `fc.record({ description: fc.string({minLength:1}), severity: fc.constantFrom('low','medium','high'), category: fc.constantFrom('pothole','garbage','water_leak','streetlight','road_damage','other') })`; POST to `/api/complaints`; assert 201 and that `severity` in response is uppercase

- [x] 6. Checkpoint — backend tests pass
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 7. Locate or scaffold the Expo mobile app
  - Check if `PVG IH/mobile/` exists with an Expo project; if not, scaffold with `npx create-expo-app mobile --template blank-typescript` inside `PVG IH/`
  - Install required packages: `npx expo install expo-image-picker expo-location`
  - _Requirements: 3.1_

- [x] 8. Create `mobile/app/ReportScreen.tsx` (or equivalent screen path)
  - Implement `ImagePickerButton` — presents action sheet for camera vs. library; requests permissions; on denial shows alert with Settings deep-link
  - Implement `ImagePreview` — renders selected image URI after pick
  - Implement `analyzeImage()` — builds `FormData` with the image file, attaches Bearer JWT, fires `POST /api/complaints/analyze-image` with a client-side `AbortController` 15 s timeout; on success with `isCivicIssue:true` pre-fills form state; on `isCivicIssue:false` shows inline message and leaves form empty; on any failure/timeout shows fallback toast and leaves form empty but retains `imageUri`
  - Implement `ComplaintForm` — editable fields: `category` (picker), `severity` (picker), `description` (text input), `location` (auto-populated via `expo-location`, editable); inline validation error when `description` is empty on submit attempt
  - Implement `submitComplaint()` — POSTs `{ description, imageUrl, category, severity, location }` to `/api/complaints` with Bearer JWT; shows loading state and disables submit button during both analysis and submission
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.5_

  - [x] 8.1 Write unit tests for ReportScreen
    - File: `mobile/__tests__/ReportScreen.unit.test.js`
    - Permission denied → assert alert is shown
    - `isCivicIssue:false` response → assert inline message shown and form fields empty
    - Loading state → assert submit button is disabled
    - _Requirements: 3.4, 6.3, 6.4_

  - [x] 8.2 Write property test for form pre-fill (P9)
    - **Property 9: Pre-fill populates all form fields and keeps them editable**
    - **Validates: Requirements 6.1, 6.2**
    - File: `mobile/__tests__/ReportScreen.property.test.js`
    - Use `fc.record(...)` generating `AIAnalysis` with `isCivicIssue:true`; assert `category`, `severity`, `description` are set and fields remain editable

  - [x] 8.3 Write property test for isCivicIssue false (P10)
    - **Property 10: isCivicIssue false leaves form fields empty**
    - **Validates: Requirements 6.3**
    - File: `mobile/__tests__/ReportScreen.property.test.js`
    - Use `fc.record(...)` generating `AIAnalysis` with `isCivicIssue:false`; assert all form fields are empty strings and message is displayed

  - [x] 8.4 Write property test for fallback behavior (P11)
    - **Property 11: Fallback on failure preserves image and presents empty editable form**
    - **Validates: Requirements 7.1, 7.2, 7.4**
    - File: `mobile/__tests__/ReportScreen.property.test.js`
    - Use `fc.oneof(fc.constant('network-error'), fc.integer({min:400,max:599}))` to simulate failures; assert toast shown, form fields empty, `imageUri` retained

  - [x] 8.5 Write property test for empty description blocking submit (P14)
    - **Property 14: Empty description always blocks mobile submission**
    - **Validates: Requirements 8.5**
    - File: `mobile/__tests__/ReportScreen.property.test.js`
    - Use `fc.string()` filtered to blank/whitespace only; assert validation error shown and no HTTP request sent

- [x] 9. Final checkpoint — all tests pass
  - Ensure all backend and mobile tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All backend code must use ESM (`import`/`export`) — `"type": "module"` is set in `backend/package.json`
- Use `@anthropic-ai/sdk` npm package for Claude; initialize with `process.env.ANTHROPIC_API_KEY`
- Claude model to use: `claude-3-5-haiku-20241022` with `messages.create`, passing image as base64 `image` content block
- Claude requires base64-encoded image data — fetch the Cloudinary URL after upload, encode buffer to base64, pass as `{ type: "image", source: { type: "base64", media_type, data } }`
- Strip markdown code fences (` ```json ... ``` `) from Claude's response before JSON.parse — Claude sometimes wraps JSON in fences
- Mobile app already exists at `FixMyCityCitizen_App/` — `report.tsx`, `expo-image-picker`, `expo-location`, and `api.postForm` are all in place. Task 7 (scaffold mobile) is not needed.
- The `/analyze-image` route MUST be registered before `/:id` in `complaintRoutes.js`
- `fast-check` is already in `backend/devDependencies`; mobile tests may need it added separately
- Property tests run a minimum of 100 iterations and are tagged with `// Feature: ai-civic-complaint-capture, Property {N}: ...`
