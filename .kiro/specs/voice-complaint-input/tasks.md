# Implementation Plan: Voice Complaint Input

## Overview

Incremental implementation across three areas: backend STT endpoint, mobile recording hook and UI components, and ReportScreen integration. Each task builds on the previous, ending with full integration. All backend code uses ESM (`import`/`export`).

## Tasks

- [x] 1. Add `GOOGLE_STT_API_KEY` to backend environment and validate on startup
  - Add `GOOGLE_STT_API_KEY=` entry to `backend/.env`
  - In `backend/server.js`, add a startup warning (mirroring the existing `GEMINI_API_KEY` check): if `!process.env.GOOGLE_STT_API_KEY`, log `"Warning: GOOGLE_STT_API_KEY is not set. Voice features will not work."`
  - Import and mount `voiceRoutes` at `/api/voice` in `server.js`
  - _Requirements: 8.1, 3.9_

- [x] 2. Create `backend/controllers/voiceController.js`
  - Export `upload` multer instance: `memoryStorage()`, 10 MB `fileSize` limit, `fileFilter` allowing only `audio/aac`, `audio/wav`, `audio/mpeg`, `audio/mp4`, `audio/webm`; on rejected MIME attach `code: 'UNSUPPORTED_MIME'` to the error
  - Export `transcribe` async function (ESM)
  - Guard: if `process.env.GOOGLE_STT_API_KEY` is falsy → return 503 `{ "error": "STT service not configured" }`
  - Guard: if `req.file` is missing → return 400 `{ "error": "No audio file provided" }`
  - Handle multer errors in the controller or via an error-handling wrapper: `LIMIT_FILE_SIZE` → 413 `{ "error": "Audio file too large" }`; `UNSUPPORTED_MIME` → 415 `{ "error": "Unsupported audio format" }`
  - Build Google Cloud STT REST request body: `audio.content` = `req.file.buffer.toString('base64')`; `config.languageCode` = `req.body.languageHint ?? "en-IN"`; `config.alternativeLanguageCodes` = remaining 7 Supported_Languages; `config.sampleRateHertz = 16000`; `config.enableAutomaticPunctuation = true`; `config.model = "latest_long"`
  - Call `https://speech.googleapis.com/v1/speech:recognize?key=GOOGLE_STT_API_KEY` via `fetch` wrapped in a 30-second `AbortController`; on `AbortError` → 504 `{ "error": "Transcription timed out" }`; on network throw → 502 `{ "error": "STT service unavailable" }`
  - Extract `results[0].alternatives[0]` from STT response; if `results` is empty → return 200 `{ transcript: "", detectedLanguage: null, confidence: 0.0 }`
  - Return 200 `{ transcript, detectedLanguage, confidence }`
  - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 4.1, 4.5, 7.1, 7.2, 7.3, 7.4, 8.1, 8.3, 8.4_

  - [ ]* 2.1 Write property test for auth rejection (P1)
    - **Property 1: Auth middleware rejects all unauthenticated requests**
    - **Validates: Requirements 3.2, 3.3, 8.2**
    - File: `backend/__tests__/voice.property.test.js`
    - Use `fc.option(fc.string())` for Authorization header values; assert HTTP 401 for all missing/invalid tokens before any STT call

  - [ ]* 2.2 Write property test for multilingual config (P2)
    - **Property 2: Multilingual config is always applied correctly**
    - **Validates: Requirements 4.1**
    - File: `backend/__tests__/voice.property.test.js`
    - Use `fc.record({})` with no `languageHint`; mock `fetch` and capture the STT request body; assert `languageCode === "en-IN"` and `alternativeLanguageCodes` equals `["hi-IN","mr-IN","ta-IN","te-IN","kn-IN","bn-IN","gu-IN"]`

  - [ ]* 2.3 Write property test for languageHint override (P3)
    - **Property 3: languageHint overrides primary languageCode**
    - **Validates: Requirements 4.5**
    - File: `backend/__tests__/voice.property.test.js`
    - Use `fc.constantFrom('en-IN','hi-IN','mr-IN','ta-IN','te-IN','kn-IN','bn-IN','gu-IN')` as `languageHint`; assert STT call sets that value as `languageCode` and remaining 7 codes as `alternativeLanguageCodes`

  - [ ]* 2.4 Write property test for response schema invariant (P4)
    - **Property 4: Response schema invariant**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 3.5**
    - File: `backend/__tests__/voice.property.test.js`
    - Use `fc.record({ transcript: fc.string(), detectedLanguage: fc.option(fc.string()), confidence: fc.float({min:0,max:1}) })` as mock STT result; assert 200 body always has `transcript` as string, `detectedLanguage` as string or null, `confidence` in `[0.0, 1.0]`

  - [ ]* 2.5 Write property test for JSON round-trip (P5)
    - **Property 5: Response JSON round-trip**
    - **Validates: Requirements 7.5**
    - File: `backend/__tests__/voice.property.test.js`
    - Use same generator as P4; assert `JSON.parse(JSON.stringify(response))` deep-equals the original response object

  - [ ]* 2.6 Write property test for file size guard (P11)
    - **Property 11: File size guard returns 413 for oversized audio**
    - **Validates: Requirements 8.3**
    - File: `backend/__tests__/voice.property.test.js`
    - Use `fc.integer({min:10485761, max:20971520})` as file byte length; assert HTTP 413 with `{ "error": "Audio file too large" }` and no STT call made

  - [ ]* 2.7 Write property test for MIME type guard (P12)
    - **Property 12: MIME type guard returns 415 for non-audio types**
    - **Validates: Requirements 8.4**
    - File: `backend/__tests__/voice.property.test.js`
    - Use `fc.string()` filtered to exclude `audio/aac`, `audio/wav`, `audio/mpeg`, `audio/mp4`, `audio/webm`; assert HTTP 415 with `{ "error": "Unsupported audio format" }` and no STT call made

  - [ ]* 2.8 Write property test for API key not in response (P13)
    - **Property 13: API key never appears in any HTTP response**
    - **Validates: Requirements 8.1**
    - File: `backend/__tests__/voice.property.test.js`
    - Set `GOOGLE_STT_API_KEY` to a generated string; use `fc.record(...)` to generate any response scenario (success, 400, 503, 504, 502); assert response body string never contains the key value

- [x] 3. Create `backend/routes/voiceRoutes.js`
  - Import `Router` from `express`, `protect` from `../middleware/authMiddleware.js`, and `upload`, `transcribe` from `../controllers/voiceController.js`
  - Register `router.post('/transcribe', protect, upload.single('audio'), transcribe)`
  - Export `router` as default
  - _Requirements: 3.1, 3.2, 8.2_

  - [ ]* 3.1 Write unit tests for voiceController and voiceRoutes
    - File: `backend/__tests__/voice.unit.test.js`
    - Mock `GOOGLE_STT_API_KEY` missing → assert 503
    - Mock `req.file` missing → assert 400
    - Mock `fetch` to resolve after 31s (fake timers / AbortError) → assert 504
    - Mock `fetch` to throw a network error → assert 502
    - Mock `fetch` to return empty `results` array → assert 200 with `{ transcript: "", detectedLanguage: null, confidence: 0.0 }`
    - Mock `fetch` to return valid STT result → assert 200 with correct `transcript`, `detectedLanguage`, `confidence`
    - Assert `protect` middleware is applied to `POST /transcribe`
    - Assert `upload.single('audio')` is applied to `POST /transcribe`
    - _Requirements: 3.2, 3.4, 3.5, 3.7, 3.8, 3.9, 3.10_

- [x] 4. Checkpoint — backend tests pass
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 5. Create `mobile/hooks/useVoiceRecorder.ts`
  - Install `expo-av` if not already present: `npx expo install expo-av`
  - Call `Audio.requestPermissionsAsync()` on first `startRecording` invocation; if denied, show alert with "Open Settings" button (`Linking.openSettings()`)
  - Configure `Audio.Recording` with `AAC_EHE` preset, `sampleRate: 16000`, `numberOfChannels: 1`
  - Start a 1-second `setInterval` to increment `elapsedSeconds`; clear on stop or cancel
  - Auto-stop via `setTimeout` at 60 seconds, calling `stopAndTranscribe()`
  - On stop: read recording duration; if `< 1000ms` → discard, show toast "Recording too short, please try again", return without uploading
  - Build `FormData` with `audio` file and optional `languageHint`; POST to `/api/voice/transcribe` via `api.postForm` with a 30-second `AbortController`
  - On success with non-empty `transcript`: call `onTranscript(transcript, detectedLanguage)` callback
  - On success with empty `transcript`: show toast "No speech detected, please try again"; do not call `onTranscript`
  - On failure or AbortController timeout: show toast "Voice transcription unavailable, please type your description"
  - Set `isTranscribing: true` before fetch, `isTranscribing: false` in finally block
  - Return `{ isRecording, isTranscribing, elapsedSeconds, permissionStatus, startRecording, stopAndTranscribe, cancelRecording }`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.4, 5.5, 6.1, 6.2, 6.3_

  - [ ]* 5.1 Write property test for short recording guard (P6)
    - **Property 6: Short recording guard blocks submission**
    - **Validates: Requirements 2.7**
    - File: `mobile/__tests__/useVoiceRecorder.property.test.js`
    - Use `fc.integer({min:0, max:999})` as recording duration ms; assert no fetch call is made and toast "Recording too short, please try again" is shown

  - [ ]* 5.2 Write property test for transcript insertion (P7)
    - **Property 7: Transcript insertion replaces description field**
    - **Validates: Requirements 5.1, 9.2**
    - File: `mobile/__tests__/useVoiceRecorder.property.test.js`
    - Use `fc.string({minLength:1})` as transcript and `fc.string()` as prior description; assert `onTranscript` is called with the new transcript regardless of prior content

  - [ ]* 5.3 Write property test for empty transcript no-op (P8)
    - **Property 8: Empty transcript does not modify description field**
    - **Validates: Requirements 5.3, 3.8**
    - File: `mobile/__tests__/useVoiceRecorder.property.test.js`
    - Use `fc.string({minLength:1})` as existing description; mock STT response with `transcript: ""`; assert `onTranscript` is NOT called and toast "No speech detected, please try again" is shown

  - [ ]* 5.4 Write property test for fallback behavior (P10)
    - **Property 10: Fallback on failure leaves description empty and editable**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - File: `mobile/__tests__/useVoiceRecorder.property.test.js`
    - Use `fc.oneof(fc.constant('network'), fc.integer({min:400,max:599}))` as failure mode; assert fallback toast shown, `onTranscript` not called, `isTranscribing` is false after failure

  - [ ]* 5.5 Write unit tests for useVoiceRecorder hook
    - File: `mobile/__tests__/useVoiceRecorder.unit.test.js`
    - Permission denied → assert alert shown with "Open Settings" button
    - 60s auto-stop → assert `stopAndTranscribe` is called after 60 seconds (fake timers)
    - `startRecording` → assert `isRecording` becomes true
    - `stopAndTranscribe` → assert `isTranscribing` becomes true then false
    - `cancelRecording` → assert recording is discarded and `isRecording` becomes false
    - _Requirements: 1.3, 2.4, 2.2, 5.4, 5.5_

- [x] 6. Create `mobile/components/VoiceMicButton.tsx`
  - Accept props: `isRecording`, `isTranscribing`, `isDisabled`, `elapsedSeconds`, `onPress`
  - When `isRecording`: render animated pulsing red ring using `Animated.loop` + elapsed time label (e.g., `"0:12"`)
  - When `isTranscribing`: render `ActivityIndicator` in place of mic icon
  - When `isDisabled`: render mic icon at reduced opacity with `disabled` prop set
  - Default state: render mic icon at full opacity, pressable
  - _Requirements: 2.2, 2.5, 5.4_

  - [ ]* 6.1 Write unit tests for VoiceMicButton
    - File: `mobile/__tests__/VoiceMicButton.unit.test.js`
    - `isRecording: true` → assert pulse animation element is rendered and elapsed timer is visible
    - `isTranscribing: true` → assert `ActivityIndicator` is rendered and mic icon is not
    - `isDisabled: true` → assert button has `disabled` prop and reduced opacity style
    - `elapsedSeconds: 42` → assert timer label shows `"0:42"`
    - _Requirements: 2.2, 2.5, 5.4_

- [x] 7. Add language selector to `ReportScreen`
  - Define `SUPPORTED_LANGUAGES` constant (array of `{ label, value }` objects for Auto-detect + 8 languages)
  - Render a `Picker` (or `Modal`-based dropdown) above the mic button, populated from `SUPPORTED_LANGUAGES`
  - Add `languageHint: string | null` to `FormState`; update it on picker selection
  - Pass `languageHint` to `useVoiceRecorder` so it is appended to `FormData` before upload
  - _Requirements: 4.4_

- [x] 8. Integrate voice input into `app/report.tsx` (ReportScreen)
  - Add `detectedLanguage`, `isTranscribing`, and `voiceUsed` to `FormState`
  - Instantiate `useVoiceRecorder` with `onTranscript` callback: set `description` to transcript, set `detectedLanguage`
  - Render `<VoiceMicButton>` adjacent to the Description_Field label (to the right of the `TextInput`)
  - Render detected language subtitle (`<Text>Detected: Hindi</Text>`) below the `TextInput` when `detectedLanguage` is non-null
  - Disable `Description_Field` TextInput while `isTranscribing` is true; re-enable on completion
  - Mic button remains enabled when `isAnalyzing` (AI image analysis) is true — only `isTranscribing` disables it
  - Voice transcript replaces any existing description (including AI pre-fill); last-written value wins
  - _Requirements: 2.1, 4.3, 5.1, 5.2, 5.4, 5.5, 5.6, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 8.1 Write property test for loading state disabling controls (P9)
    - **Property 9: Loading state disables controls; completion re-enables them**
    - **Validates: Requirements 5.4, 5.5**
    - File: `mobile/__tests__/useVoiceRecorder.property.test.js`
    - Use `fc.boolean()` for `isTranscribing`; assert `VoiceMicButton` and `Description_Field` have `disabled` prop when `isTranscribing` is true, and are enabled when false

  - [ ]* 8.2 Write property test for mic button independence from photo state (P15)
    - **Property 15: Mic button active regardless of photo capture state**
    - **Validates: Requirements 9.4**
    - File: `mobile/__tests__/useVoiceRecorder.property.test.js`
    - Use `fc.option(fc.string())` as `imageUri`; assert `VoiceMicButton` is not disabled when `isTranscribing` is false and permission is granted, regardless of `imageUri`

  - [ ]* 8.3 Write property test for submitted description equals FormState (P16)
    - **Property 16: Submitted description always equals final Description_Field content**
    - **Validates: Requirements 9.3, 5.6**
    - File: `mobile/__tests__/useVoiceRecorder.property.test.js`
    - Use `fc.array(fc.oneof(fc.constant('ai-prefill'), fc.constant('voice'), fc.constant('manual-edit')))` as sequence of edits; assert `description` in `POST /api/complaints` body equals `FormState.description` at submission time

  - [ ]* 8.4 Write unit tests for ReportScreen voice integration
    - File: `mobile/__tests__/ReportScreen.voice.test.js`
    - AI pre-fill + voice override → assert `description` equals transcript after voice transcription
    - Language selector selection → assert `languageHint` is appended to `FormData` in the POST request
    - `detectedLanguage: "hi-IN"` response → assert subtitle "Detected: Hindi" is rendered below Description_Field
    - `isAnalyzing: true` (AI in progress) → assert mic button is NOT disabled
    - `isTranscribing: true` → assert Description_Field TextInput is disabled
    - _Requirements: 4.3, 4.4, 5.4, 9.1, 9.2, 9.4_

  - [ ]* 8.5 Write property test for detected language display (P14)
    - **Property 14: Detected language name displayed for all supported BCP-47 codes**
    - **Validates: Requirements 4.3**
    - File: `mobile/__tests__/ReportScreen.voice.test.js`
    - Use `fc.constantFrom('en-IN','hi-IN','mr-IN','ta-IN','te-IN','kn-IN','bn-IN','gu-IN')` as `detectedLanguage`; assert subtitle contains the corresponding human-readable name for every supported code

- [x] 9. Final checkpoint — all tests pass
  - Ensure all backend and mobile tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All backend code must use ESM (`import`/`export`) — `"type": "module"` is set in `backend/package.json`
- Backend STT call uses Node 18+ built-in `fetch` — no new HTTP client dependency needed
- `multer` is already present in backend from the `ai-civic-complaint-capture` feature
- `fast-check` is already in `backend/devDependencies`; add it to mobile test setup separately
- Property tests run a minimum of 100 iterations and are tagged with `// Feature: voice-complaint-input, Property {N}: ...`
- The `GOOGLE_STT_API_KEY` startup warning in `server.js` mirrors the existing `GEMINI_API_KEY` pattern
- `expo-av` must be installed via `npx expo install expo-av` (not plain `npm install`)
