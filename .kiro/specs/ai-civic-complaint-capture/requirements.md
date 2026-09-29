# Requirements Document

## Introduction

This feature adds AI-powered civic complaint capture to the FixMyCity Expo mobile app. Citizens can photograph a civic issue, have it automatically analyzed by an LLM vision model (GPT-4o), and submit a pre-filled complaint form — reducing friction and improving data quality. The feature also resolves two infrastructure issues: the frontend/backend port split and the MongoDB Atlas connection failure.

## Glossary

- **Mobile_App**: The Expo React Native citizen-facing mobile application
- **API_Server**: The Node.js/Express backend running on port 5000
- **Image_Analyzer**: The backend service that uploads images to Cloudinary and calls the OpenAI vision API
- **LLM**: The OpenAI GPT-4o vision model used for image analysis
- **Cloudinary**: The cloud image storage and CDN service
- **Complaint_Form**: The mobile UI screen where citizens review and submit civic complaints
- **Auth_Middleware**: The JWT-based authentication middleware on the API_Server
- **Static_Server**: The Express middleware that serves the built React frontend as static files
- **MongoDB_Atlas**: The hosted MongoDB database service used by the API_Server
- **AI_Analysis**: The structured JSON result returned by the LLM containing `isCivicIssue`, `category`, `severity`, and `description`

---

## Requirements

### Requirement 1: Port Unification — Serve Frontend from Express

**User Story:** As a developer, I want the React authority portal to be served from the same Express server as the API, so that there are no CORS issues and a single port is needed in production.

#### Acceptance Criteria

1. WHEN the React authority portal is built with `vite build`, THE Static_Server SHALL serve the resulting `dist/` directory at the root path `/` on the same port as the API_Server.
2. WHEN a request is made to any path not matching an `/api/*` route, THE API_Server SHALL serve the React app's `index.html` to support client-side routing.
3. THE API_Server SHALL continue to serve all `/api/*` routes without interference from the static file middleware.

---

### Requirement 2: MongoDB Atlas Connection Fix

**User Story:** As a developer, I want the API_Server to reliably connect to MongoDB Atlas, so that all database operations succeed in production and development.

#### Acceptance Criteria

1. WHEN the API_Server starts, THE API_Server SHALL establish a connection to MongoDB Atlas using the `MONGO_URI` environment variable within 30 seconds.
2. IF the MongoDB Atlas connection fails due to an IP whitelist restriction, THEN THE API_Server SHALL log a descriptive error message indicating the likely cause and exit with a non-zero status code.
3. THE `MONGO_URI` connection string SHALL include the `retryWrites=true` and `w=majority` parameters to ensure write durability.
4. WHERE the deployment environment requires it, THE API_Server SHALL support connecting via a MongoDB Atlas connection string with `0.0.0.0/0` network access enabled on the Atlas cluster.

---

### Requirement 3: Image Capture in Mobile App

**User Story:** As a citizen, I want to take or pick a photo of a civic issue from my phone, so that I can report it quickly without typing.

#### Acceptance Criteria

1. THE Mobile_App SHALL provide a button on the complaint submission screen that allows the citizen to capture a photo using the device camera or select one from the photo library.
2. WHEN a citizen taps the photo button, THE Mobile_App SHALL present a choice between "Take Photo" and "Choose from Library".
3. WHEN a photo is selected or captured, THE Mobile_App SHALL display a preview of the image before submitting it for analysis.
4. IF the citizen denies camera or photo library permissions, THEN THE Mobile_App SHALL display a message explaining that permission is required and provide a link to device settings.

---

### Requirement 4: AI Image Analysis Endpoint

**User Story:** As a developer, I want a backend endpoint that accepts an image, uploads it to Cloudinary, and returns an AI analysis, so that the mobile app can pre-fill complaint forms.

#### Acceptance Criteria

1. THE API_Server SHALL expose a `POST /api/complaints/analyze-image` endpoint that accepts a `multipart/form-data` request containing an image file.
2. WHEN a request is received at `POST /api/complaints/analyze-image`, THE Auth_Middleware SHALL validate the JWT token before the Image_Analyzer processes the request.
3. IF the JWT token is missing or invalid, THEN THE API_Server SHALL return HTTP 401 with an error message before processing the image.
4. WHEN a valid image is received, THE Image_Analyzer SHALL upload the image to Cloudinary and obtain a publicly accessible URL.
5. WHEN the Cloudinary upload succeeds, THE Image_Analyzer SHALL send the image URL to the LLM with the following prompt: "Analyze this image of a possible civic issue. Is this a real civic problem? If yes, return: category (one of: pothole, garbage, water_leak, streetlight, road_damage, other), severity (one of: low, medium, high), short complaint description. Return JSON only with fields: isCivicIssue (boolean), category (string), severity (string), description (string)."
6. WHEN the LLM returns a valid response, THE Image_Analyzer SHALL parse the JSON and return HTTP 200 with the AI_Analysis object and the Cloudinary image URL.
7. THE API_Server SHALL enforce a 15-second timeout on the LLM API call.
8. IF the LLM call exceeds 15 seconds, THEN THE Image_Analyzer SHALL return HTTP 504 with `{ "error": "AI analysis timed out" }`.
9. IF the LLM returns a response that cannot be parsed as valid JSON, THEN THE Image_Analyzer SHALL return HTTP 422 with `{ "error": "AI returned unparseable response" }`.
10. IF the Cloudinary upload fails, THEN THE Image_Analyzer SHALL return HTTP 502 with `{ "error": "Image upload failed" }`.
11. THE `OPENAI_API_KEY` environment variable SHALL be required for the Image_Analyzer to function; IF it is missing, THEN THE API_Server SHALL log an error on startup and the endpoint SHALL return HTTP 503.

---

### Requirement 5: AI Analysis Response Schema

**User Story:** As a developer, I want the AI analysis response to follow a strict schema, so that the mobile app can reliably parse and use the data.

#### Acceptance Criteria

1. THE Image_Analyzer SHALL return a JSON response conforming to: `{ isCivicIssue: boolean, category: string | null, severity: string | null, description: string | null, imageUrl: string }`.
2. WHEN `isCivicIssue` is `true`, THE Image_Analyzer SHALL ensure `category` is one of `["pothole", "garbage", "water_leak", "streetlight", "road_damage", "other"]`.
3. WHEN `isCivicIssue` is `true`, THE Image_Analyzer SHALL ensure `severity` is one of `["low", "medium", "high"]`.
4. WHEN `isCivicIssue` is `false`, THE Image_Analyzer SHALL return `null` for `category`, `severity`, and `description`.
5. FOR ALL valid image inputs, the `imageUrl` field in the response SHALL be a valid Cloudinary URL that resolves to the uploaded image (round-trip: upload → URL → accessible image).

---

### Requirement 6: Mobile App Form Pre-fill from AI Analysis

**User Story:** As a citizen, I want the complaint form to be automatically filled in after AI analysis, so that I can submit a complaint with minimal effort.

#### Acceptance Criteria

1. WHEN the Image_Analyzer returns a successful AI_Analysis with `isCivicIssue: true`, THE Mobile_App SHALL pre-fill the Complaint_Form fields: `category`, `severity`, and `description` with the values from the AI_Analysis.
2. WHEN the Complaint_Form is pre-filled, THE Mobile_App SHALL allow the citizen to edit any pre-filled field before submitting.
3. WHEN the Image_Analyzer returns `isCivicIssue: false`, THE Mobile_App SHALL display the message "This doesn't look like a civic issue. Please try another photo." and SHALL NOT pre-fill the Complaint_Form.
4. WHILE the AI analysis request is in progress, THE Mobile_App SHALL display a loading indicator and disable the submit button.

---

### Requirement 7: AI Analysis Failure Fallback

**User Story:** As a citizen, I want to be able to submit a complaint manually if AI analysis fails, so that a network or API error doesn't block me from reporting an issue.

#### Acceptance Criteria

1. IF the `POST /api/complaints/analyze-image` request fails due to a network error or returns a non-200 HTTP status, THEN THE Mobile_App SHALL display a toast notification with the message "AI analysis unavailable, please fill in manually".
2. WHEN the fallback is triggered, THE Mobile_App SHALL present the Complaint_Form in an empty, editable state so the citizen can fill it in manually.
3. IF the AI analysis request has not completed within 15 seconds on the client side, THEN THE Mobile_App SHALL cancel the request and trigger the fallback behavior described in criteria 1 and 2.
4. WHEN operating in fallback mode, THE Mobile_App SHALL retain the captured image and pre-populate the `imageUrl` field if the image was already uploaded, or upload it at complaint submission time.

---

### Requirement 8: Complaint Submission with AI-Captured Data

**User Story:** As a citizen, I want to submit a complaint that includes the AI-analyzed image and metadata, so that authorities receive a well-structured report.

#### Acceptance Criteria

1. WHEN a citizen submits the Complaint_Form, THE Mobile_App SHALL send a `POST /api/complaints` request with `description`, `imageUrl`, `category`, `severity`, and `location` fields.
2. THE API_Server SHALL accept `category` values of `["pothole", "garbage", "water_leak", "streetlight", "road_damage", "other"]` (case-insensitive) for complaints submitted via the mobile app.
3. THE API_Server SHALL accept `severity` values of `["low", "medium", "high"]` (case-insensitive) and store them normalized to uppercase to match the existing Complaint model enum `["LOW", "MEDIUM", "HIGH"]`.
4. WHEN a complaint is successfully created, THE API_Server SHALL return HTTP 201 with the created complaint document.
5. IF the `description` field is empty at submission time, THEN THE Mobile_App SHALL display a validation error and SHALL NOT submit the form.
