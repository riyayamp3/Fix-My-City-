# Requirements Document

## Introduction

FixMyCity is a civic issue reporting and management system. The backend is a Node.js/Express API (ESM modules) backed by MongoDB Atlas. Three client apps consume it: a Citizen mobile app (reports issues), an Authority Dashboard (admin web app), and a Contractor Dashboard (web app for bidding and job updates).

The current backend is partially built. This spec covers completing the backend (missing models, routes, controllers, package.json) and wiring the Authority Dashboard frontend to real API data instead of mock data.

## Glossary

- **Server**: The Node.js/Express backend application running on port 5000
- **Auth_Controller**: The module handling user registration and login
- **Auth_Middleware**: The JWT verification middleware that protects routes
- **Complaint_Controller**: The module handling complaint CRUD and status updates
- **Job_Controller**: The module handling job creation, assignment, and status updates
- **Bid_Controller**: The module handling bid creation and retrieval
- **Upload_Controller**: The module handling image uploads via multer and Cloudinary
- **Complaint**: A civic issue submitted by a citizen, with status lifecycle: RECEIVED → JOB_CREATED → IN_PROGRESS → COMPLETED
- **Job**: A work order created by an admin from a complaint, with status lifecycle: OPEN → ASSIGNED → IN_PROGRESS → COMPLETED
- **Bid**: A contractor's offer to complete a job, with status: PENDING → ACCEPTED or REJECTED
- **User**: A registered account with role CITIZEN, ADMIN, or CONTRACTOR
- **Token**: A JWT bearer token issued on login, required for protected routes
- **Cloudinary**: The external image hosting service used for complaint photo storage

---

## Requirements

### Requirement 1: Backend Project Initialization

**User Story:** As a developer, I want a valid package.json so that I can install dependencies and run the backend server.

#### Acceptance Criteria

1. THE Server SHALL have a `package.json` with `"type": "module"` and a `start` script that runs `node server.js`
2. THE `package.json` SHALL declare all required runtime dependencies: `express`, `mongoose`, `cors`, `dotenv`, `bcrypt`, `jsonwebtoken`, `multer`, `cloudinary`, `axios`
3. WHEN the developer runs `npm install`, THE Server SHALL install all declared dependencies without errors

---

### Requirement 2: User Authentication

**User Story:** As a user (citizen, admin, or contractor), I want to register and log in so that I can access the system with my assigned role.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/signup` with `username`, `password`, and `role`, THE Auth_Controller SHALL create a new User document with the password hashed using bcrypt and return `{ message, user }`
2. WHEN a POST request is made to `/api/auth/login` with valid `username` and `password`, THE Auth_Controller SHALL return `{ token, role, userId }`
3. IF a POST request is made to `/api/auth/signup` with a missing `username`, `password`, or `role` field, THEN THE Auth_Controller SHALL return HTTP 400 with a descriptive error message
4. IF a POST request is made to `/api/auth/login` with a `username` that does not exist in the database, THEN THE Auth_Controller SHALL return HTTP 400 with `{ error: "User not found" }`
5. IF a POST request is made to `/api/auth/login` with an incorrect `password`, THEN THE Auth_Controller SHALL return HTTP 400 with `{ error: "Invalid password" }`
6. THE Auth_Middleware SHALL extract the bearer token from the `Authorization` header and attach the decoded payload to `req.user`
7. IF a request is made to a protected route without an `Authorization` header, THEN THE Auth_Middleware SHALL return HTTP 401 with `{ error: "No token" }`
8. IF a request is made to a protected route with an invalid or expired token, THEN THE Auth_Middleware SHALL return HTTP 401 with `{ error: "Invalid token" }`

---

### Requirement 3: Complaint Model and API

**User Story:** As a citizen, I want to submit a complaint with location, severity, and an image so that the authority can act on it.

#### Acceptance Criteria

1. THE Complaint model SHALL include fields: `userId` (ref: User, required), `description` (String), `imageUrl` (String), `category` (String), `severity` (enum: LOW, MEDIUM, HIGH), `location` (object with `lat` Number, `lng` Number, `address` String), `status` (enum: RECEIVED, JOB_CREATED, IN_PROGRESS, COMPLETED, default: RECEIVED), and timestamps
2. WHEN a POST request is made to `/api/complaints` with a valid token and required fields, THE Complaint_Controller SHALL create a Complaint document with `userId` set from `req.user.id` and `status` defaulting to `RECEIVED`
3. WHEN a GET request is made to `/api/complaints` with a valid token, THE Complaint_Controller SHALL return all complaints sorted by `createdAt` descending, with `userId` populated with `username` and `role`
4. WHEN a GET request is made to `/api/complaints/:id` with a valid token, THE Complaint_Controller SHALL return the single complaint document with `userId` populated
5. IF a GET request is made to `/api/complaints/:id` with an id that does not exist, THEN THE Complaint_Controller SHALL return HTTP 404 with `{ error: "Complaint not found" }`
6. WHEN a PATCH request is made to `/api/complaints/:id/status` with a valid token and a valid `status` value, THE Complaint_Controller SHALL update the complaint status and return the updated document

---

### Requirement 4: Job Model and API

**User Story:** As an admin, I want to create jobs from complaints and assign them to contractors so that civic issues get resolved.

#### Acceptance Criteria

1. THE Job model SHALL include fields: `complaintId` (ref: Complaint, required), `title` (String, required), `description` (String), `category` (String), `severity` (String), `location` (object with `lat`, `lng`, `address`), `status` (enum: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, default: OPEN), `assignedTo` (ref: User), and timestamps
2. WHEN a POST request is made to `/api/jobs` with a valid token and `complaintId`, THE Job_Controller SHALL create a Job document with `status` defaulting to `OPEN` and SHALL update the referenced Complaint's `status` to `JOB_CREATED`
3. IF a POST request is made to `/api/jobs` with a `complaintId` that does not reference an existing Complaint, THEN THE Job_Controller SHALL return HTTP 404 with `{ error: "Complaint not found" }`
4. WHEN a GET request is made to `/api/jobs` with a valid token, THE Job_Controller SHALL return all jobs sorted by `createdAt` descending, with `complaintId` and `assignedTo` populated
5. WHEN a GET request is made to `/api/jobs/open` with a valid token, THE Job_Controller SHALL return only jobs where `status` is `OPEN`
6. WHEN a PUT request is made to `/api/jobs/:id/assign` with a valid token and `contractorId` and `bidId`, THE Job_Controller SHALL set `job.assignedTo` to `contractorId`, set `job.status` to `ASSIGNED`, set the winning Bid's `status` to `ACCEPTED`, and set all other Bids for that job to `REJECTED`
7. IF a PUT request is made to `/api/jobs/:id/assign` with a `contractorId` that does not reference an existing User, THEN THE Job_Controller SHALL return HTTP 404 with `{ error: "Contractor not found" }`
8. WHEN a PUT request is made to `/api/jobs/:id/status` with `status` set to `COMPLETED`, THE Job_Controller SHALL update `job.status` to `COMPLETED` and SHALL update the referenced Complaint's `status` to `COMPLETED`
9. WHEN a PUT request is made to `/api/jobs/:id/status` with `status` set to `IN_PROGRESS`, THE Job_Controller SHALL update `job.status` to `IN_PROGRESS`

---

### Requirement 5: Bid Model and API

**User Story:** As a contractor, I want to place bids on open jobs so that I can be assigned work.

#### Acceptance Criteria

1. THE Bid model SHALL include fields: `jobId` (ref: Job, required), `contractorId` (ref: User, required), `eta` (String), `cost` (Number), `note` (String), `status` (enum: PENDING, ACCEPTED, REJECTED, default: PENDING), and `createdAt` timestamp
2. WHEN a POST request is made to `/api/bids` with a valid token and `jobId`, `contractorId`, `eta`, `cost`, THE Bid_Controller SHALL create a Bid document with `status` defaulting to `PENDING`
3. IF a POST request is made to `/api/bids` with a `jobId` that does not reference an existing Job, THEN THE Bid_Controller SHALL return HTTP 404 with `{ error: "Job not found" }`
4. WHEN a GET request is made to `/api/bids/:jobId` with a valid token, THE Bid_Controller SHALL return all bids for that job with `contractorId` populated with `username` and `role`
5. THE Bid model SHALL enforce that at most one Bid per job has `status` equal to `ACCEPTED` at any time

---

### Requirement 6: Image Upload

**User Story:** As a citizen, I want to upload a photo of the civic issue so that the authority can visually assess it.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/upload` with a multipart form containing an `image` field, THE Upload_Controller SHALL upload the image to Cloudinary and return `{ imageUrl }` containing the Cloudinary secure URL
2. IF a POST request is made to `/api/upload` without an `image` field, THEN THE Upload_Controller SHALL return HTTP 400 with `{ error: "No image provided" }`
3. THE Upload_Controller SHALL use multer memory storage so that no files are written to the local filesystem

---

### Requirement 7: Server Registration and Configuration

**User Story:** As a developer, I want all routes registered in server.js so that the API is fully functional when the server starts.

#### Acceptance Criteria

1. THE Server SHALL register routes at: `/api/auth`, `/api/complaints`, `/api/jobs`, `/api/bids`, `/api/upload`
2. THE Server SHALL apply `cors()` and `express.json()` middleware before all route handlers
3. THE Server SHALL connect to MongoDB using the `MONGO_URI` environment variable before accepting requests
4. THE `.env` file SHALL have the `MONGO_URI` password placeholder `<admin123>` replaced with the actual password before the server can connect to MongoDB Atlas

---

### Requirement 8: Authority Dashboard — Complaints Page

**User Story:** As an admin, I want the Complaints page to show real complaint data from the API so that I can manage live civic issues.

#### Acceptance Criteria

1. THE Complaints page SHALL fetch complaints from `GET /api/complaints` on mount using the axios API client
2. THE Complaints page SHALL display each complaint's `description`, `category`, `severity`, `status`, `location.address`, and `imageUrl` in the table
3. WHEN the admin clicks a complaint row, THE Complaints page SHALL display a detail panel with all complaint fields
4. WHEN the admin clicks "Create Job" in the detail panel for a complaint with `status` equal to `RECEIVED`, THE Complaints page SHALL POST to `/api/jobs` with the complaint data and update the complaint list on success
5. THE Complaints page SHALL NOT import or use data from `src/data/mockData.ts`

---

### Requirement 9: Authority Dashboard — Jobs Page

**User Story:** As an admin, I want the Jobs page to show real job data from the API so that I can manage job assignments.

#### Acceptance Criteria

1. THE Jobs page SHALL fetch jobs from `GET /api/jobs` on mount using the axios API client via a `useJobs` hook
2. THE Jobs page SHALL display jobs grouped by status columns: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED
3. WHEN the admin clicks a job card in the OPEN column, THE Jobs page SHALL fetch bids from `GET /api/bids/:jobId` and display them
4. WHEN the admin selects a bid and clicks "Assign", THE Jobs page SHALL PUT to `/api/jobs/:id/assign` with `contractorId` and `bidId` and refresh the job list on success
5. THE Jobs page SHALL NOT import or use data from `src/data/mockData.ts`

---

### Requirement 10: Authority Dashboard — Map Dashboard

**User Story:** As an admin, I want the Map Dashboard to show real complaint locations so that I can see the geographic distribution of issues.

#### Acceptance Criteria

1. THE Map Dashboard SHALL fetch complaints from `GET /api/complaints` using the `useComplaints` hook instead of importing from `src/data/mockData.ts`
2. WHEN complaints are loaded, THE Map Dashboard SHALL render a Leaflet map pin for each complaint using `location.lat` and `location.lng`
3. THE Map Dashboard SHALL display the correct counts for critical, medium, and resolved complaints based on live API data

---

### Requirement 11: Data Integrity — Status Lifecycle

**User Story:** As a system operator, I want complaint and job statuses to stay in sync so that the lifecycle is always consistent.

#### Acceptance Criteria

1. WHEN a Job is created for a Complaint, THE Job_Controller SHALL atomically update the Complaint's `status` to `JOB_CREATED` in the same request handler
2. WHEN a Job's `status` is updated to `COMPLETED`, THE Job_Controller SHALL atomically update the linked Complaint's `status` to `COMPLETED` in the same request handler
3. WHEN a bid is accepted via `/api/jobs/:id/assign`, THE Job_Controller SHALL set all other Bids for that job to `REJECTED` in the same request handler, ensuring only one Bid per job has `status` equal to `ACCEPTED`
4. IF a Job references a Complaint that no longer exists, THEN THE Job_Controller SHALL return HTTP 404 and SHALL NOT create the Job document
