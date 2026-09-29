/**
 * Unit tests for analyzeImageController error paths
 *
 * Validates: Requirements 4.8, 4.9, 4.10, 4.11
 *
 * Tests:
 *  - 502: Cloudinary upload_stream calls error callback
 *  - 503: GEMINI_API_KEY is missing
 *  - 504: Gemini call exceeds 15s (AbortError / TIMEOUT)
 *  - 200: Valid LLM JSON response returns correct shape
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock cloudinary config module
// ---------------------------------------------------------------------------
const mockUploadStream = jest.fn();

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  default: {
    uploader: {
      upload_stream: mockUploadStream,
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock @google/generative-ai
// ---------------------------------------------------------------------------
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({ generateContent: mockGenerateContent }));
const mockGoogleGenerativeAI = jest.fn(() => ({ getGenerativeModel: mockGetGenerativeModel }));

jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: mockGoogleGenerativeAI,
}));

// ---------------------------------------------------------------------------
// Dynamically import the controller AFTER mocks are registered
// ---------------------------------------------------------------------------
const { analyzeImage } = await import('../controllers/analyzeImageController.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fake req with a file buffer attached */
function makeReq(overrides = {}) {
  return {
    file: {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg',
    },
    ...overrides,
  };
}

/** Build a minimal fake res that captures status + json calls */
function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const ORIGINAL_GEMINI_KEY = process.env.GEMINI_API_KEY;

beforeEach(() => {
  jest.clearAllMocks();
  // Default: key is present
  process.env.GEMINI_API_KEY = 'test-key';
});

afterAll(() => {
  // Restore original env
  if (ORIGINAL_GEMINI_KEY === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = ORIGINAL_GEMINI_KEY;
  }
});

// ---------------------------------------------------------------------------
// 503 — missing GEMINI_API_KEY
// Validates: Requirement 4.11
// ---------------------------------------------------------------------------

describe('503 — missing GEMINI_API_KEY', () => {
  it('returns 503 with "AI service not configured" when GEMINI_API_KEY is absent', async () => {
    process.env.GEMINI_API_KEY = '';

    const req = makeReq();
    const res = makeRes();

    await analyzeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'AI service not configured' });
  });
});

// ---------------------------------------------------------------------------
// 502 — Cloudinary upload_stream error callback
// Validates: Requirement 4.10
// ---------------------------------------------------------------------------

describe('502 — Cloudinary upload failure', () => {
  it('returns 502 with "Image upload failed" when upload_stream calls error callback', async () => {
    // Simulate upload_stream calling the callback with an error
    mockUploadStream.mockImplementation((_opts, callback) => {
      const fakeStream = { end: jest.fn() };
      // Call the callback asynchronously with an error
      setImmediate(() => callback(new Error('Cloudinary network error'), null));
      return fakeStream;
    });

    const req = makeReq();
    const res = makeRes();

    await analyzeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ error: 'Image upload failed' });
  });
});

// ---------------------------------------------------------------------------
// 504 — Gemini call exceeds 15 seconds
// Validates: Requirement 4.8
// ---------------------------------------------------------------------------

describe('504 — Gemini timeout', () => {
  it('returns 504 with "AI analysis timed out" when Gemini call never resolves within 15s', async () => {
    // Cloudinary succeeds
    mockUploadStream.mockImplementation((_opts, callback) => {
      const fakeStream = { end: jest.fn() };
      setImmediate(() => callback(null, { secure_url: 'https://res.cloudinary.com/test/image.jpg' }));
      return fakeStream;
    });

    // Gemini call returns a promise that rejects with TIMEOUT message
    // (simulating what the controller's own setTimeout does)
    mockGenerateContent.mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 0))
    );

    const req = makeReq();
    const res = makeRes();

    await analyzeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({ error: 'AI analysis timed out' });
  });
});

// ---------------------------------------------------------------------------
// 200 — Valid LLM JSON response
// Validates: Requirements 4.9 (shape), 4.8 (success path)
// ---------------------------------------------------------------------------

describe('200 — valid LLM JSON response', () => {
  it('returns 200 with correct AI_Analysis shape for a civic issue', async () => {
    // Cloudinary succeeds
    const fakeImageUrl = 'https://res.cloudinary.com/demo/civic-complaints/pothole.jpg';
    mockUploadStream.mockImplementation((_opts, callback) => {
      const fakeStream = { end: jest.fn() };
      setImmediate(() => callback(null, { secure_url: fakeImageUrl }));
      return fakeStream;
    });

    // Gemini returns valid JSON
    const llmPayload = {
      isCivicIssue: true,
      category: 'pothole',
      severity: 'high',
      description: 'Large pothole on main road causing traffic hazard.',
    };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(llmPayload) },
    });

    const req = makeReq();
    const res = makeRes();

    await analyzeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      isCivicIssue: true,
      category: 'pothole',
      severity: 'high',
      description: 'Large pothole on main road causing traffic hazard.',
      imageUrl: fakeImageUrl,
    });
  });

  it('returns 200 with nulled fields when isCivicIssue is false', async () => {
    const fakeImageUrl = 'https://res.cloudinary.com/demo/civic-complaints/cat.jpg';
    mockUploadStream.mockImplementation((_opts, callback) => {
      const fakeStream = { end: jest.fn() };
      setImmediate(() => callback(null, { secure_url: fakeImageUrl }));
      return fakeStream;
    });

    const llmPayload = {
      isCivicIssue: false,
      category: null,
      severity: null,
      description: null,
    };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(llmPayload) },
    });

    const req = makeReq();
    const res = makeRes();

    await analyzeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      isCivicIssue: false,
      category: null,
      severity: null,
      description: null,
      imageUrl: fakeImageUrl,
    });
  });

  it('strips markdown code fences from LLM response before parsing', async () => {
    const fakeImageUrl = 'https://res.cloudinary.com/demo/civic-complaints/garbage.jpg';
    mockUploadStream.mockImplementation((_opts, callback) => {
      const fakeStream = { end: jest.fn() };
      setImmediate(() => callback(null, { secure_url: fakeImageUrl }));
      return fakeStream;
    });

    const llmPayload = { isCivicIssue: true, category: 'garbage', severity: 'low', description: 'Overflowing bin.' };
    const wrappedInFences = '```json\n' + JSON.stringify(llmPayload) + '\n```';
    mockGenerateContent.mockResolvedValue({
      response: { text: () => wrappedInFences },
    });

    const req = makeReq();
    const res = makeRes();

    await analyzeImage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      isCivicIssue: true,
      category: 'garbage',
      severity: 'low',
    }));
  });
});
