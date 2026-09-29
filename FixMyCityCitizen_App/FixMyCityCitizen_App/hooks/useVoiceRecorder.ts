/**
 * useVoiceRecorder — voice recording + Sarvam AI STT transcription hook.
 * Uses expo-audio (SDK 54+), replacing the deprecated expo-av.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import { api } from '../services/api';

const MAX_RECORDING_SECONDS = 60;
const MIN_RECORDING_DURATION_MS = 1000;

export interface UseVoiceRecorderOptions {
  onTranscript: (transcript: string, detectedLanguage: string | null) => void;
  languageHint?: string | null;
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

export function useVoiceRecorder(options: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const { onTranscript, languageHint = null } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    // Override to 16kHz mono — optimal for Sarvam STT
    sampleRate: 16000,
    numberOfChannels: 1,
    android: {
      ...RecordingPresets.HIGH_QUALITY.android,
      sampleRate: 16000,
    },
    ios: {
      ...RecordingPresets.HIGH_QUALITY.ios,
      sampleRate: 16000,
    },
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track recording start time to calculate duration ourselves
  const startTimeRef = useRef<number>(0);

  function clearTimers() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  }

  // Clean up timers on unmount
  useEffect(() => () => clearTimers(), []);

  const stopAndTranscribe = useCallback(async () => {
    if (!isRecording) return;

    clearTimers();
    setIsRecording(false);

    const durationMs = Date.now() - startTimeRef.current;

    try {
      await recorder.stop();
    } catch { /* best-effort */ }

    setElapsedSeconds(0);

    if (durationMs < MIN_RECORDING_DURATION_MS) {
      Alert.alert('Recording too short, please try again');
      return;
    }

    const uri = recorder.uri;
    if (!uri) {
      Alert.alert('Voice transcription unavailable, please type your description');
      return;
    }

    setIsTranscribing(true);
    try {
      // recorder outputs .m4a — MIME type is audio/mp4, which Sarvam accepts
      const filename = uri.split('/').pop() ?? 'recording.m4a';
      const formData = new FormData();
      formData.append('audio', { uri, name: filename, type: 'audio/mp4' } as unknown as Blob);
      if (languageHint) formData.append('languageHint', languageHint);

      const data = await api.postForm('/voice/transcribe', formData) as {
        transcript: string;
        detectedLanguage: string | null;
        confidence: number;
      };

      if (!data.transcript) {
        Alert.alert('No speech detected, please try again');
        return;
      }
      onTranscript(data.transcript, data.detectedLanguage);
    } catch {
      Alert.alert('Voice transcription unavailable, please type your description');
    } finally {
      setIsTranscribing(false);
    }
  }, [isRecording, recorder, languageHint, onTranscript]);

  const startRecording = useCallback(async () => {
    const { status, granted } = await requestRecordingPermissionsAsync();
    if (granted) {
      setPermissionStatus('granted');
    } else {
      setPermissionStatus('denied');
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
      // Allow recording through the iOS silent switch
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      await recorder.prepareToRecordAsync();
      recorder.record();

      startTimeRef.current = Date.now();
      setIsRecording(true);
      setElapsedSeconds(0);

      intervalRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
      autoStopRef.current = setTimeout(() => stopAndTranscribe(), MAX_RECORDING_SECONDS * 1000);
    } catch {
      setIsRecording(false);
      clearTimers();
      Alert.alert('Could not start recording. Please try again.');
    }
  }, [recorder, stopAndTranscribe]);

  const cancelRecording = useCallback(() => {
    clearTimers();
    setIsRecording(false);
    setElapsedSeconds(0);
    if (isRecording) {
      recorder.stop().catch(() => {});
    }
  }, [isRecording, recorder]);

  return { isRecording, isTranscribing, elapsedSeconds, permissionStatus, startRecording, stopAndTranscribe, cancelRecording };
}
