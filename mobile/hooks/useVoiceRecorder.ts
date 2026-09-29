/**
 * useVoiceRecorder — custom hook for voice recording and STT transcription.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7,
 *               5.4, 5.5, 6.1, 6.2, 6.3
 *
 * NOTE: expo-av must be installed before using this hook:
 *   npx expo install expo-av
 */

import { useState, useRef, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { Audio } from 'expo-av';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

const MAX_RECORDING_SECONDS = 60;
const MIN_RECORDING_DURATION_MS = 1000;
const TRANSCRIPTION_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface UseVoiceRecorderOptions {
  onTranscript: (transcript: string, detectedLanguage: string | null) => void;
  languageHint?: string | null;
  getToken?: () => Promise<string | null>;
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  elapsedSeconds: number;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => Promise<void>;
  cancelRecording: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useVoiceRecorder(
  options: UseVoiceRecorderOptions,
): UseVoiceRecorderReturn {
  const { onTranscript, languageHint = null, getToken = async () => null } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<
    'undetermined' | 'granted' | 'denied'
  >('undetermined');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function clearTimers() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoStopTimerRef.current !== null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }

  // -------------------------------------------------------------------------
  // startRecording
  // -------------------------------------------------------------------------
  const startRecording = useCallback(async () => {
    // Request permission on first invocation (Requirement 1.1)
    const { status } = await Audio.requestPermissionsAsync();

    if (status === 'granted') {
      setPermissionStatus('granted');
    } else {
      setPermissionStatus('denied');
      // Requirement 1.3 — alert with "Open Settings" button
      Alert.alert(
        'Microphone Permission Required',
        'Microphone access is required for voice input.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    try {
      // Requirement 2.6 — AAC, 16 kHz, mono
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
      });
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setElapsedSeconds(0);

      // Requirement 2.5 — 1-second interval for elapsed time
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Requirement 2.4 — auto-stop at 60 seconds
      autoStopTimerRef.current = setTimeout(() => {
        stopAndTranscribe();
      }, MAX_RECORDING_SECONDS * 1000);
    } catch (err) {
      setIsRecording(false);
      clearTimers();
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageHint, getToken, onTranscript]);

  // -------------------------------------------------------------------------
  // stopAndTranscribe
  // -------------------------------------------------------------------------
  const stopAndTranscribe = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    clearTimers();
    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // best-effort stop
    }

    // Requirement 2.7 — check duration before uploading
    let durationMs = 0;
    try {
      const status = await recording.getStatusAsync();
      durationMs = status.durationMillis ?? 0;
    } catch {
      // if we can't get status, treat as 0
    }

    if (durationMs < MIN_RECORDING_DURATION_MS) {
      recordingRef.current = null;
      setElapsedSeconds(0);
      Alert.alert('Recording too short, please try again');
      return;
    }

    const uri = recording.getURI();
    recordingRef.current = null;
    setElapsedSeconds(0);

    if (!uri) {
      Alert.alert('Voice transcription unavailable, please type your description');
      return;
    }

    // Requirement 5.4 — set isTranscribing before fetch
    setIsTranscribing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      TRANSCRIPTION_TIMEOUT_MS,
    );

    try {
      const token = await getToken();

      const formData = new FormData();
      const filename = uri.split('/').pop() ?? 'recording.aac';
      formData.append('audio', {
        uri,
        name: filename,
        type: 'audio/aac',
      } as unknown as Blob);

      if (languageHint) {
        formData.append('languageHint', languageHint);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/voice/transcribe`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token ?? ''}`,
          },
          body: formData,
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Requirement 6.1 — non-200 → fallback toast
        Alert.alert(
          'Voice transcription unavailable, please type your description',
        );
        return;
      }

      const data = await response.json() as {
        transcript: string;
        detectedLanguage: string | null;
        confidence: number;
      };

      if (!data.transcript) {
        // Requirement 5.3 — empty transcript
        Alert.alert('No speech detected, please try again');
        return;
      }

      // Requirement 5.1 — call onTranscript with result
      onTranscript(data.transcript, data.detectedLanguage);
    } catch (err) {
      clearTimeout(timeoutId);
      // Requirement 6.1, 6.3 — network error or AbortController timeout
      Alert.alert(
        'Voice transcription unavailable, please type your description',
      );
    } finally {
      // Requirement 5.5 — always reset isTranscribing
      setIsTranscribing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageHint, getToken, onTranscript]);

  // -------------------------------------------------------------------------
  // cancelRecording
  // -------------------------------------------------------------------------
  const cancelRecording = useCallback(() => {
    const recording = recordingRef.current;
    clearTimers();
    setIsRecording(false);
    setElapsedSeconds(0);
    recordingRef.current = null;

    if (recording) {
      recording.stopAndUnloadAsync().catch(() => {
        // best-effort cleanup
      });
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    elapsedSeconds,
    permissionStatus,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
  };
}
