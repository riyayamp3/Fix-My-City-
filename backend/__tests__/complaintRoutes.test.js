/**
 * Unit tests for complaint route ordering and middleware
 *
 * Validates: Requirements 4.1, 4.2
 *
 * Tests:
 *  - POST /api/complaints/analyze-image is matched before GET /:id
 *    (i.e., "analyze-image" is NOT treated as an :id param)
 *  - The protect middleware is applied to the analyze-image route
 *    (unauthenticated requests receive HTTP 401)
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock the analyzeImageController (analyzeImage + multer upload)
// ---------------------------------------------------------------------------
const mockAnalyzeImage = jest.fn((_req, res) => res.status(200).json({ ok: true }));
const mockUploadSingle = jest.fn(() => (_req, _res, next) => next());

jest.unstable_mockModule('../controllers/analyzeImageController.js', () => ({
  analyzeImage: mockAnalyzeImage,
  upload: { single: mockUploadSingle },
}));

// ---------------------------------------------------------------------------
// Mock the complaintController
// ---------------------------------------------------------------------------
const mockCreateComplaint   = jest.fn((_req, res) => res.status(201).json({ created: true }));
const mockGetComplaints     = jest.fn((_req, res) => res.status(200).json([]));
const mockGetComplaintById  = jest.fn((req, res) => res.status(200).json({ id: req.params.id }));
const mockGetMyComplaints   = jest.fn((_req, res) => res.status(200).json([]));
const mockUpdateStatus      = jest.fn((_req, res) => res.status(200).json({ updated: true }));

jest.unstable_mockModule('../controllers/complaintController.js', () => ({
  createComplaint:          mockCreateComplaint,
  getComplaints:            mockGetComplaints,
  getComplaintById:         mockGetComplaintById,
  getMyComplaints:          mockGetMyComplaints,
  updateComplaintStatus:    mockUpdateStatus,
  getHotspots:              jest.fn((_req, res) => res.status(200).json([])),
  updateVerificationStatus: jest.fn((_req, res) => res.status(200).json({ updated: true })),
  getComplaintHistory:      jest.fn((_req, res) => res.status(200).json([])),
}));

// ---------------------------------------------------------------------------
// Mock the protect middleware — default: PASS (call next())
// We'll override per-test to simulate 401.
// ---------------------------------------------------------------------------
const mockProtect = jest.fn((_req, _res, next) => next());

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: mockProtect,
}));

// ---------------------------------------------------------------------------
// Dynamically import router AFTER mocks are registered
// ---------------------------------------------------------------------------
const { default: complaintRouter } = await import('../routes/complaintRoutes.js');

// Build a minimal Express app that mounts the router at /api/complaints
import express from 'express';
import request from 'supertest';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/complaints', complaintRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Default: protect passes through
  mockProtect.mockImplementation((_req, _res, next) => next());
  // Default: analyzeImage returns 200
  mockAnalyzeImage.mockImplementation((_req, res) => res.status(200).json({ ok: true }));
});

// ---------------------------------------------------------------------------
// Test 1: Route ordering — analyze-image is NOT treated as /:id
// Validates: Requirement 4.1
// ---------------------------------------------------------------------------

describe('Route ordering: POST /analyze-image is matched before GET /:id', () => {
  it('POST /api/complaints/analyze-image reaches the analyzeImage controller, not getComplaintById', async () => {
    const app = buildApp();

    const res = await request(app).post('/api/complaints/analyze-image');

    // analyzeImage controller should have been called
    expect(mockAnalyzeImage).toHaveBeenCalledTimes(1);

    // getComplaintById must NOT have been called (would mean "analyze-image" was treated as :id)
    expect(mockGetComplaintById).not.toHaveBeenCalled();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /api/complaints/:id still reaches getComplaintById for a real id', async () => {
    const app = buildApp();

    const res = await request(app).get('/api/complaints/abc123');

    expect(mockGetComplaintById).toHaveBeenCalledTimes(1);
    expect(mockAnalyzeImage).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Test 2: protect middleware is applied to POST /analyze-image
// Validates: Requirement 4.2
// ---------------------------------------------------------------------------

describe('Auth middleware: protect is applied to POST /analyze-image', () => {
  it('returns 401 when protect middleware rejects the request (no token)', async () => {
    // Override protect to simulate missing/invalid token
    mockProtect.mockImplementation((_req, res) =>
      res.status(401).json({ error: 'No token' })
    );

    const app = buildApp();

    const res = await request(app).post('/api/complaints/analyze-image');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'No token' });

    // analyzeImage controller must NOT have been called
    expect(mockAnalyzeImage).not.toHaveBeenCalled();
  });

  it('calls protect before analyzeImage on an authenticated request', async () => {
    const callOrder = [];

    mockProtect.mockImplementation((_req, _res, next) => {
      callOrder.push('protect');
      next();
    });

    mockAnalyzeImage.mockImplementation((_req, res) => {
      callOrder.push('analyzeImage');
      res.status(200).json({ ok: true });
    });

    const app = buildApp();

    await request(app).post('/api/complaints/analyze-image');

    expect(callOrder).toEqual(['protect', 'analyzeImage']);
  });
});
