# Requirements Document

## Introduction

This feature adds Speech-to-Text (STT) voice input to the FixMyCity Expo mobile app, allowing citizens to dictate complaint descriptions in their native language instead of typing. The citizen taps a microphone button on the complaint form, speaks their complaint, and the transcribed text is inserted into the description field. Multilingual support enables automatic language detection so citizens are not required to pre-select a language. The feature integrates with the existing complaint capture flow (including the AI image analysis pre-fill from the `ai-civic-complaint-capture` spec) and always provides a fallback to manual text input.

## Glossary

- **Mobile_App**: The Expo React Native citizen-facing mobile application
- **Voice_Recorder**: The mobile component responsible for capturing audio from the device microphone using `expo-av`
- **STT_Service**: The backend service (or third-party API) that converts audio data into a text transcript
- **Transcription_Endpoint**: The `POST /api/voice/transcribe` backend route that accepts audio and returns a transcript
- **Complaint_Form**: The mobile UI screen where citizens review and submit civic complaints (contains `category`, `severity`, `description`, and `location` fields)
- **Description_Field**: The text input field within the Complaint_Form where the complaint description is entered
- **Language_Detector**: The component of the STT_Service that identifies the spoken language from the audio
- **Supported_Languages**: The set of languages accepted by the STT_Service: English (`en`), Hindi (`hi`), Marathi (`mr`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Bengali (`bn`), Gujarati (`gu`)
- **API_Server**: The Node.js/Express backend running on port 5000
- **Auth_Middleware**: The JWT-based authentication middleware on the API_Server
- **GOOGLE_STT_API_KEY**: The environment variable holding the Google Cloud Speech-to-Text API key

---

## Requirements

### Requirement 1: Microphone Permission Handling

**User Story:** As a citizen, I want the app to request microphone access clearly, so that I understand why the permission is needed and can grant it.

#### Acceptance Criteria

1. WHEN a citizen taps the microphone button for the first time, THE Mobile_App SHALL request microphone recording permission from the device operating system before starting any recording.
2. WHEN microphone permission is granted, THE Mobile_App SHALL proceed to start the voice recording session immediately.
3. IF microphone permission is denied by the citizen, THEN THE Mobile_App SHALL display an alert explaining that microphone access is required for voice input and SHALL provide a button that opens the device application settings.
4. WHILE microphone permission status is being determined, THE Mobile_App SHALL display the microphone button in a disabled state.

---

### Requirement 2: Voice Recording in the Mobile App

**User Story:** As a citizen, I want to record my complaint by speaking into my phone, so that I can report an issue without typing.

#### Acceptance Criteria

1. THE Mobile_App SHALL display a microphone button adjacent to the Description_Field on the Complaint_Form.
2. WHEN a citizen taps the microphone button and permission is granted, THE Voice_Recorder SHALL begin recording audio from the device microphone and THE Mobile_App SHALL display a visual recording indicator (animated pulse or waveform) to confirm recording is active.
3. WHEN a citizen taps the microphone button a second time during an active recording, THE Voice_Recorder SHALL stop recording and THE Mobile_App SHALL submit the captured audio for transcription.
4. WHEN a recording session has been active for 60 seconds without being stopped, THE Voice_Recorder SHALL automatically stop recording and submit the captured audio for transcription.
5. WHILE a recording is active, THE Mobile_App SHALL display the elapsed recording duration in seconds.
6. THE Voice_Recorder SHALL record audio in a format compatible with the STT_Service (AAC or WAV, 16 kHz sample rate, mono channel).
7. IF the recorded audio duration is less than 1 second, THEN THE Mobile_App SHALL discard the recording, display the message "Recording too short, please try again", and SHALL NOT submit the audio for transcription.

---

### Requirement 3: Speech-to-Text Transcription via Backend

**User Story:** As a developer, I want a backend endpoint that accepts audio and returns a transcript, so that the mobile app can convert voice input to text without exposing API keys on the client.

#### Acceptance Criteria

1. THE API_Server SHALL expose a `POST /api/voice/transcribe` endpoint that accepts a `multipart/form-data` request containing an audio file in the `audio` field.
2. WHEN a request is received at `POST /api/voice/transcribe`, THE Auth_Middleware SHALL validate the JWT token before the STT_Service processes the request.
3. IF the JWT token is missing or invalid, THEN THE API_Server SHALL return HTTP 401 with `{ "error": "Unauthorized" }` before processing the audio.
4. WHEN a valid audio file is received, THE STT_Service SHALL send the audio to the Google Cloud Speech-to-Text API using the `GOOGLE_STT_API_KEY` environment variable.
5. WHEN the Google Cloud Speech-to-Text API returns a successful response, THE STT_Service SHALL return HTTP 200 with `{ "transcript": "<transcribed text>", "detectedLanguage": "<BCP-47 language code>", "confidence": <float 0.0–1.0> }`.
6. THE API_Server SHALL enforce a 30-second timeout on the Google Cloud Speech-to-Text API call.
7. IF the Google Cloud Speech-to-Text API call exceeds 30 seconds, THEN THE STT_Service SHALL return HTTP 504 with `{ "error": "Transcription timed out" }`.
8. IF the audio file contains no recognizable speech, THEN THE STT_Service SHALL return HTTP 200 with `{ "transcript": "", "detectedLanguage": null, "confidence": 0.0 }`.
9. IF the `GOOGLE_STT_API_KEY` environment variable is missing, THEN THE API_Server SHALL log an error on startup and the Transcription_Endpoint SHALL return HTTP 503 with `{ "error": "STT service not configured" }`.
10. IF no audio file is present in the request, THEN THE STT_Service SHALL return HTTP 400 with `{ "error": "No audio file provided" }`.

---

### Requirement 4: Multilingual Speech Recognition

**User Story:** As a citizen, I want to speak in my native language and have it transcribed correctly, so that I can report issues without needing to speak English.

#### Acceptance Criteria

1. THE STT_Service SHALL configure the Google Cloud Speech-to-Text API request with `languageCode` set to `"en-IN"` as the primary language and `alternativeLanguageCodes` set to `["hi-IN", "mr-IN", "ta-IN", "te-IN", "kn-IN", "bn-IN", "gu-IN"]` to enable automatic multilingual detection.
2. WHEN the STT_Service receives a transcription response, THE STT_Service SHALL include the BCP-47 language code of the detected language in the `detectedLanguage` field of the response.
3. WHEN the Mobile_App receives a transcription response with a non-null `detectedLanguage`, THE Mobile_App SHALL display the detected language name (e.g., "Hindi", "Marathi") as a subtitle below the Description_Field.
4. THE Mobile_App SHALL allow the citizen to manually select a preferred language from the Supported_Languages list before recording, which THE Voice_Recorder SHALL pass as a `languageHint` parameter to the Transcription_Endpoint.
5. WHERE a `languageHint` is provided in the transcription request, THE STT_Service SHALL set that language as the primary `languageCode` in the Google Cloud Speech-to-Text API request, with the remaining Supported_Languages as `alternativeLanguageCodes`.

---

### Requirement 5: Transcription Result Integration with Complaint Form

**User Story:** As a citizen, I want the transcribed text to appear in the description field automatically, so that I can review and edit it before submitting.

#### Acceptance Criteria

1. WHEN the STT_Service returns a successful transcription with a non-empty `transcript`, THE Mobile_App SHALL insert the transcript text into the Description_Field, replacing any existing content.
2. WHEN the transcript is inserted into the Description_Field, THE Mobile_App SHALL allow the citizen to edit the transcribed text before submitting the complaint.
3. WHEN the STT_Service returns a `transcript` that is an empty string, THE Mobile_App SHALL display the message "No speech detected, please try again" and SHALL NOT modify the Description_Field.
4. WHILE the transcription request is in progress, THE Mobile_App SHALL display a loading indicator on the microphone button and SHALL disable the microphone button and the Description_Field to prevent concurrent edits.
5. WHEN the transcription completes (success or failure), THE Mobile_App SHALL re-enable the microphone button and the Description_Field.
6. WHEN a citizen has used voice input and then edits the Description_Field manually, THE Mobile_App SHALL retain the edited text and SHALL NOT overwrite it on subsequent actions other than a new voice recording.

---

### Requirement 6: Transcription Failure Fallback

**User Story:** As a citizen, I want to be able to type my complaint description if voice transcription fails, so that a network or API error does not block me from submitting a report.

#### Acceptance Criteria

1. IF the `POST /api/voice/transcribe` request fails due to a network error or returns a non-200 HTTP status code (excluding 200 with empty transcript), THEN THE Mobile_App SHALL display a toast notification with the message "Voice transcription unavailable, please type your description".
2. WHEN the fallback is triggered, THE Mobile_App SHALL leave the Description_Field empty and editable so the citizen can type manually.
3. IF the transcription request has not completed within 30 seconds on the client side, THEN THE Mobile_App SHALL cancel the request using an AbortController and trigger the fallback behavior described in criteria 1 and 2.
4. WHEN operating in fallback mode, THE Mobile_App SHALL retain any previously captured audio recording on the device for the duration of the session but SHALL NOT automatically retry the transcription.

---

### Requirement 7: Transcription Response Schema

**User Story:** As a developer, I want the transcription response to follow a strict schema, so that the mobile app can reliably parse and use the data.

#### Acceptance Criteria

1. THE STT_Service SHALL return a JSON response on success conforming to: `{ "transcript": string, "detectedLanguage": string | null, "confidence": number }`.
2. THE `transcript` field SHALL always be a string (empty string `""` when no speech is detected, never `null`).
3. THE `detectedLanguage` field SHALL be a BCP-47 language code string (e.g., `"en-IN"`, `"hi-IN"`) when a language is detected, or `null` when no speech is detected.
4. THE `confidence` field SHALL be a floating-point number in the range `[0.0, 1.0]` inclusive.
5. FOR ALL valid audio inputs that produce a successful transcription, parsing the response body as JSON and then re-serializing it SHALL produce an equivalent JSON string (round-trip property).

---

### Requirement 8: Backend Configuration and Security

**User Story:** As a developer, I want the STT API key to be stored securely on the backend, so that it is never exposed to the mobile client.

#### Acceptance Criteria

1. THE API_Server SHALL read the Google Cloud Speech-to-Text API key exclusively from the `GOOGLE_STT_API_KEY` environment variable and SHALL NOT include it in any HTTP response or client-side bundle.
2. THE Transcription_Endpoint SHALL require a valid JWT token for every request, enforced by the Auth_Middleware, so that unauthenticated clients cannot consume the STT quota.
3. THE API_Server SHALL limit the accepted audio file size at the Transcription_Endpoint to a maximum of 10 MB per request; IF the file exceeds this limit, THEN THE API_Server SHALL return HTTP 413 with `{ "error": "Audio file too large" }`.
4. THE API_Server SHALL accept only audio MIME types (`audio/aac`, `audio/wav`, `audio/mpeg`, `audio/mp4`, `audio/webm`) at the Transcription_Endpoint; IF an unsupported MIME type is submitted, THEN THE API_Server SHALL return HTTP 415 with `{ "error": "Unsupported audio format" }`.

---

### Requirement 9: Coexistence with AI Image Analysis

**User Story:** As a citizen, I want to use both photo capture and voice input together, so that I can submit the most complete complaint possible.

#### Acceptance Criteria

1. WHEN a citizen uses AI image analysis (from the `ai-civic-complaint-capture` feature) and the analysis returns `isCivicIssue: true`, THE Mobile_App SHALL pre-fill the Description_Field with the AI-generated description AND SHALL keep the microphone button active so the citizen can override the description with voice input.
2. WHEN a citizen records a voice description after an AI image analysis has pre-filled the Description_Field, THE Mobile_App SHALL replace the AI-generated description with the voice transcript upon successful transcription.
3. WHEN both AI image analysis and voice transcription have been used in the same session, THE Mobile_App SHALL submit only the final content of the Description_Field (whichever was last set) to `POST /api/complaints`.
4. THE Mobile_App SHALL allow the citizen to use voice input independently of whether a photo has been captured or AI analysis has been performed.
