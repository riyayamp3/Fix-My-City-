import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import ComplaintCard from '../components/ComplaintCard';
import complaintService from '../services/complaintService';

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Received',
  JOB_CREATED: 'Job Created',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Resolved',
};

export default function MyComplaintsScreen() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaints = useCallback(async () => {
    try {
      const data = await complaintService.getMyComplaints();
      setComplaints(data);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load complaints.');
    }
  }, []);

  useEffect(() => {
    fetchComplaints().finally(() => setLoading(false));
  }, [fetchComplaints]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  }, [fetchComplaints]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Complaints</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading...' : `${complaints.length} report${complaints.length !== 1 ? 's' : ''} submitted`}
        </Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { label: 'Received', bg: '#DBEAFE', text: '#1E40AF' },
          { label: 'In Progress', bg: '#FEF3C7', text: '#92400E' },
          { label: 'Resolved', bg: '#D1FAE5', text: '#065F46' },
        ].map((s) => (
          <View key={s.label} style={[styles.legendChip, { backgroundColor: s.bg }]}>
            <Text style={[styles.legendText, { color: s.text }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchComplaints} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : complaints.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>No complaints yet</Text>
          <Text style={styles.emptySubtext}>Tap "Report an Issue" to get started</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {complaints.map((item) => (
            <ComplaintCard
              key={item._id}
              title={item.description || item.category || 'Issue'}
              status={STATUS_LABEL[item.status] || item.status}
              category={item.category}
              location={item.location?.address || (item.location?.lat ? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}` : null)}
              date={item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null}
              onPress={() => router.push(`/complaint/${item._id}` as any)}
            />
          ))}
          <View style={styles.listBottom} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', paddingHorizontal: 20, paddingTop: 60 },
  header: { marginBottom: 20 },
  back: { fontSize: 15, color: '#2563EB', fontWeight: '500', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  legend: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  legendChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  legendText: { fontSize: 11, fontWeight: '600' },
  listBottom: { height: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#6B7280' },
});
