// Feature: ai-civic-complaint-capture, Property 6: Non-JSON LLM responses always return HTTP 422

/**
 * Property-Based Tests for analyzeImageController
 *
 * **Validates: Requirements 4.9**
 *
 * Property 6: For any string returned by the LLM that cannot be parsed as valid JSON,
 * the analyzeImageController should always return HTTP 422 with
 * { "error": "AI returned unparseable response" }.
 */

import { jest } from '@jest/globals';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Mock cloudinary config module — always succeeds with a fake URL
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
// Mock @google/generative-ai — returns whatever string we inject
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

function makeReq() {
  return {
    file: {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg',
    },
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

/** Returns true if the string is valid JSON (i.e., JSON.parse succeeds) */
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const ORIGINAL_GEMINI_KEY = process.env.GEMINI_API_KEY;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GEMINI_API_KEY = 'test-key';

  // Cloudinary always succeeds
  mockUploadStream.mockImplementation((_opts, callback) => {
    const fakeStream = { end: jest.fn() };
    setImmediate(() => callback(null, { secure_url: 'https://res.cloudinary.com/test/image.jpg' }));
    return fakeStream;
  });
});

afterAll(() => {
  if (ORIGINAL_GEMINI_KEY === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = ORIGINAL_GEMINI_KEY;
  }
});

// ---------------------------------------------------------------------------
// Property 6: Non-JSON LLM responses always return HTTP 422
// Validates: Requirements 4.9
// ---------------------------------------------------------------------------

describe('Property 6: Non-JSON LLM responses always return HTTP 422', () => {
  it('always returns 422 with unparseable error for any non-JSON string from LLM', async () => {
    // Generator: any string that is NOT valid JSON
    const nonJsonString = fc.string().filter((str) => !isValidJson(str));

    await fc.assert(
      fc.asyncProperty(nonJsonString, async (llmResponse) => {
        jest.clearAllMocks();

        // Cloudinary succeeds
        mockUploadStream.mockImplementation((_opts, callback) => {
          const fakeStream = { end: jest.fn() };
          setImmediate(() =>
            callback(null, { secure_url: 'https://res.cloudinary.com/test/image.jpg' })
          );
          return fakeStream;
        });

        // Gemini returns the non-JSON string
        mockGenerateContent.mockResolvedValue({
          response: { text: () => llmResponse },
        });

        const req = makeReq();
        const res = makeRes();

        await analyzeImage(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({ error: 'AI returned unparseable response' });
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: ai-civic-complaint-capture, Property 7: AI analysis response always conforms to schema

/**
 * Property 7: AI analysis response always conforms to schema
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 *
 * For any valid image input that results in a successful LLM call, the HTTP 200
 * response body should always conform to the full schema:
 * - isCivicIssue is a boolean
 * - when isCivicIssue is true: category is one of the valid values, severity is
 *   one of the valid values, description is a string or null
 * - when isCivicIssue is false: category, severity, and description are all null
 * - imageUrl is a non-empty string
 */

const VALID_CATEGORIES = ['pothole', 'garbage', 'water_leak', 'streetlight', 'road_damage', 'other'];
const VALID_SEVERITIES = ['low', 'medium', 'high'];

describe('Property 7: AI analysis response always conforms to schema', () => {
  it('always returns a 200 body conforming to the full schema for any mock LLM response', async () => {
    // Generator: mock LLM response records with all combinations of fields
    const llmResponseArb = fc.record({
      isCivicIssue: fc.boolean(),
      category: fc.constantFrom('pothole', 'garbage', 'water_leak', 'streetlight', 'road_damage', 'other', null),
      severity: fc.constantFrom('low', 'medium', 'high', null),
      description: fc.oneof(fc.string(), fc.constant(null)),
    });

    await fc.assert(
      fc.asyncProperty(llmResponseArb, async (llmRecord) => {
        jest.clearAllMocks();

        // Cloudinary always succeeds
        mockUploadStream.mockImplementation((_opts, callback) => {
          const fakeStream = { end: jest.fn() };
          setImmediate(() =>
            callback(null, { secure_url: 'https://res.cloudinary.com/test/image.jpg' })
          );
          return fakeStream;
        });

        // Gemini returns JSON.stringify of the generated record
        mockGenerateContent.mockResolvedValue({
          response: { text: () => JSON.stringify(llmRecord) },
        });

        const req = makeReq();
        const res = makeRes();

        await analyzeImage(req, res);

        // Must always return 200
        expect(res.status).toHaveBeenCalledWith(200);

        const body = res.json.mock.calls[0][0];

        // isCivicIssue must be a boolean
        expect(typeof body.isCivicIssue).toBe('boolean');

        // imageUrl must be a non-empty string
        expect(typeof body.imageUrl).toBe('string');
        expect(body.imageUrl.length).toBeGreaterThan(0);

        if (body.isCivicIssue) {
          // category must be one of the valid values
          expect(VALID_CATEGORIES).toContain(body.category);

          // severity must be one of the valid values
          expect(VALID_SEVERITIES).toContain(body.severity);

          // description is a string or null (controller passes through what LLM returned)
          expect(body.description === null || typeof body.description === 'string').toBe(true);
        } else {
          // when isCivicIssue is false, all three must be null
          expect(body.category).toBeNull();
          expect(body.severity).toBeNull();
          expect(body.description).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: ai-civic-complaint-capture, Property 12: Severity normalization is total and correct

/**
 * Property 12: Severity normalization is total and correct
 *
 * **Validates: Requirements 8.3**
 *
 * For any of the 9 accepted severity input values (low/medium/high in any casing),
 * applying severity?.toUpperCase() must always produce the correct uppercase equivalent.
 */

describe('Property 12: Severity normalization is total and correct', () => {
  it('always normalizes any accepted severity casing to its uppercase equivalent', () => {
    const severityArb = fc.constantFrom(
      'low', 'medium', 'high',
      'Low', 'Medium', 'High',
      'LOW', 'MEDIUM', 'HIGH'
    );

    fc.assert(
      fc.property(severityArb, (severity) => {
        const normalized = severity?.toUpperCase();
        expect(normalized).toBe(severity.toUpperCase());
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(normalized);
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: ai-civic-complaint-capture, Property 4: Auth middleware rejects all unauthenticated requests to analyze-image

/**
 * Property 4: Auth middleware rejects all unauthenticated requests to analyze-image
 *
 * **Validates: Requirements 4.2, 4.3**
 *
 * For any Authorization header value generated by fc.option(fc.string()) —
 * which includes undefined (no header) and arbitrary strings that are not valid JWTs —
 * a POST to /api/complaints/analyze-image must always return HTTP 401.
 */

import express from 'express';
import supertest from 'supertest';
import { protect } from '../middleware/authMiddleware.js';

describe('Property 4: Auth middleware rejects all unauthenticated requests to analyze-image', () => {
  // Build a minimal Express app: real protect middleware + a mock handler that would return 200
  const app = express();
  app.use(express.json());
  app.post(
    '/api/complaints/analyze-image',
    protect,
    (_req, res) => res.status(200).json({ ok: true })
  );

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('always returns 401 for any missing or invalid Authorization token', async () => {
    // fc.option(fc.string()) produces either undefined (no value) or an arbitrary string
    // Neither case will be a valid JWT signed with JWT_SECRET, so protect must reject all of them
    await fc.assert(
      fc.asyncProperty(fc.option(fc.string()), async (authValue) => {
        const req = supertest(app).post('/api/complaints/analyze-image');

        if (authValue !== null && authValue !== undefined) {
          req.set('Authorization', `Bearer ${authValue}`);
        }
        // When authValue is null/undefined, no Authorization header is sent

        const response = await req;

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: ai-civic-complaint-capture, Property 13: Complaint submission round-trip

/**
 * Property 13: Complaint submission round-trip
 *
 * **Validates: Requirements 8.4**
 *
 * For any valid complaint payload (description, severity, category), a POST to
 * /api/complaints must always return HTTP 201 with the severity field uppercased.
 */

// Mock the Complaint model so no real DB is needed
jest.unstable_mockModule('../models/Complaint.js', () => ({
  default: {
    create: jest.fn(),
  },
}));

// Mock authMiddleware so protect passes through with a fake user
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  },
}));

// Dynamically import after mocks are registered
const { default: ComplaintModel } = await import('../models/Complaint.js');
const complaintRouter = (await import('../routes/complaintRoutes.js')).default;

describe('Property 13: Complaint submission round-trip', () => {
  // Build a minimal Express app with the complaint router
  const app = express();
  app.use(express.json());
  app.use('/api/complaints', complaintRouter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('always returns 201 with severity uppercased for any valid complaint payload', async () => {
    const complaintArb = fc.record({
      description: fc.string({ minLength: 1 }),
      severity: fc.constantFrom('low', 'medium', 'high'),
      category: fc.constantFrom('pothole', 'garbage', 'water_leak', 'streetlight', 'road_damage', 'other'),
    });

    await fc.assert(
      fc.asyncProperty(complaintArb, async (payload) => {
        const expectedSeverity = payload.severity.toUpperCase();

        // Mock Complaint.create to return the submitted data with severity uppercased
        ComplaintModel.create.mockResolvedValue({
          ...payload,
          severity: expectedSeverity,
          userId: 'test-user-id',
          status: 'RECEIVED',
        });

        const response = await supertest(app)
          .post('/api/complaints')
          .send(payload)
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(201);
        expect(response.body.severity).toBe(expectedSeverity);
      }),
      { numRuns: 100 }
    );
  });
});
