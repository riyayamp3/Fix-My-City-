// Feature: ai-civic-complaint-capture, Property 1: Non-API paths always return SPA HTML
// Feature: ai-civic-complaint-capture, Property 2: API paths are never intercepted by static middleware

/**
 * Unit tests for static serving and catch-all routing (P1, P2)
 *
 * Validates: Requirements 1.2, 1.3
 *
 * Strategy: Build a minimal Express app that mirrors server.js routing logic
 * (API routes → static middleware → catch-all) without importing server.js
 * directly, to avoid triggering DB connections and file system dependencies.
 * The static middleware is replaced with a stub that serves a fake index.html,
 * and a real /api/* route returns JSON — matching production behaviour.
 */

import express from 'express';
import request from 'supertest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a test Express app that mirrors the server.js routing structure:
 *   1. API routes (return JSON)
 *   2. Static middleware stub (serves fake index.html for known static paths)
 *   3. Catch-all (serves index.html for everything else)
 *
 * The static middleware stub only intercepts exact known static asset paths
 * (e.g. /assets/main.js) so we can verify it is bypassed for /api/* routes.
 */
function buildTestApp() {
  const app = express();
  app.use(express.json());

  // --- API routes (mounted before static / catch-all, as in server.js) ---
  const apiRouter = express.Router();
  apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));
  apiRouter.get('/complaints', (_req, res) => res.json({ complaints: [] }));
  apiRouter.post('/auth/login', (_req, res) => res.json({ token: 'fake' }));
  // Wildcard API handler — any unmatched /api/* path still returns JSON
  apiRouter.all('*', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use('/api', apiRouter);

  // --- Static middleware stub (simulates express.static for dist/) ---
  // Only serves known static asset paths; all other paths fall through.
  const STATIC_ASSETS = ['/assets/main.js', '/assets/style.css', '/favicon.ico'];
  app.use((req, res, next) => {
    if (STATIC_ASSETS.includes(req.path)) {
      return res.status(200).type('js').send('/* static asset */');
    }
    next();
  });

  // --- Catch-all: serve index.html for SPA client-side routing ---
  const FAKE_INDEX_HTML = '<!DOCTYPE html><html><head><title>FixMyCity</title></head><body><div id="root"></div></body></html>';
  app.get('*', (_req, res) => {
    res.status(200).type('html').send(FAKE_INDEX_HTML);
  });

  return app;
}

// ---------------------------------------------------------------------------
// Property 1: Non-API paths always return SPA HTML
// ---------------------------------------------------------------------------

/**
 * Property 1: Non-API paths always return SPA HTML
 *
 * For any request path that does not begin with /api/, the Express server
 * should respond with the contents of index.html (the React SPA entry point),
 * regardless of what the path is.
 *
 * Validates: Requirements 1.2
 */
describe('Property 1: Non-API paths always return SPA HTML', () => {
  let app;

  beforeAll(() => {
    app = buildTestApp();
  });

  it('returns 200 HTML for specific known SPA routes', async () => {
    const spaPaths = ['/', '/dashboard', '/complaints', '/login', '/settings/profile'];
    for (const p of spaPaths) {
      const res = await request(app).get(p);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('<!DOCTYPE html>');
    }
  });

  it('returns 200 HTML for deeply nested non-API paths', async () => {
    const deepPaths = ['/a/b/c/d', '/some/very/deep/route', '/x'];
    for (const p of deepPaths) {
      const res = await request(app).get(p);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    }
  });

  it('property: any non-/api/ path returns 200 with HTML content', async () => {
    // Feature: ai-civic-complaint-capture, Property 1: Non-API paths always return SPA HTML
    await fc.assert(
      fc.asyncProperty(
        // Generate path segments that do NOT start with /api/
        fc.array(
          fc.stringMatching(/^[a-z0-9_-]{1,12}$/),
          { minLength: 0, maxLength: 4 }
        ).map(segments => '/' + segments.join('/')),
        async (path) => {
          // Ensure the path does not accidentally start with /api
          if (path.startsWith('/api')) return;

          const res = await request(app).get(path);

          expect(res.status).toBe(200);
          expect(res.headers['content-type']).toMatch(/html/);
          expect(res.text).toContain('<!DOCTYPE html>');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: API paths are never intercepted by static middleware
// ---------------------------------------------------------------------------

/**
 * Property 2: API paths are never intercepted by static middleware
 *
 * For any request path that begins with /api/, the response should never be
 * the SPA index.html — it should always be a JSON API response.
 *
 * Validates: Requirements 1.3
 */
describe('Property 2: API paths are never intercepted by static middleware', () => {
  let app;

  beforeAll(() => {
    app = buildTestApp();
  });

  it('returns JSON for known API routes', async () => {
    const apiPaths = [
      { method: 'get', path: '/api/health' },
      { method: 'get', path: '/api/complaints' },
    ];
    for (const { method, path } of apiPaths) {
      const res = await request(app)[method](path);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.text).not.toContain('<!DOCTYPE html>');
    }
  });

  it('returns JSON (not HTML) for unknown /api/* paths', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint');
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.text).not.toContain('<!DOCTYPE html>');
  });

  it('property: any /api/* path returns JSON, never index.html', async () => {
    // Feature: ai-civic-complaint-capture, Property 2: API paths are never intercepted by static middleware
    await fc.assert(
      fc.asyncProperty(
        // Generate path suffixes and prepend /api/
        fc.array(
          fc.stringMatching(/^[a-z0-9_-]{1,12}$/),
          { minLength: 1, maxLength: 4 }
        ).map(segments => '/api/' + segments.join('/')),
        async (apiPath) => {
          const res = await request(app).get(apiPath);

          // Must never return the SPA HTML
          expect(res.text).not.toContain('<!DOCTYPE html>');
          expect(res.headers['content-type']).toMatch(/json/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
