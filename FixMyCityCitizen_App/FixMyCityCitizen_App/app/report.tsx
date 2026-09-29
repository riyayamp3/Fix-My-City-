import {
  View, Text, Pressable, TextInput, ScrollView,
  StyleSheet, Alert, Image, ActivityIndicator, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { api } from '../services/api';
import authService from '../services/authService';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import VoiceMicButton from '../components/VoiceMicButton';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Pothole',     value: 'pothole' },
  { label: 'Garbage',     value: 'garbage' },
  { label: 'Water Leak',  value: 'water_leak' },
  { label: 'Streetlight', value: 'streetlight' },
  { label: 'Road Damage', value: 'road_damage' },
  { label: 'Power Cut',   value: 'power_cut' },
  { label: 'Other',       value: 'other' },
];

const SEVERITIES = [
  { label: 'Low',    value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High',   value: 'high' },
];

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

const LANGUAGE_NAMES: Record<string, string> = {
  'en-IN': 'English', 'hi-IN': 'Hindi', 'mr-IN': 'Marathi',
  'ta-IN': 'Tamil',   'te-IN': 'Telugu', 'kn-IN': 'Kannada',
  'bn-IN': 'Bengali', 'gu-IN': 'Gujarati',
};

const API_BASE = 'http://10.144.86.205:5000';
const ANALYSIS_TIMEOUT_MS = 60_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationData { lat: number; lng: number; address: string; }

interface FormState {
  // verification
  imageUri: string | null;
  imageUrl: string | null;
  capturedAt: string | null;       // ISO timestamp of live capture
  captureLocation: { lat: number; lng: number } | null; // GPS at shutter press
  locationVerified: boolean;
  // form fields
  category: string;
  severity: string;
  description: string;
  location: LocationData | null;
  languageHint: string | null;
  detectedLanguage: string | null;
  // ui state
  isLocating: boolean;
  isAnalyzing: boolean;
  isSubmitting: boolean;
  isFallback: boolean;
  notCivicIssue: boolean;
  descriptionError: string;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReportScreen() {
  const [form, setForm] = useState<FormState>({
    imageUri: null, imageUrl: null, capturedAt: null, captureLocation: null, locationVerified: false,
    category: '', severity: '', description: '',
    location: null, languageHint: null, detectedLanguage: null,
    isLocating: true, isAnalyzing: false, isSubmitting: false,
    isFallback: false, notCivicIssue: false, descriptionError: '',
  });

  const abortRef = useRef<AbortController | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { isRecording, isTranscribing, elapsedSeconds, startRecording, stopAndTranscribe } =
    useVoiceRecorder({
      onTranscript: (transcript, detectedLanguage) =>
        setForm(p => ({ ...p, description: transcript, detectedLanguage })),
      languageHint: form.languageHint,
    });

  // ── Fetch location on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchLocation();
  }, []);

  async function fetchLocation() {
    setForm(p => ({ ...p, isLocating: true }));
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setForm(p => ({ ...p, isLocating: false, locationVerified: false }));
      Alert.alert(
        'Location Required',
        'Location access is required to verify your complaint is real.',
        [
          { text: 'Retry', onPress: fetchLocation },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const { latitude, longitude } = pos.coords;
      let address = '';
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo) {
          const parts = [
            geo.name,
            geo.street,
            geo.district,
            geo.subregion,
            geo.city,
            geo.region,
          ].filter(Boolean);
          address = parts.slice(0, 4).join(', ');
        }
      } catch { /* best-effort */ }
      if (!address) address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setForm(p => ({
        ...p,
        location: { lat: latitude, lng: longitude, address },
        locationVerified: true,
        isLocating: false,
      }));
    } catch {
      setForm(p => ({ ...p, isLocating: false, locationVerified: false }));
      Alert.alert('Location Error', 'Could not get your location.', [
        { text: 'Retry', onPress: fetchLocation },
      ]);
    }
  }

  // ── Live camera capture only ────────────────────────────────────────────────
  async function capturePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera Required',
        'Camera access is required to capture a live photo of the issue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.3,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      let captureLocation: { lat: number; lng: number } | null = null;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        captureLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch { /* best-effort */ }

      // capturedAt is set fresh here — will be within seconds of submission
      setForm(p => ({ ...p, imageUri: uri, imageUrl: null, capturedAt: null, captureLocation }));

      // Upload to Cloudinary immediately — AI analysis is manual (tap button)
      uploadImage(uri);
    }
  }

  // ── Upload image to Cloudinary (runs immediately on capture) ─────────────────
  async function uploadImage(uri: string) {
    setIsUploading(true);
    try {
      const token = await authService.getToken();
      const filename = uri.split('/').pop() ?? 'image.jpg';
      const ext = /\.(\w+)$/.exec(filename);
      const mimeType = ext ? `image/${ext[1]}` : 'image/jpeg';
      const fd = new FormData();
      fd.append('image', { uri, name: filename, type: mimeType } as unknown as Blob);
      const upRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: fd,
      });
      if (upRes.ok) {
        const { imageUrl } = await upRes.json();
        setForm(p => ({ ...p, imageUrl: imageUrl ?? p.imageUrl }));
      }
    } catch { /* best-effort */ }
    setIsUploading(false);
  }

  // ── AI analysis + Cloudinary upload (manual — triggered by button) ──────────
  async function analyzeImage(uri: string) {
    const token = await authService.getToken();
    setForm(p => ({
      ...p, isAnalyzing: true, isFallback: false,
      notCivicIssue: false, category: '', severity: '', description: '', descriptionError: '',
    }));

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      const filename = uri.split('/').pop() ?? 'image.jpg';
      const ext = /\.(\w+)$/.exec(filename);
      const mimeType = ext ? `image/${ext[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('image', { uri, name: filename, type: mimeType } as unknown as Blob);

      const res = await fetch(`${API_BASE}/api/complaints/analyze-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.isCivicIssue) {
        setForm(p => ({
          ...p,
          imageUrl: data.imageUrl || p.imageUrl,
          category: data.category ?? '',
          severity: data.severity ?? '',
          description: data.description ?? '',
          isAnalyzing: false, notCivicIssue: false, isFallback: false,
        }));
      } else {
        setForm(p => ({
          ...p,
          imageUrl: data.imageUrl || p.imageUrl,
          category: '', severity: '', description: '',
          isAnalyzing: false, notCivicIssue: true, isFallback: false,
        }));
      }
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      const msg = (e as any)?.message || String(e);
      console.error('analyzeImage error:', msg);
      // AI failed — upload directly to Cloudinary as fallback
      let fallbackUrl: string | null = null;
      try {
        const token2 = await authService.getToken();
        const filename2 = uri.split('/').pop() ?? 'image.jpg';
        const ext2 = /\.(\w+)$/.exec(filename2);
        const mimeType2 = ext2 ? `image/${ext2[1]}` : 'image/jpeg';
        const fd = new FormData();
        fd.append('image', { uri, name: filename2, type: mimeType2 } as unknown as Blob);
        const upRes = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token2 ?? ''}` },
          body: fd,
        });
        if (upRes.ok) fallbackUrl = (await upRes.json()).imageUrl ?? null;
      } catch { /* best-effort */ }

      Alert.alert('Notice', 'AI analysis unavailable, please fill in manually.');
      setForm(p => ({
        ...p,
        imageUrl: fallbackUrl ?? p.imageUrl,
        category: '', severity: '', description: '',
        isAnalyzing: false, isFallback: true, notCivicIssue: false,
      }));
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.imageUri) {
      Alert.alert('Photo Required', 'Please capture a live photo of the issue.');
      return;
    }
    if (!form.locationVerified || !form.location) {
      Alert.alert('Location Required', 'Location must be verified before submitting.', [
        { text: 'Retry Location', onPress: fetchLocation },
      ]);
      return;
    }
    if (!form.description.trim()) {
      setForm(p => ({ ...p, descriptionError: 'Description is required.' }));
      return;
    }
    if (!form.category) {
      Alert.alert('Incomplete', 'Please select a category.');
      return;
    }

    setForm(p => ({ ...p, isSubmitting: true, descriptionError: '' }));
    try {
      // Use already-uploaded URL, or upload now if background upload failed/is still running
      let finalImageUrl = form.imageUrl;
      if (!finalImageUrl) {
        const token = await authService.getToken();
        const uri = form.imageUri;
        const filename = uri.split('/').pop() ?? 'image.jpg';
        const ext = /\.(\w+)$/.exec(filename);
        const mimeType = ext ? `image/${ext[1]}` : 'image/jpeg';
        const fd = new FormData();
        fd.append('image', { uri, name: filename, type: mimeType } as unknown as Blob);
        const upRes = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token ?? ''}` },
          body: fd,
        });
        if (!upRes.ok) throw new Error('Photo upload failed. Please try again.');
        const { imageUrl } = await upRes.json();
        finalImageUrl = imageUrl;
      }

      await api.post('/complaints', {
        description: form.description,
        imageUrl: finalImageUrl,
        category: form.category,
        severity: form.severity,
        location: form.location,
        capturedAt: new Date().toISOString(),
        captureLocation: form.captureLocation,
        deviceVerified: true,
      });
      router.push('/success');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Submission failed.';
      Alert.alert('Error', msg);
      setForm(p => ({ ...p, isSubmitting: false }));
    }
  }

  const isLoading = form.isAnalyzing || form.isSubmitting;
  const isVerified = !!form.imageUrl && form.locationVerified;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Report Issue</Text>
        <Text style={styles.subtitle}>Help us fix your neighbourhood</Text>
      </View>

      {/* Verification badge */}
      {isVerified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✅ VERIFIED — Live photo & location confirmed</Text>
        </View>
      )}

      {/* Location status */}
      {form.isLocating && (
        <View style={styles.infoBanner}>
          <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>Capturing location…</Text>
        </View>
      )}
      {!form.isLocating && !form.locationVerified && (
        <Pressable style={styles.errorBanner} onPress={fetchLocation}>
          <Text style={styles.errorBannerText}>⚠️ Location unavailable — tap to retry</Text>
        </Pressable>
      )}

      {/* Live camera capture */}
      <Text style={styles.label}>Live Photo (required)</Text>
      <Pressable style={styles.imagePlaceholder} onPress={capturePhoto} disabled={isLoading}>
        {form.imageUri ? (
          <>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} resizeMode="cover" />
            {isUploading ? (
              <View style={styles.uploadedBadge}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : form.imageUrl ? (
              <View style={styles.uploadedBadge}>
                <Text style={styles.uploadedBadgeText}>☁️ Uploaded</Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.cameraEmoji}>📷</Text>
            <Text style={styles.imageText}>Tap to take a live photo</Text>
            <Text style={styles.imageHint}>Camera only — gallery not allowed</Text>
          </>
        )}
      </Pressable>

      {/* AI Autofill button — only shown after photo is captured */}
      {form.imageUri && !form.isAnalyzing && (
        <Pressable
          style={[styles.aiBtn, isLoading && styles.submitBtnDisabled]}
          onPress={() => form.imageUri && analyzeImage(form.imageUri)}
          disabled={isLoading}
        >
          <Text style={styles.aiBtnText}>✨ AI Autofill</Text>
        </Pressable>
      )}

      {/* AI status banners */}
      {form.isAnalyzing && (
        <View style={styles.infoBanner}>
          <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>Analysing image with AI…</Text>
        </View>
      )}
      {form.notCivicIssue && (
        <View style={styles.warnBanner}>
          <Text style={styles.warnText}>This doesn't look like a civic issue. Please retake the photo.</Text>
        </View>
      )}
      {form.isFallback && (
        <View style={styles.warnBanner}>
          <Text style={styles.warnText}>AI unavailable — please fill in the form manually.</Text>
        </View>
      )}

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat.value}
            style={[styles.chip, form.category === cat.value && styles.chipActive]}
            onPress={() => !isLoading && setForm(p => ({ ...p, category: cat.value }))}
          >
            <Text style={[styles.chipText, form.category === cat.value && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Severity */}
      <Text style={styles.label}>Severity</Text>
      <View style={styles.chipRow}>
        {SEVERITIES.map(sev => (
          <Pressable
            key={sev.value}
            style={[styles.chip, form.severity === sev.value && styles.chipActive]}
            onPress={() => !isLoading && setForm(p => ({ ...p, severity: sev.value }))}
          >
            <Text style={[styles.chipText, form.severity === sev.value && styles.chipTextActive]}>
              {sev.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Description + voice */}
      <View style={styles.descLabelRow}>
        <Text style={styles.label}>Description</Text>
        <VoiceMicButton
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          isDisabled={isTranscribing}
          elapsedSeconds={elapsedSeconds}
          onPress={() => isRecording ? stopAndTranscribe() : startRecording()}
        />
      </View>
      <Pressable
        style={styles.langPicker}
        onPress={() =>
          Alert.alert('Voice Language', undefined, [
            ...SUPPORTED_LANGUAGES.map(l => ({
              text: l.label,
              onPress: () => setForm(p => ({ ...p, languageHint: l.value })),
            })),
            { text: 'Cancel', style: 'cancel' as const },
          ])
        }
      >
        <Text style={styles.langPickerText}>
          🌐 {SUPPORTED_LANGUAGES.find(l => l.value === form.languageHint)?.label ?? 'Auto-detect'}
        </Text>
      </Pressable>
      <TextInput
        style={[styles.textInput, form.descriptionError ? styles.inputError : null]}
        placeholder="Describe the issue in detail..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={5}
        value={form.description}
        onChangeText={v => setForm(p => ({ ...p, description: v, descriptionError: '' }))}
        textAlignVertical="top"
        editable={!isLoading && !isTranscribing}
      />
      {form.detectedLanguage ? (
        <Text style={styles.detectedLang}>
          Detected: {LANGUAGE_NAMES[form.detectedLanguage] ?? form.detectedLanguage}
        </Text>
      ) : null}
      {form.descriptionError ? <Text style={styles.errorText}>{form.descriptionError}</Text> : null}

      {/* Location display */}
      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.textInput}
        placeholder={form.isLocating ? 'Capturing location…' : 'Location'}
        placeholderTextColor="#9CA3AF"
        value={
          form.location
            ? form.location.address || `${form.location.lat.toFixed(5)}, ${form.location.lng.toFixed(5)}`
            : ''
        }
        onChangeText={v =>
          setForm(p => ({
            ...p,
            location: p.location ? { ...p.location, address: v } : { lat: 0, lng: 0, address: v },
          }))
        }
        editable={!isLoading}
      />

      {/* Submit */}
      <Pressable
        style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {form.isSubmitting
          ? <><ActivityIndicator color="#fff" /><Text style={[styles.submitBtnText, { marginLeft: 8 }]}>Submitting…</Text></>
          : isUploading
          ? <><ActivityIndicator color="#fff" /><Text style={[styles.submitBtnText, { marginLeft: 8 }]}>Uploading photo…</Text></>
          : <Text style={styles.submitBtnText}>Submit Report</Text>
        }
      </Pressable>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 20 },
  back: { fontSize: 15, color: '#2563EB', fontWeight: '500', marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  label: {
    fontSize: 12, fontWeight: '700', color: '#374151',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 20,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#86EFAC', marginBottom: 8,
  },
  verifiedText: { color: '#166534', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginTop: 8,
  },
  infoText: { color: '#2563EB', fontSize: 14 },
  errorBanner: {
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
    marginTop: 8, borderWidth: 1, borderColor: '#FECACA',
  },
  errorBannerText: { color: '#DC2626', fontSize: 13, fontWeight: '500', textAlign: 'center' },
  warnBanner: {
    backgroundColor: '#FEF9C3', borderRadius: 10, padding: 12,
    marginTop: 12, borderWidth: 1, borderColor: '#FDE047',
  },
  warnText: { color: '#713F12', fontSize: 14 },
  imagePlaceholder: {
    backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE',
    borderStyle: 'dashed', borderRadius: 14, paddingVertical: 32,
    alignItems: 'center', overflow: 'hidden', marginTop: 4,
  },
  previewImage: { width: '100%', height: 220 },
  uploadedBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  uploadedBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cameraEmoji: { fontSize: 32, marginBottom: 8 },
  imageText: { fontSize: 15, color: '#2563EB', fontWeight: '600' },
  imageHint: { fontSize: 12, color: '#93C5FD', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },
  textInput: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#1A1A2E',
    minHeight: 50, lineHeight: 22,
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 4 },
  submitBtn: {
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 32, flexDirection: 'row', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  descLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8, marginTop: 20,
  },
  langPicker: {
    backgroundColor: '#EFF6FF', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 12,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  langPickerText: { color: '#2563EB', fontSize: 13, fontWeight: '500' },
  detectedLang: { color: '#6B7280', fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#7C3AED', borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 20, marginTop: 10,
  },
  aiBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
