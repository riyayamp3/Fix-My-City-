import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  Modal, ScrollView, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import {
  DEFAULT_FILTERS, clusterComplaints, computeStats,
  buildQueryString, formatDate,
} from '../utils/historyUtils';
import FilterPanel from '../components/FilterPanel';
import StatsBar from '../components/StatsBar';
import ViewToggle from '../components/ViewToggle';
import HeatmapView from '../components/HeatmapView';
import TimelineView from '../components/TimelineView';

const SEVERITY_COLOR = { LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444' };
const STATUS_LABEL = {
  RECEIVED: 'Received', JOB_CREATED: 'Job Created',
  IN_PROGRESS: 'In Progress', COMPLETED: 'Resolved',
};

export default function HistoryScreen() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('heatmap');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState(null);       // timeline detail modal
  const [clusterInfo, setClusterInfo] = useState(null); // heatmap cluster callout

  const fetchHistory = useCallback(async (activeFilters, offset) => {
    const qs = buildQueryString(activeFilters, offset);
    const data = await api.get(`/complaints/history?${qs}`);
    return data;
  }, []);

  const loadInitial = useCallback(async (activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistory(activeFilters, 0);
      setComplaints(data);
      setHasMore(data.length === 50);
    } catch (err) {
      setError(err?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  useEffect(() => {
    loadInitial(DEFAULT_FILTERS);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    loadInitial(newFilters);
  }, [loadInitial]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    loadInitial(DEFAULT_FILTERS);
  }, [loadInitial]);

  const handleEndReached = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchHistory(filters, complaints.length);
      setComplaints((prev) => [...prev, ...data]);
      setHasMore(data.length === 50);
    } catch { /* preserve existing data */ }
    setLoadingMore(false);
  }, [hasMore, loadingMore, filters, complaints.length, fetchHistory]);

  const heatmapPoints = useMemo(() => clusterComplaints(complaints), [complaints]);
  const stats = useMemo(() => computeStats(complaints), [complaints]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Issue History</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading…' : `${stats.total} complaint${stats.total !== 1 ? 's' : ''} found`}
        </Text>
      </View>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* View toggle */}
      <ViewToggle mode={viewMode} onChange={setViewMode} />

      {/* Filters */}
      <FilterPanel
        filters={filters}
        disabled={loading}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading complaint history…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => loadInitial(filters)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : viewMode === 'heatmap' ? (
        <HeatmapView
          points={heatmapPoints}
          onClusterPress={setClusterInfo}
        />
      ) : (
        <TimelineView
          complaints={complaints}
          onItemPress={setSelected}
          onEndReached={handleEndReached}
          loadingMore={loadingMore}
        />
      )}

      {/* Timeline detail modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {selected && (
              <ScrollView>
                {selected.imageUrl ? (
                  <Image source={{ uri: selected.imageUrl }} style={styles.sheetImage} resizeMode="cover" />
                ) : (
                  <View style={styles.sheetImagePlaceholder}>
                    <Text style={{ fontSize: 48 }}>📋</Text>
                  </View>
                )}
                <View style={styles.sheetBody}>
                  <Text style={styles.sheetTitle}>{selected.category?.replace(/_/g, ' ')}</Text>
                  <View style={[styles.sevRow]}>
                    <View style={[styles.sevBadge, { backgroundColor: (SEVERITY_COLOR[selected.severity] ?? '#6B7280') + '22', borderColor: SEVERITY_COLOR[selected.severity] ?? '#6B7280' }]}>
                      <Text style={[styles.sevText, { color: SEVERITY_COLOR[selected.severity] ?? '#6B7280' }]}>{selected.severity}</Text>
                    </View>
                    <Text style={styles.statusText}>{STATUS_LABEL[selected.status] ?? selected.status}</Text>
                  </View>
                  {selected.description ? <Text style={styles.desc}>{selected.description}</Text> : null}
                  {selected.location?.address ? <Text style={styles.meta}>📍 {selected.location.address}</Text> : null}
                  <Text style={styles.meta}>🕐 {formatDate(selected.createdAt)}</Text>
                  <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Cluster info modal */}
      <Modal visible={!!clusterInfo} transparent animationType="fade" onRequestClose={() => setClusterInfo(null)}>
        <Pressable style={styles.backdrop} onPress={() => setClusterInfo(null)}>
          <View style={styles.clusterCard}>
            <Text style={styles.clusterCount}>{clusterInfo?.count} complaint{clusterInfo?.count !== 1 ? 's' : ''}</Text>
            <Text style={styles.clusterCat}>Top issue: {clusterInfo?.topCategory?.replace(/_/g, ' ')}</Text>
            <Pressable onPress={() => setClusterInfo(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, backgroundColor: '#F7F8FA' },
  back: { fontSize: 15, color: '#2563EB', fontWeight: '500', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6B7280', marginTop: 10, fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center', marginBottom: 12, paddingHorizontal: 32 },
  retryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', maxHeight: '80%' },
  sheetImage: { width: '100%', height: 200 },
  sheetImagePlaceholder: { width: '100%', height: 120, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  sheetBody: { padding: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', textTransform: 'capitalize', marginBottom: 8 },
  sevRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sevBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  sevText: { fontSize: 12, fontWeight: '700' },
  statusText: { fontSize: 13, color: '#6B7280' },
  desc: { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 10 },
  meta: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  closeBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  clusterCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, margin: 32,
    alignItems: 'center', alignSelf: 'center', width: '80%',
  },
  clusterCount: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  clusterCat: { fontSize: 14, color: '#6B7280', textTransform: 'capitalize', marginBottom: 16 },
});
