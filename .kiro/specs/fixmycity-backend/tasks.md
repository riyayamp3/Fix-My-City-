# Implementation Plan: fixmycity-backend

## Overview

Incremental implementation of the FixMyCity backend (Node.js/Express/Mongoose ESM) and the Authority Dashboard frontend (React/TypeScript). Each task builds on the previous, ending with all components wired together and mock data fully replaced.

## Tasks

- [x] 1. Create backend/package.json
  - Add `"type": "module"` and a `start` script (`node server.js`)
  - Declare runtime deps: `express`, `mongoose`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `multer`, `cloudinary`
  - Declare dev deps: `fast-check`, `jest`, `supertest`; add `test` script
  - _Requirements: 1.1, 1.2_

- [x] 2. Extend Complaint model and update complaintController
  - [x] 2.1 Update backend/models/Complaint.js
    - Add `userId` (ObjectId ref User, required), `severity` enum `["LOW","MEDIUM","HIGH"]`, `location` object `{ lat, lng, address }`, update `status` enum to `["RECEIVED","JOB_CREATED","IN_PROGRESS","COMPLETED"]`
    - _Requirements: 3.1_

  - [x] 2.2 Update backend/controllers/complaintController.js
    - `createComplaint`: set `userId` from `req.user.id`, validate required fields, default status `RECEIVED`
    - `getComplaints`: add `.populate("userId", "username role")`
    - Add `getComplaintById`: `findById` with populate, return 404 if not found
    - `updateComplaintStatus`: validate status is a valid enum value
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 2.3 Write property tests for complaint controller
    - **Property 1: Complaint creation sets userId and default status** — generate random valid payloads, verify `userId === req.user.id` and `status === "RECEIVED"`
    - **Property 2: Complaint list sorted descending by createdAt** — insert N complaints with random timestamps, verify adjacent pair ordering
    - **Property 3: Status update round-trip** — PATCH status then GET by id, verify reflected value
    - **Validates: Requirements 3.2, 3.3, 3.6**

- [x] 3. Update backend/routes/complaintRoutes.js
  - Add `GET /:id` route wired to `getComplaintById`
  - Import `getComplaintById` from complaintController
  - _Requirements: 3.4_

- [x] 4. Create Job model, controller, and routes
  - [x] 4.1 Create backend/models/Job.js
    - Fields: `complaintId` (ref Complaint, required), `title` (required), `description`, `category`, `severity`, `location { lat, lng, address }`, `status` enum `["OPEN","ASSIGNED","IN_PROGRESS","COMPLETED"]` default `OPEN`, `assignedTo` (ref User), timestamps
    - _Requirements: 4.1_

  - [x] 4.2 Create backend/controllers/jobController.js
    - `createJob`: find complaint (404 if missing), create job with `status: "OPEN"`, update complaint status to `"JOB_CREATED"`, return created job
    - `getJobs`: find all, sort desc, populate `complaintId` and `assignedTo`
    - `getOpenJobs`: find where `status: "OPEN"`, sort desc
    - `assignJob`: find contractor (404 if missing), update job `assignedTo` + `status: "ASSIGNED"`, accept winning bid, reject all other bids for that job
    - `updateJobStatus`: if `COMPLETED` update job and linked complaint; if `IN_PROGRESS` update job only
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 4.3 Write property tests for job controller
    - **Property 4: Job creation atomically sets job OPEN and complaint JOB_CREATED** — create complaint, POST job, verify both statuses
    - **Property 5: Job list sorted descending by createdAt** — insert N jobs, verify ordering
    - **Property 6: Open jobs filter returns only OPEN status** — insert jobs with mixed statuses, verify GET /open result
    - **Property 7: Assign enforces exactly one ACCEPTED bid per job** — create job with N bids, assign one, verify bid statuses
    - **Property 8: Job completion atomically completes linked complaint** — verify both job and complaint status after COMPLETED update
    - **Validates: Requirements 4.2, 4.4, 4.5, 4.6, 4.8, 11.1, 11.2, 11.3**

  - [x] 4.4 Create backend/routes/jobRoutes.js
    - `GET /` → `getJobs`
    - `POST /` → `createJob`
    - `GET /open` → `getOpenJobs` (must be registered before `/:id` to avoid param conflict)
    - `PUT /:id/assign` → `assignJob`
    - `PUT /:id/status` → `updateJobStatus`
    - All routes protected with `protect` middleware
    - _Requirements: 4.2, 4.4, 4.5, 4.6, 4.8_

- [x] 5. Create Bid model, controller, and routes
  - [x] 5.1 Create backend/models/Bid.js
    - Fields: `jobId` (ref Job, required), `contractorId` (ref User, required), `eta` (String), `cost` (Number), `note` (String), `status` enum `["PENDING","ACCEPTED","REJECTED"]` default `PENDING`, `createdAt` default `Date.now`
    - _Requirements: 5.1_

  - [x] 5.2 Create backend/controllers/bidController.js
    - `createBid`: find job (404 if missing), create bid with `status: "PENDING"`, return created bid
    - `getBidsByJob`: find by `jobId`, populate `contractorId` with `username role`
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 5.3 Write property tests for bid controller
    - **Property 9: Bid creation always defaults to PENDING** — generate random valid bid payloads, verify `status === "PENDING"`
    - **Property 10: Bid list for a job contains only that job's bids** — create multiple jobs with bids, verify no cross-job leakage
    - **Validates: Requirements 5.2, 5.4**

  - [x] 5.4 Create backend/routes/bidRoutes.js
    - `GET /:jobId` → `getBidsByJob`
    - `POST /` → `createBid`
    - All routes protected with `protect` middleware
    - _Requirements: 5.2, 5.4_

- [x] 6. Update upload route to use memory storage
  - Modify backend/routes/uploadRoutes.js: replace `multer({ dest: "uploads/" })` with `multer({ storage: multer.memoryStorage() })`
  - Replace `cloudinary.uploader.upload(req.file.path)` with a `upload_stream` Promise wrapper using `req.file.buffer`
  - Remove `fs.unlinkSync` call
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Update backend/controllers/authController.js
  - Add missing field validation in `signup`: return HTTP 400 if `username`, `password`, or `role` is missing
  - _Requirements: 2.3_

  - [ ]* 7.1 Write property test for auth validation
    - **Property 11: Signup with missing required fields returns 400** — generate all non-empty subsets of `{username, password, role}` that omit at least one field, verify HTTP 400
    - **Validates: Requirements 2.3**

- [x] 8. Register job and bid routes in backend/server.js
  - Import `jobRoutes` and `bidRoutes`
  - Register `app.use("/api/jobs", jobRoutes)` and `app.use("/api/bids", bidRoutes)`
  - _Requirements: 7.1_

- [x] 9. Checkpoint — backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update src/hooks/useComplaints.ts
  - Update `Complaint` interface: add `userId: { _id: string; username: string; role: string }`, `severity: "LOW" | "MEDIUM" | "HIGH"`, `location: { lat: number; lng: number; address: string }`, update `status` to `"RECEIVED" | "JOB_CREATED" | "IN_PROGRESS" | "COMPLETED"`
  - Remove `mappedJobs`, `openJobs`, `activeJobs` computed values and the `Job` import from mockData
  - Add `error` state; expose `refetch` function
  - _Requirements: 8.1, 8.5_

- [x] 11. Create src/hooks/useJobs.ts
  - Define `Job` interface matching API shape (populated `complaintId`, `assignedTo`)
  - Fetch jobs on mount from `GET /api/jobs`
  - Expose `createJob(payload)` → `POST /api/jobs`
  - Expose `assignJob(jobId, contractorId, bidId)` → `PUT /api/jobs/:id/assign`
  - Expose `updateJobStatus(jobId, status)` → `PUT /api/jobs/:id/status`
  - Expose `jobs`, `loading`, `error`, `refetch`
  - _Requirements: 9.1_

- [x] 12. Create src/hooks/useBids.ts
  - Define `Bid` interface matching API shape (populated `contractorId`)
  - Expose `fetchBids(jobId)` → `GET /api/bids/:jobId` (lazy, not called on mount)
  - Expose `bids`, `loading`, `error`
  - _Requirements: 9.3_

- [x] 13. Update src/pages/Complaints.tsx
  - Remove import from `@/data/mockData`; use `useComplaints()` hook
  - Update `Complaint` type references to match API shape (`_id`, `location.address`, uppercase `severity`/`status`)
  - Update filter logic: map API enums (`HIGH`/`MEDIUM`/`LOW`, `RECEIVED`/`JOB_CREATED`/`IN_PROGRESS`/`COMPLETED`) to display labels
  - Update table and detail panel to use `c._id`, `c.description`, `c.location.address`, `c.imageUrl`, `c.severity`, `c.status`
  - Wire "Create Job" button: call `useJobs().createJob(...)` then `refetch()`; show button only when `selected.status === "RECEIVED"`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 13.1 Write property test for Complaints table rendering
    - **Property 13: Complaints table renders all complaint fields** — generate random Complaint arrays, render component, verify each row shows `description`, `category`, `severity`, `status`, `location.address`
    - **Validates: Requirements 8.2**

- [x] 14. Update src/pages/Jobs.tsx
  - Remove import from `@/data/mockData`; use `useJobs()` hook
  - Add `ASSIGNED` column between `OPEN` and `IN_PROGRESS`; update `columns` array to 4 entries
  - On click of an OPEN job card: call `useBids().fetchBids(job._id)` and show bid list in a side panel
  - Bid panel: list bids with contractor username, cost, eta, note; "Assign" button per bid
  - "Assign" button: call `useJobs().assignJob(job._id, bid.contractorId._id, bid._id)` then `refetch()`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 14.1 Write property test for Jobs board column grouping
    - **Property 14: Jobs board groups all jobs by status column** — generate random Job arrays, render component, verify each job appears in the correct status column
    - **Validates: Requirements 9.2**

- [x] 15. Update src/pages/MapDashboard.tsx
  - Remove import from `@/data/mockData`; use `useComplaints()` hook
  - Map severity enum to pin color: `HIGH → #EF4444`, `MEDIUM → #F59E0B`, `LOW → #10B981`
  - Map status enum: `RECEIVED`/`JOB_CREATED` → open color, `IN_PROGRESS` → amber, `COMPLETED` → green
  - Use `c.location.lat` and `c.location.lng` for marker coordinates
  - Popup: show `c.description`, `c.location.address`, severity, status
  - Recompute counts: `criticalCount = complaints.filter(c => c.severity === "HIGH" && c.status !== "COMPLETED").length`, etc.
  - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 15.1 Write property tests for map rendering
    - **Property 15: Map renders one pin per complaint** — generate random Complaint arrays with valid lat/lng, verify marker count equals array length
    - **Property 16: Map counts are computed correctly from live data** — generate random arrays, verify criticalCount/mediumCount/resolvedCount match filter predicates
    - **Validates: Requirements 10.2, 10.3**

- [x] 16. Update src/pages/Dashboard.tsx
  - Remove `mappedJobs` destructure from `useComplaints()` (no longer exported)
  - Replace `activeJobsList` derivation: use `useJobs()` hook, filter jobs where `status !== "COMPLETED"`, map to display shape
  - Update `recentComplaints` mapping: use `c.location?.address` for location, `c.severity` (lowercase for badge class), `c.status` mapped to badge variant
  - Remove `stats` import from mockData; derive `liveStats` from live hook data
  - _Requirements: 8.1_

- [x] 17. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The `GET /jobs/open` route must be registered before `GET /jobs/:id` to avoid Express treating `open` as a param
- The `protect` middleware is already implemented in `backend/middleware/authMiddleware.js` — import it in all new route files
- Property tests use **fast-check** with minimum 100 iterations per property
- Each property test file should include the comment: `// Feature: fixmycity-backend, Property N: <property text>`
