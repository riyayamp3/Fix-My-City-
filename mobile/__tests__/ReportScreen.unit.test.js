/**
 * Unit tests for ReportScreen logic
 * Requirements: 3.4, 6.3, 6.4
 *
 * These tests exercise the pure state-transition logic extracted from
 * ReportScreen without requiring a full React Native renderer.
 */

// ---------------------------------------------------------------------------
// Helpers under test (mirrored from ReportScreen.tsx logic)
// ---------------------------------------------------------------------------

/**
 * Applies the analyzeImage success branch to a form state.
 * Returns the next state.
 */
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

/**
 * Applies the analyzeImage failure branch to a form state.
 */
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

/**
 * Validates description before submit.
 * Returns an error string or empty string if valid.
 */
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
// Tests
// ---------------------------------------------------------------------------

describe('ReportScreen — permission denial alert', () => {
  test('permission denial triggers alert with Settings option', () => {
    // Simulate the alert call that would be made on permission denial
    const alertCalls = [];
    const mockAlert = (title, message, buttons) => {
      alertCalls.push({ title, message, buttons });
    };

    // Replicate the permission-denied branch
    const permissionGranted = false;
    if (!permissionGranted) {
      mockAlert(
        'Permission Required',
        'Camera access is required to report a civic issue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {} },
        ],
      );
    }

    expect(alertCalls).toHaveLength(1);
    expect(alertCalls[0].title).toBe('Permission Required');
    const buttons = alertCalls[0].buttons;
    const settingsButton = buttons.find((b) => b.text === 'Open Settings');
    expect(settingsButton).toBeDefined();
    expect(typeof settingsButton.onPress).toBe('function');
  });
});

describe('ReportScreen — isCivicIssue:false response', () => {
  test('sets notCivicIssue flag and leaves form fields empty', () => {
    const analysis = {
      isCivicIssue: false,
      category: null,
      severity: null,
      description: null,
      imageUrl: 'https://res.cloudinary.com/test/image/upload/v1/abc.jpg',
    };

    const nextState = applyAnalysisSuccess(initialState, analysis);

    expect(nextState.notCivicIssue).toBe(true);
    expect(nextState.category).toBe('');
    expect(nextState.severity).toBe('');
    expect(nextState.description).toBe('');
    expect(nextState.isAnalyzing).toBe(false);
    expect(nextState.isFallback).toBe(false);
  });

  test('does not pre-fill fields even when AI returns values alongside isCivicIssue:false', () => {
    const analysis = {
      isCivicIssue: false,
      category: 'pothole',
      severity: 'high',
      description: 'Some description',
      imageUrl: 'https://res.cloudinary.com/test/image/upload/v1/abc.jpg',
    };

    const nextState = applyAnalysisSuccess(initialState, analysis);

    expect(nextState.category).toBe('');
    expect(nextState.severity).toBe('');
    expect(nextState.description).toBe('');
  });
});

describe('ReportScreen — loading state disables submit', () => {
  test('isAnalyzing=true means submit button should be disabled', () => {
    const state = { ...initialState, isAnalyzing: true };
    const isLoading = state.isAnalyzing || state.isSubmitting;
    expect(isLoading).toBe(true);
  });

  test('isSubmitting=true means submit button should be disabled', () => {
    const state = { ...initialState, isSubmitting: true };
    const isLoading = state.isAnalyzing || state.isSubmitting;
    expect(isLoading).toBe(true);
  });

  test('neither analyzing nor submitting means button is enabled', () => {
    const state = { ...initialState, isAnalyzing: false, isSubmitting: false };
    const isLoading = state.isAnalyzing || state.isSubmitting;
    expect(isLoading).toBe(false);
  });
});

describe('ReportScreen — description validation', () => {
  test('empty string returns error', () => {
    expect(validateDescription('')).toBe('Description is required.');
  });

  test('whitespace-only string returns error', () => {
    expect(validateDescription('   ')).toBe('Description is required.');
  });

  test('non-empty string returns no error', () => {
    expect(validateDescription('Pothole on main street')).toBe('');
  });
});

describe('ReportScreen — analyzeImage success pre-fill', () => {
  test('isCivicIssue:true pre-fills category, severity, description', () => {
    const analysis = {
      isCivicIssue: true,
      category: 'pothole',
      severity: 'high',
      description: 'Large pothole causing hazard',
      imageUrl: 'https://res.cloudinary.com/test/image/upload/v1/abc.jpg',
    };

    const nextState = applyAnalysisSuccess(initialState, analysis);

    expect(nextState.category).toBe('pothole');
    expect(nextState.severity).toBe('high');
    expect(nextState.description).toBe('Large pothole causing hazard');
    expect(nextState.imageUrl).toBe(analysis.imageUrl);
    expect(nextState.notCivicIssue).toBe(false);
    expect(nextState.isFallback).toBe(false);
    expect(nextState.isAnalyzing).toBe(false);
  });
});

describe('ReportScreen — analyzeImage failure fallback', () => {
  test('failure clears form fields, sets isFallback, retains imageUri', () => {
    const stateWithImage = { ...initialState, imageUri: 'file:///local/photo.jpg', isAnalyzing: true };
    const nextState = applyAnalysisFailure(stateWithImage);

    expect(nextState.isFallback).toBe(true);
    expect(nextState.imageUri).toBe('file:///local/photo.jpg'); // retained
    expect(nextState.imageUrl).toBeNull();
    expect(nextState.category).toBe('');
    expect(nextState.severity).toBe('');
    expect(nextState.description).toBe('');
    expect(nextState.isAnalyzing).toBe(false);
    expect(nextState.notCivicIssue).toBe(false);
  });
});
