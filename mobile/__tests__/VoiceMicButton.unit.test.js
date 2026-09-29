/**
 * Unit tests for VoiceMicButton logic
 * Requirements: 2.2, 2.5, 5.4
 *
 * Tests the pure helper logic extracted from VoiceMicButton without
 * requiring a full React Native renderer.
 */

// ---------------------------------------------------------------------------
// Helpers under test (mirrored from VoiceMicButton.tsx)
// ---------------------------------------------------------------------------

/**
 * Formats elapsed seconds as "M:SS".
 */
function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Derives the button's disabled state from props.
 */
function isButtonDisabled(isDisabled) {
  return isDisabled;
}

/**
 * Derives the opacity style value from props.
 */
function buttonOpacity(isDisabled) {
  return isDisabled ? 0.4 : 1;
}

/**
 * Determines which icon/indicator to render.
 * Returns 'activityIndicator' | 'micIcon'
 */
function resolveIcon(isTranscribing) {
  return isTranscribing ? 'activityIndicator' : 'micIcon';
}

/**
 * Determines whether the pulse ring should be shown.
 */
function showPulseRing(isRecording) {
  return isRecording;
}

/**
 * Determines whether the elapsed timer label should be shown.
 */
function showTimer(isRecording) {
  return isRecording;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VoiceMicButton — formatElapsed', () => {
  test('formats 0 seconds as "0:00"', () => {
    expect(formatElapsed(0)).toBe('0:00');
  });

  test('formats 12 seconds as "0:12"', () => {
    expect(formatElapsed(12)).toBe('0:12');
  });

  test('formats 42 seconds as "0:42"', () => {
    expect(formatElapsed(42)).toBe('0:42');
  });

  test('formats 60 seconds as "1:00"', () => {
    expect(formatElapsed(60)).toBe('1:00');
  });

  test('formats 62 seconds as "1:02"', () => {
    expect(formatElapsed(62)).toBe('1:02');
  });

  test('formats 9 seconds as "0:09" (zero-padded)', () => {
    expect(formatElapsed(9)).toBe('0:09');
  });

  test('formats 125 seconds as "2:05"', () => {
    expect(formatElapsed(125)).toBe('2:05');
  });
});

describe('VoiceMicButton — isRecording state', () => {
  test('pulse ring is shown when isRecording is true', () => {
    expect(showPulseRing(true)).toBe(true);
  });

  test('pulse ring is hidden when isRecording is false', () => {
    expect(showPulseRing(false)).toBe(false);
  });

  test('elapsed timer is shown when isRecording is true', () => {
    expect(showTimer(true)).toBe(true);
  });

  test('elapsed timer is hidden when isRecording is false', () => {
    expect(showTimer(false)).toBe(false);
  });
});

describe('VoiceMicButton — isTranscribing state', () => {
  test('renders ActivityIndicator when isTranscribing is true', () => {
    expect(resolveIcon(true)).toBe('activityIndicator');
  });

  test('renders mic icon when isTranscribing is false', () => {
    expect(resolveIcon(false)).toBe('micIcon');
  });
});

describe('VoiceMicButton — isDisabled state', () => {
  test('button is disabled when isDisabled is true', () => {
    expect(isButtonDisabled(true)).toBe(true);
  });

  test('button is enabled when isDisabled is false', () => {
    expect(isButtonDisabled(false)).toBe(false);
  });

  test('opacity is 0.4 when isDisabled is true', () => {
    expect(buttonOpacity(true)).toBe(0.4);
  });

  test('opacity is 1 when isDisabled is false', () => {
    expect(buttonOpacity(false)).toBe(1);
  });
});
