import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  ScrollView, Image, Modal, FlatList,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { api } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
type Status   = 'RECEIVED' | 'JOB_CREATED' | 'IN_PROGRESS' | 'COMPLETED';

interface Hotspot {
  _id: string;
  location: { lat: number; lng: number; address?: string };
  category: string;
  severity: Severity;
  status: Status;
  description: string;
  createdAt: string;
  imageUrl?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_COLOR: Record<Severity, string> = {
  HIGH:   '#EF4444',
  MEDIUM: '#F59E0B',
  LOW:    '#10B981',
};

const STATUS_LABEL: Record<Status, string> = {
  RECEIVED:    '🔴 Received',
  JOB_CREATED: '🟠 Job Created',
  IN_PROGRESS: '🔵 In Progress',
  COMPLETED:   '✅ Completed',
};

const CATEGORY_EMOJI: Record<string, string> = {
  pothole:     '🕳️',
  garbage:     '🗑️',
  water_leak:  '💧',
  streetlight: '💡',
  road_damage: '🚧',
  power_cut:   '⚡',
  other:       '⚠️',
};

const DEFAULT_REGION = {
  latitude: 18.5204,
  longitude: 73.8567,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [filter, setFilter] = useState<Severity | 'ALL'>('ALL');
  const [region, setRegion] = useState(DEFAULT_REGION);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadHotspots();
    getUserLocation();
  }, []);

  async function loadHotspots() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/complaints/hotspots') as Hotspot[];
      setHotspots(data);
    } catch {
      setError('Could not load hotspots. Tap to retry.');
    } finally {
      setLoading(false);
    }
  }

  async function getUserLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newRegion = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
    } catch { /* best-effort */ }
  }

  const filtered = filter === 'ALL' ? hotspots : hotspots.filter(h => h.severity === filter);

  const categoryCounts = hotspots.reduce<Record<string, number>>((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Hotspot Map</Text>
          <Pressable onPress={loadHotspots} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>↻ Refresh</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          {loading ? 'Loading…' : `${filtered.length} active issue${filtered.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Severity filter chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(f => (
          <Pressable
            key={f}
            style={[
              styles.filterChip,
              filter === f && styles.filterChipActive,
              f !== 'ALL' && filter !== f && { borderColor: PIN_COLOR[f as Severity] },
            ]}
            onPress={() => setFilter(f)}
          >
            {f !== 'ALL' && (
              <View style={[styles.filterDot, { backgroundColor: PIN_COLOR[f as Severity] }]} />
            )}
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
        >
          {filtered.map(h => (
            <Marker
              key={h._id}
              coordinate={{ latitude: h.location.lat, longitude: h.location.lng }}
              pinColor={PIN_COLOR[h.severity] ?? '#6B7280'}
              onPress={() => setSelected(h)}
            >
              <Callout onPress={() => setSelected(h)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {CATEGORY_EMOJI[h.category] ?? '⚠️'} {h.category?.replace('_', ' ')}
                  </Text>
                  <Text style={styles.calloutSub}>{STATUS_LABEL[h.status]}</Text>
                  <Text style={styles.calloutHint}>Tap for details →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Loading overlay */}
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.overlayText}>Fetching complaints…</Text>
          </View>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <Pressable style={styles.errorOverlay} onPress={loadHotspots}>
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyText}>No active complaints in this area</Text>
          </View>
        )}
      </View>

      {/* Category summary strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.stripContent}
      >
        {Object.entries(categoryCounts).map(([cat, count]) => (
          <View key={cat} style={styles.stripChip}>
            <Text style={styles.stripEmoji}>{CATEGORY_EMOJI[cat] ?? '⚠️'}</Text>
            <Text style={styles.stripCount}>{count}</Text>
            <Text style={styles.stripLabel}>{cat.replace('_', ' ')}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Detail bottom sheet */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {selected && (
              <>
                {selected.imageUrl ? (
                  <Image source={{ uri: selected.imageUrl }} style={styles.sheetImage} resizeMode="cover" />
                ) : (
                  <View style={styles.sheetImagePlaceholder}>
                    <Text style={{ fontSize: 48 }}>{CATEGORY_EMOJI[selected.category] ?? '⚠️'}</Text>
                  </View>
                )}
                <View style={styles.sheetBody}>
                  <View style={styles.sheetTitleRow}>
                    <Text style={styles.sheetTitle}>
                      {selected.category?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Text>
                    <View style={[styles.severityDot, { backgroundColor: PIN_COLOR[selected.severity] ?? '#6B7280' }]} />
                  </View>
                  <Text style={styles.sheetStatus}>{STATUS_LABEL[selected.status]}</Text>
                  <Text style={styles.sheetDesc}>{selected.description}</Text>
                  {selected.location.address ? (
                    <Text style={styles.sheetAddr}>📍 {selected.location.address}</Text>
                  ) : null}
                  <Text style={styles.sheetDate}>
                    🕐 {new Date(selected.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                  <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 15, color: '#2563EB', fontWeight: '500', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  refreshBtn: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  refreshText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff',
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
  },
  filterChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247,248,250,0.88)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayText: { color: '#6B7280', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    position: 'absolute', bottom: 16, left: 20, right: 20,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#FECACA', alignItems: 'center',
  },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },
  emptyOverlay: {
    position: 'absolute', bottom: 16, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },
  emptyText: { color: '#9CA3AF', fontSize: 13 },
  callout: {
    width: 180, padding: 10,
    backgroundColor: '#fff', borderRadius: 10,
  },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', textTransform: 'capitalize', marginBottom: 3 },
  calloutSub: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  calloutHint: { fontSize: 11, color: '#2563EB' },
  strip: { maxHeight: 76, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  stripContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 16, alignItems: 'center' },
  stripChip: { alignItems: 'center', minWidth: 56 },
  stripEmoji: { fontSize: 20 },
  stripCount: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  stripLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'capitalize' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  sheetImage: { width: '100%', height: 200 },
  sheetImagePlaceholder: { width: '100%', height: 140, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  sheetBody: { padding: 20 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  severityDot: { width: 14, height: 14, borderRadius: 7 },
  sheetStatus: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  sheetDesc: { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 10 },
  sheetAddr: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  sheetDate: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  closeBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
