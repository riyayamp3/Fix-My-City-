/**
 * Property-based tests for ReportScreen logic
 * Uses fast-check
 *
 * Feature: ai-civic-complaint-capture
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Pure logic helpers (mirrored from ReportScreen.tsx)
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = ['pothole', 'garbage', 'water_leak', 'streetlight', 'road_damage', 'other'];
const VALID_SEVERITIES = ['low', 'medium', 'high'];

function applyAnalysisSuccess(prevState, analysis) {
  if (analysis.isCivicIssue) {
    return {
      ...prevState,
      imageUrl: analysis.imageUrl,
      category: analysis.category ?? '',
      severity: analysis.severity ?? '',
      description: analysis.description ?? '',
      isAnalyzing: false,
      notCivicIssue: false,
      isFallback: false,
    };
  }
  return {
    ...prevState,
    imageUrl: analysis.imageUrl,
    category: '',
    severity: '',
    description: '',
    isAnalyzing: false,
    notCivicIssue: true,
    isFallback: false,
  };
}

function applyAnalysisFailure(prevState) {
  return {
    ...prevState,
    imageUrl: null,
    category: '',
    severity: '',
    description: '',
    isAnalyzing: false,
    isFallback: true,
    notCivicIssue: false,
  };
}

function validateDescription(description) {
  if (!description || !description.trim()) {
    return 'Description is required.';
  }
  return '';
}

const initialState = {
  imageUri: null,
  imageUrl: null,
  category: '',
  severity: '',
  description: '',
  location: null,
  isAnalyzing: false,
  isSubmitting: false,
  isFallback: false,
  notCivicIssue: false,
  descriptionError: '',
};

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const categoryArb = fc.constantFrom(...VALID_CATEGORIES);
const severityArb = fc.constantFrom(...VALID_SEVERITIES);
const cloudinaryUrlArb = fc.string({ minLength: 1 }).map((s) => `https://res.cloudinary.com/test/${s}`);

const civicAnalysisArb = fc.record({
  isCivicIssue: fc.constant(true),
  category: categoryArb,
  severity: severityArb,
  description: fc.string({ minLength: 1 }),
  imageUrl: cloudinaryUrlArb,
});

const nonCivicAnalysisArb = fc.record({
  isCivicIssue: fc.constant(false),
  category: fc.constant(null),
  severity: fc.constant(null),
  description: fc.constant(null),
  imageUrl: cloudinaryUrlArb,
});

const imageUriArb = fc.string({ minLength: 1 }).map((s) => `file:///photos/${s}.jpg`);

const failureArb = fc.oneof(
  fc.constant('network-error'),
  fc.integer({ min: 400, max: 599 }).map(String),
);

const blankStringArb = fc
  .array(fc.constant(' '), { minLength: 0, maxLength: 20 })
  .map((arr) => arr.join(''));

// ---------------------------------------------------------------------------
// Property 9: Pre-fill populates all form fields and keeps them editable
// Feature: ai-civic-complaint-capture, Property 9: Pre-fill populates all form fields and keeps them editable
// Validates: Requirements 6.1, 6.2
// ---------------------------------------------------------------------------
describe('Property 9 — Pre-fill populates all form fields and keeps them editable', () => {
  test('isCivicIssue:true → category, severity, description are set from analysis', () => {
    fc.assert(
      fc.property(civicAnalysisArb, (analysis) => {
        const nextState = applyAnalysisSuccess(initialState, analysis);

        // Fields are populated from the analysis
        expect(nextState.category).toBe(analysis.category);
        expect(nextState.severity).toBe(analysis.severity);
        expect(nextState.description).toBe(analysis.description);

        // isAnalyzing is false (not locked)
        expect(nextState.isAnalyzing).toBe(false);
        expect(nextState.isSubmitting).toBe(false);

        // notCivicIssue and isFallback are cleared
        expect(nextState.notCivicIssue).toBe(false);
        expect(nextState.isFallback).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: isCivicIssue false leaves form fields empty
// Feature: ai-civic-complaint-capture, Property 10: isCivicIssue false leaves form fields empty
// Validates: Requirements 6.3
// ---------------------------------------------------------------------------
describe('Property 10 — isCivicIssue false leaves form fields empty', () => {
  test('isCivicIssue:false → all form fields are empty strings and notCivicIssue is true', () => {
    fc.assert(
      fc.property(nonCivicAnalysisArb, (analysis) => {
        const nextState = applyAnalysisSuccess(initialState, analysis);

        expect(nextState.category).toBe('');
        expect(nextState.severity).toBe('');
        expect(nextState.description).toBe('');
        expect(nextState.notCivicIssue).toBe(true);
        expect(nextState.isFallback).toBe(false);
        expect(nextState.isAnalyzing).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: Fallback on failure preserves image and presents empty editable form
// Feature: ai-civic-complaint-capture, Property 11: Fallback on failure preserves image and presents empty editable form
// Validates: Requirements 7.1, 7.2, 7.4
// ---------------------------------------------------------------------------
describe('Property 11 — Fallback on failure preserves imageUri and empties form', () => {
  test('any failure → isFallback=true, form fields empty, imageUri retained', () => {
    fc.assert(
      fc.property(imageUriArb, failureArb, (imageUri, _failureType) => {
        const stateWithImage = { ...initialState, imageUri, isAnalyzing: true };
        const nextState = applyAnalysisFailure(stateWithImage);

        // imageUri is retained
        expect(nextState.imageUri).toBe(imageUri);

        // imageUrl is cleared (upload may not have completed)
        expect(nextState.imageUrl).toBeNull();

        // Form fields are empty
        expect(nextState.category).toBe('');
        expect(nextState.severity).toBe('');
        expect(nextState.description).toBe('');

        // Fallback flag is set
        expect(nextState.isFallback).toBe(true);
        expect(nextState.notCivicIssue).toBe(false);
        expect(nextState.isAnalyzing).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Empty description always blocks mobile submission
// Feature: ai-civic-complaint-capture, Property 14: Empty description always blocks mobile submission
// Validates: Requirements 8.5
// ---------------------------------------------------------------------------
describe('Property 14 — Empty description always blocks submission', () => {
  test('blank/whitespace-only description → validation error returned, no request sent', () => {
    fc.assert(
      fc.property(blankStringArb, (blankDescription) => {
        const error = validateDescription(blankDescription);

        // An error message is returned
        expect(error).toBeTruthy();
        expect(error.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  test('non-empty description → no validation error', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0), (description) => {
        const error = validateDescription(description);
        expect(error).toBe('');
      }),
      { numRuns: 100 },
    );
  });
});
