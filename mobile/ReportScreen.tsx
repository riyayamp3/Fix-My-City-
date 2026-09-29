import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import VoiceMicButton from './components/VoiceMicButton';
// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

// Placeholder: replace with your auth context / AsyncStorage lookup
let _authToken: string | null = null;
export function setAuthToken(token: string | null) {
  _authToken = token;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface AIAnalysis {
  isCivicIssue: boolean;
  category: string | null;
  severity: string | null;
  description: string | null;
  imageUrl: string;
}

interface ComplaintFormState {
  imageUri: string | null;
  imageUrl: string | null;
  category: string;
  severity: string;
  description: string;
  location: LocationData | null;
  isAnalyzing: boolean;
  isSubmitting: boolean;
  isFallback: boolean;
  notCivicIssue: boolean;
  descriptionError: string;
  languageHint: string | null;
  detectedLanguage: string | null;
  isTranscribing: boolean;
  voiceUsed: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { label: 'Pothole', value: 'pothole' },
  { label: 'Garbage', value: 'garbage' },
  { label: 'Water Leak', value: 'water_leak' },
  { label: 'Streetlight', value: 'streetlight' },
  { label: 'Road Damage', value: 'road_damage' },
  { label: 'Other', value: 'other' },
];

const SEVERITIES = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const ANALYSIS_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Language names map
// ---------------------------------------------------------------------------
const LANGUAGE_NAMES: Record<string, string> = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'kn-IN': 'Kannada',
  'bn-IN': 'Bengali',
  'gu-IN': 'Gujarati',
};

// ---------------------------------------------------------------------------
// Language options
// ---------------------------------------------------------------------------
const SUPPORTED_LANGUAGES = [
  { label: 'Auto-detect', value: null },
  { label: 'English',  value: 'en-IN' },
  { label: 'Hindi',    value: 'hi-IN' },
  { label: 'Marathi',  value: 'mr-IN' },
  { label: 'Tamil',    value: 'ta-IN' },
  { label: 'Telugu',   value: 'te-IN' },
  { label: 'Kannada',  value: 'kn-IN' },
  { label: 'Bengali',  value: 'bn-IN' },
  { label: 'Gujarati', value: 'gu-IN' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getToken(): Promise<string | null> {
  // Placeholder: swap for AsyncStorage.getItem('authToken') or auth context
  return _authToken;
}

function showFallbackToast(message: string): void {
  Alert.alert('Notice', message);
}

// ---------------------------------------------------------------------------
// ImagePickerButton
// ---------------------------------------------------------------------------
interface ImagePickerButtonProps {
  onImageSelected: (uri: string) => void;
  disabled: boolean;
}

function ImagePickerButton({ onImageSelected, disabled }: ImagePickerButtonProps) {
  async function requestAndLaunch(source: 'camera' | 'library') {
    let permissionResult: ImagePicker.PermissionResponse;

    if (source === 'camera') {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        `${source === 'camera' ? 'Camera' : 'Photo library'} access is required to report a civic issue.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });

    if (!result.canceled && result.assets.length > 0) {
      onImageSelected(result.assets[0].uri);
    }
  }

  function handlePress() {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Take Photo', onPress: () => requestAndLaunch('camera') },
      { text: 'Choose from Library', onPress: () => requestAndLaunch('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <TouchableOpacity
      style={[styles.pickerButton, disabled && styles.disabledButton]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel="Add photo"
      accessibilityRole="button"
    >
      <Text style={styles.pickerButtonText}>📷 Add Photo</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// ImagePreview
// ---------------------------------------------------------------------------
interface ImagePreviewProps {
  uri: string;
}

function ImagePreview({ uri }: ImagePreviewProps) {
  return (
    <View style={styles.previewContainer}>
      <Image
        source={{ uri }}
        style={styles.previewImage}
        accessibilityLabel="Selected image preview"
        resizeMode="cover"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// PickerRow — simple inline picker using Alert (no native Picker dependency)
// ---------------------------------------------------------------------------
interface PickerRowProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function PickerRow({ label, value, options, onChange, disabled }: PickerRowProps) {
  const displayLabel = options.find((o) => o.value === value)?.label ?? 'Select…';

  function handlePress() {
    Alert.alert(
      label,
      undefined,
      [
        ...options.map((opt) => ({
          text: opt.label,
          onPress: () => onChange(opt.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }

  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerRow, disabled && styles.disabledButton]}
        onPress={handlePress}
        disabled={disabled}
        accessibilityLabel={`${label}: ${displayLabel}`}
        accessibilityRole="button"
      >
        <Text style={styles.pickerRowText}>{displayLabel}</Text>
        <Text style={styles.pickerChevron}>▾</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// LanguagePickerRow — like PickerRow but supports null values (for Auto-detect)
// ---------------------------------------------------------------------------
interface LanguagePickerRowProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

function LanguagePickerRow({ value, onChange, disabled }: LanguagePickerRowProps) {
  const displayLabel =
    SUPPORTED_LANGUAGES.find((o) => o.value === value)?.label ?? 'Auto-detect';

  function handlePress() {
    Alert.alert(
      'Voice Language',
      undefined,
      [
        ...SUPPORTED_LANGUAGES.map((opt) => ({
          text: opt.label,
          onPress: () => onChange(opt.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }

  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>Voice Language</Text>
      <TouchableOpacity
        style={[styles.pickerRow, disabled && styles.disabledButton]}
        onPress={handlePress}
        disabled={disabled}
        accessibilityLabel={`Voice Language: ${displayLabel}`}
        accessibilityRole="button"
      >
        <Text style={styles.pickerRowText}>{displayLabel}</Text>
        <Text style={styles.pickerChevron}>▾</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ComplaintForm
// ---------------------------------------------------------------------------
interface ComplaintFormProps {
  state: ComplaintFormState;
  onCategoryChange: (v: string) => void;
  onSeverityChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onLanguageChange: (v: string | null) => void;
  onSubmit: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  elapsedSeconds: number;
  onMicPress: () => void;
}

function ComplaintForm({
  state,
  onCategoryChange,
  onSeverityChange,
  onDescriptionChange,
  onLocationChange,
  onLanguageChange,
  onSubmit,
  isRecording,
  isTranscribing,
  elapsedSeconds,
  onMicPress,
}: ComplaintFormProps) {
  const isLoading = state.isAnalyzing || state.isSubmitting;

  return (
    <View style={styles.formContainer}>
      {state.notCivicIssue && (
        <View style={styles.notCivicBanner}>
          <Text style={styles.notCivicText}>
            This doesn't look like a civic issue. Please try another photo.
          </Text>
        </View>
      )}

      {state.isFallback && (
        <View style={styles.fallbackBanner}>
          <Text style={styles.fallbackText}>
            AI analysis unavailable — please fill in the form manually.
          </Text>
        </View>
      )}

      <PickerRow
        label="Category"
        value={state.category}
        options={CATEGORIES}
        onChange={onCategoryChange}
        disabled={isLoading}
      />

      <PickerRow
        label="Severity"
        value={state.severity}
        options={SEVERITIES}
        onChange={onSeverityChange}
        disabled={isLoading}
      />

      <LanguagePickerRow
        value={state.languageHint}
        onChange={onLanguageChange}
        disabled={isLoading}
      />

      <View style={styles.fieldRow}>
        <View style={styles.descriptionLabelRow}>
          <Text style={styles.fieldLabel}>Description</Text>
          <VoiceMicButton
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            isDisabled={isTranscribing}
            elapsedSeconds={elapsedSeconds}
            onPress={onMicPress}
          />
        </View>
        <TextInput
          style={[styles.textInput, state.descriptionError ? styles.inputError : null]}
          value={state.description}
          onChangeText={onDescriptionChange}
          placeholder="Describe the issue…"
          multiline
          numberOfLines={4}
          editable={!isLoading && !isTranscribing}
          accessibilityLabel="Description"
        />
        {state.descriptionError ? (
          <Text style={styles.errorText}>{state.descriptionError}</Text>
        ) : null}
        {state.detectedLanguage ? (
          <Text style={styles.detectedLanguageText}>
            Detected: {LANGUAGE_NAMES[state.detectedLanguage] ?? state.detectedLanguage}
          </Text>
        ) : null}
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput
          style={styles.textInput}
          value={
            state.location
              ? state.location.address ||
                `${state.location.lat.toFixed(5)}, ${state.location.lng.toFixed(5)}`
              : ''
          }
          onChangeText={onLocationChange}
          placeholder="Fetching location…"
          editable={!isLoading}
          accessibilityLabel="Location"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.disabledButton]}
        onPress={onSubmit}
        disabled={isLoading}
        accessibilityLabel="Submit complaint"
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Complaint</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ReportScreen (main export)
// ---------------------------------------------------------------------------
export default function ReportScreen() {
  const [formState, setFormState] = useState<ComplaintFormState>({
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
    languageHint: null,
    detectedLanguage: null,
    isTranscribing: false,
    voiceUsed: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Voice recorder hook
  const {
    isRecording,
    isTranscribing,
    elapsedSeconds,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
  } = useVoiceRecorder({
    onTranscript: (transcript, detectedLanguage) => {
      setFormState(prev => ({
        ...prev,
        description: transcript,
        detectedLanguage,
        voiceUsed: true,
      }));
    },
    languageHint: formState.languageHint,
    getToken,
  });

  // Sync isTranscribing from hook into formState
  useEffect(() => {
    setFormState(prev => ({ ...prev, isTranscribing }));
  }, [isTranscribing]);

  // Auto-populate location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = pos.coords;

        let address = '';
        try {
          const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo) {
            address = [geo.street, geo.city, geo.region].filter(Boolean).join(', ');
          }
        } catch {
          // reverse geocode is best-effort
        }

        setFormState((prev) => ({
          ...prev,
          location: { lat: latitude, lng: longitude, address },
        }));
      } catch {
        // location fetch is best-effort
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // analyzeImage
  // -------------------------------------------------------------------------
  async function analyzeImage(uri: string) {
    const token = await getToken();

    setFormState((prev) => ({
      ...prev,
      isAnalyzing: true,
      isFallback: false,
      notCivicIssue: false,
      category: '',
      severity: '',
      description: '',
      descriptionError: '',
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      const filename = uri.split('/').pop() ?? 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('image', { uri, name: filename, type: mimeType } as unknown as Blob);

      const response = await fetch(`${API_BASE_URL}/api/complaints/analyze-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: AIAnalysis = await response.json();

      if (data.isCivicIssue) {
        setFormState((prev) => ({
          ...prev,
          imageUrl: data.imageUrl,
          category: data.category ?? '',
          severity: data.severity ?? '',
          description: data.description ?? '',
          isAnalyzing: false,
          notCivicIssue: false,
          isFallback: false,
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          imageUrl: data.imageUrl,
          category: '',
          severity: '',
          description: '',
          isAnalyzing: false,
          notCivicIssue: true,
          isFallback: false,
        }));
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort =
        err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));

      showFallbackToast('AI analysis unavailable, please fill in manually');

      setFormState((prev) => ({
        ...prev,
        // retain imageUri; clear imageUrl since upload may not have completed
        imageUrl: null,
        category: '',
        severity: '',
        description: '',
        isAnalyzing: false,
        isFallback: true,
        notCivicIssue: false,
      }));

      if (!isAbort) {
        // non-abort errors are already surfaced via the toast above
      }
    }
  }

  // -------------------------------------------------------------------------
  // handleImageSelected
  // -------------------------------------------------------------------------
  function handleImageSelected(uri: string) {
    setFormState((prev) => ({ ...prev, imageUri: uri }));
    analyzeImage(uri);
  }

  // -------------------------------------------------------------------------
  // submitComplaint
  // -------------------------------------------------------------------------
  async function submitComplaint() {
    if (!formState.description.trim()) {
      setFormState((prev) => ({
        ...prev,
        descriptionError: 'Description is required.',
      }));
      return;
    }

    const token = await getToken();

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      descriptionError: '',
    }));

    try {
      const payload = {
        description: formState.description,
        imageUrl: formState.imageUrl ?? '',
        category: formState.category,
        severity: formState.severity,
        location: formState.location,
      };

      const response = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
      }

      Alert.alert('Success', 'Your complaint has been submitted.');

      // Reset form
      setFormState({
        imageUri: null,
        imageUrl: null,
        category: '',
        severity: '',
        description: '',
        location: formState.location,
        isAnalyzing: false,
        isSubmitting: false,
        isFallback: false,
        notCivicIssue: false,
        descriptionError: '',
        languageHint: null,
        detectedLanguage: null,
        isTranscribing: false,
        voiceUsed: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      Alert.alert('Error', message);
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }

  // -------------------------------------------------------------------------
  // Location text change handler
  // -------------------------------------------------------------------------
  function handleLocationChange(text: string) {
    setFormState((prev) => ({
      ...prev,
      location: prev.location
        ? { ...prev.location, address: text }
        : { lat: 0, lng: 0, address: text },
    }));
  }

  const isLoading = formState.isAnalyzing || formState.isSubmitting;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Report a Civic Issue</Text>

      <ImagePickerButton onImageSelected={handleImageSelected} disabled={isLoading} />

      {formState.imageUri ? <ImagePreview uri={formState.imageUri} /> : null}

      {formState.isAnalyzing && (
        <View style={styles.analyzingRow}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.analyzingText}>Analyzing image…</Text>
        </View>
      )}

      <ComplaintForm
        state={formState}
        onCategoryChange={(v) =>
          setFormState((prev) => ({ ...prev, category: v }))
        }
        onSeverityChange={(v) =>
          setFormState((prev) => ({ ...prev, severity: v }))
        }
        onDescriptionChange={(v) =>
          setFormState((prev) => ({ ...prev, description: v, descriptionError: '' }))
        }
        onLocationChange={handleLocationChange}
        onLanguageChange={(v) =>
          setFormState((prev) => ({ ...prev, languageHint: v }))
        }
        onSubmit={submitComplaint}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        elapsedSeconds={elapsedSeconds}
        onMicPress={() => {
          if (isRecording) {
            stopAndTranscribe();
          } else {
            startRecording();
          }
        }}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  pickerButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  previewContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  analyzingText: {
    color: '#2563eb',
    fontSize: 14,
  },
  formContainer: {
    gap: 12,
  },
  notCivicBanner: {
    backgroundColor: '#fef9c3',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  notCivicText: {
    color: '#713f12',
    fontSize: 14,
  },
  fallbackBanner: {
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  fallbackText: {
    color: '#9a3412',
    fontSize: 14,
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  descriptionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detectedLanguageText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerRowText: {
    fontSize: 15,
    color: '#111827',
  },
  pickerChevron: {
    fontSize: 14,
    color: '#6b7280',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
