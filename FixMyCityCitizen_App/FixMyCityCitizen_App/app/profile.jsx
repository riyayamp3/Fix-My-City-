import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import TierBadge from '../components/TierBadge';

const REASON_LABEL = {
  COMPLAINT_VERIFIED:  'Complaint Verified',
  COMPLAINT_COMPLETED: 'Complaint Resolved',
  COMPLAINT_SUBMITTED: 'Complaint Submitted',
  UPVOTE_CAST:         'Upvoted an Issue',
};

const REASON_EMOJI = {
  COMPLAINT_VERIFIED:  '✅',
  COMPLAINT_COMPLETED: '🏁',
  COMPLAINT_SUBMITTED: '📋',
  UPVOTE_CAST:         '👍',
};

export default function ProfileScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const result = await api.rewards.getMe();
      setData(result);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to load profile');
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const totalPoints = data?.totalPoints ?? 0;
  const tier = data?.tier ?? 'BRONZE';
  const ledger = data?.ledger ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading...' : `${ledger.length} point event${ledger.length !== 1 ? 's' : ''} recorded`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Stats card — mirrors the card style from ComplaintCard */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{totalPoints}</Text>
                <Text style={styles.statLabel}>Impact Points</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBlock}>
                <TierBadge tier={tier} />
                <Text style={styles.statLabel}>Current Tier</Text>
              </View>
            </View>

            {/* Tier progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min((totalPoints / 500) * 100, 100)}%` }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>0</Text>
                <Text style={styles.progressLabel}>Bronze 200</Text>
                <Text style={styles.progressLabel}>Silver 500</Text>
              </View>
            </View>
          </View>

          {/* Section heading */}
          <Text style={styles.sectionTitle}>Points History</Text>

          {ledger.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🏅</Text>
              <Text style={styles.emptyText}>No points yet</Text>
              <Text style={styles.emptySubtext}>Report issues and upvote others to earn points</Text>
            </View>
          ) : (
            ledger.map((item, i) => {
              const label = REASON_LABEL[item.reason] ?? item.reason?.replace(/_/g, ' ');
              const emoji = REASON_EMOJI[item.reason] ?? '⭐';
              const date = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '';
              return (
                <View key={item._id ?? i} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{emoji}  {label}</Text>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsBadgeText}>+{item.points} pts</Text>
                    </View>
                  </View>
                  <View style={styles.cardMeta}>
                    {item.description ? <Text style={styles.metaText}>📝 {item.description}</Text> : null}
                    {date ? <Text style={styles.metaText}>🕐 {date}</Text> : null}
                  </View>
                </View>
              );
            })
          )}

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

  statsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1,
    borderColor: '#F3F4F6', padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statBlock: { flex: 1, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 40, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 4 },
  divider: { width: 1, height: 60, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  progressSection: { gap: 6 },
  progressTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 10, color: '#9CA3AF' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', flex: 1, marginRight: 10 },
  pointsBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pointsBadgeText: { fontSize: 12, fontWeight: '700', color: '#065F46' },
  cardMeta: { gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },

  emptyBox: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  listBottom: { height: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
});
