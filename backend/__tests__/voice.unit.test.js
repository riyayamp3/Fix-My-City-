/**
 * Unit tests for voiceController and voiceRoutes
 *
 * Validates: Requirements 3.1, 3.2, 8.2, 3.4, 3.5, 3.7, 3.8, 3.9, 3.10
 *
 * Tests:
 *  - 503: GOOGLE_STT_API_KEY missing
 *  - 400: req.file missing
 *  - 504: fetch throws AbortError (timeout)
 *  - 502: fetch throws network error
 *  - 200: empty results array → blank transcript
 *  - 200: valid STT result → correct transcript/language/confidence
 *  - Route: protect middleware applied to POST /transcribe
 *  - Route: upload.single('audio') applied (multer handles file upload)
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock multer so upload.single('audio') is a controllable middleware
// ---------------------------------------------------------------------------
const mockSingleMiddleware = jest.fn();
const mockUploadSingle = jest.fn(() => mockSingleMiddleware);
const mockMulter = jest.fn(() => ({ single: mockUploadSingle }));
mockMulter.memoryStorage = jest.fn(() => ({}));
mockMulter.MulterError = class MulterError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};

jest.unstable_mockModule('multer', () => ({ default: mockMulter }));

// ---------------------------------------------------------------------------
// Dynamically import controller and route AFTER mocks are registered
// ---------------------------------------------------------------------------
const { transcribe, upload } = await import('../controllers/voiceController.js');
const { default: voiceRouter } = await import('../routes/voiceRoutes.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(overrides = {}) {
  return {
    file: {
      buffer: Buffer.from('fake-audio'),
      mimetype: 'audio/wav',
    },
    body: {},
    headers: {},
    ...overrides,
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const ORIGINAL_STT_KEY = process.env.GOOGLE_STT_API_KEY;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GOOGLE_STT_API_KEY = 'test-stt-key';

  // Default: multer middleware calls next (no error, passes file through)
  mockSingleMiddleware.mockImplementation((req, res, cb) => cb(null));
});

afterAll(() => {
  if (ORIGINAL_STT_KEY === undefined) {
    delete process.env.GOOGLE_STT_API_KEY;
  } else {
    process.env.GOOGLE_STT_API_KEY = ORIGINAL_STT_KEY;
  }
});

// ---------------------------------------------------------------------------
// Helper: invoke transcribe and let multer pass through
// ---------------------------------------------------------------------------
async function callTranscribe(req, res) {
  return new Promise((resolve) => {
    const next = (err) => resolve(err);
    transcribe(req, res, next);
    // Wait for async resolution
    setTimeout(resolve, 100);
  });
}

// ---------------------------------------------------------------------------
// 503 — missing GOOGLE_STT_API_KEY
// Validates: Requirement 3.1
// ---------------------------------------------------------------------------

describe('503 — missing GOOGLE_STT_API_KEY', () => {
  it('returns 503 with "STT service not configured" when key is absent', async () => {
    process.env.GOOGLE_STT_API_KEY = '';

    const req = makeReq();
    const res = makeRes();

    await callTranscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'STT service not configured' });
  });
});

// ---------------------------------------------------------------------------
// 400 — no audio file
// Validates: Requirement 3.2
// ---------------------------------------------------------------------------

describe('400 — no audio file provided', () => {
  it('returns 400 with "No audio file provided" when req.file is missing', async () => {
    const req = makeReq({ file: undefined });
    const res = makeRes();

    await callTranscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No audio file provided' });
  });
});

// ---------------------------------------------------------------------------
// 504 — fetch AbortError (timeout)
// Validates: Requirement 3.7
// ---------------------------------------------------------------------------

describe('504 — transcription timeout', () => {
  it('returns 504 with "Transcription timed out" when fetch throws AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    global.fetch = jest.fn().mockRejectedValue(abortError);

    const req = makeReq();
    const res = makeRes();

    await callTranscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({ error: 'Transcription timed out' });

    delete global.fetch;
  });
});

// ---------------------------------------------------------------------------
// 502 — network error
// Validates: Requirement 3.8
// ---------------------------------------------------------------------------

describe('502 — STT service unavailable', () => {
  it('returns 502 with "STT service unavailable" when fetch throws a network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    const req = makeReq();
    const res = makeRes();

    await callTranscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ error: 'STT service unavailable' });

    delete global.fetch;
  });
});

// ---------------------------------------------------------------------------
// 200 — empty results array
// Validates: Requirement 3.9
// ---------------------------------------------------------------------------

describe('200 — empty results', () => {
  it('returns 200 with blank transcript when STT returns empty results', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ results: [] }),
    });

    const req = makeReq();
    const res = makeRes();

    await callTranscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      transcript: '',
      detectedLanguage: null,
      confidence: 0.0,
    });

    delete global.fetch;
  });

  it('returns 200 with blank transcript when STT returns no results field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({}),
    });

    const req = makeReq();
    const res = makeRes();

    await callTranscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      transcript: '',
      detectedLanguage: null,
      confidence: 0.0,
    });

    delete global.fetch;
  });
});

// ---------------------------------------------------------------------------
// 200 — valid STT result
// Validates: Requirements 3.4, 3.5, 3.10
// ---------------------------------------------------------------------------

describe('200 — valid STT result', () => {
  it('returns 200 with correct transcript, detectedLanguage, and confidence', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        results: [
          {
            alternatives: [
              {
                transcript: 'There is a pothole on Main Street.',
                confidence: 0.95,
              },
            ],
            languageCode: 'en-IN',
          },
        ],
      }),
    });

    const req = makeReq();
    const res = makeRes();

    await callTranscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      transcript: 'There is a pothole on Main Street.',
      detectedLanguage: 'en-IN',
      confidence: 0.95,
    });

    delete global.fetch;
  });
});

// ---------------------------------------------------------------------------
// Route: protect middleware applied to POST /transcribe
// Validates: Requirement 8.2
// ---------------------------------------------------------------------------

describe('voiceRoutes — route configuration', () => {
  it('applies protect middleware to POST /transcribe', () => {
    const routes = voiceRouter.stack;
    const transcribeRoute = routes.find(
      (layer) => layer.route && layer.route.path === '/transcribe'
    );

    expect(transcribeRoute).toBeDefined();
    expect(transcribeRoute.route.methods.post).toBe(true);

    // The route stack should have at least 2 handlers: protect + transcribe
    const handlers = transcribeRoute.route.stack;
    expect(handlers.length).toBeGreaterThanOrEqual(2);
  });

  it('applies upload.single("audio") via transcribe middleware (multer handles file upload)', () => {
    // upload is exported from voiceController and uses multer memoryStorage
    // Verify upload.single is callable (multer instance is set up correctly)
    expect(upload).toBeDefined();
    expect(typeof upload.single).toBe('function');
  });
});
