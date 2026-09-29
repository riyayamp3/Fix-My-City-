import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import TierBadge from '../components/TierBadge';

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

function decodeJwtUsername(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.username ?? null;
  } catch {
    return null;
  }
}

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState([]);
  const [myUsername, setMyUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [data, token] = await Promise.all([
        api.rewards.getLeaderboard(),
        AsyncStorage.getItem('token'),
      ]);
      setEntries(data);
      if (token) setMyUsername(decodeJwtUsername(token));
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to load leaderboard');
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

  const myRank = entries.findIndex((e) => e.username === myUsername);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading...' : `Top ${entries.length} civic contributor${entries.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* My rank chip — shown when loaded and user is in top 20 */}
      {!loading && myRank >= 0 && (
        <View style={styles.myRankChip}>
          <Text style={styles.myRankText}>
            You are ranked #{myRank + 1} with {entries[myRank].totalPoints} pts
          </Text>
        </View>
      )}

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
          {entries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>Be the first to earn Impact Points!</Text>
            </View>
          ) : (
            entries.map((item, index) => {
              const isMe = item.username === myUsername;
              const rankEmoji = RANK_EMOJI[index] ?? null;
              return (
                <View key={item.username ?? index} style={[styles.card, isMe && styles.cardMe]}>
                  <View style={styles.cardTop}>
                    <Text style={styles.rankText}>
                      {rankEmoji ?? `#${index + 1}`}
                    </Text>
                    <View style={styles.userInfo}>
                      <Text style={[styles.username, isMe && styles.usernameMe]}>
                        {item.username}{isMe ? '  (you)' : ''}
                      </Text>
                      <TierBadge tier={item.tier} />
                    </View>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsBadgeText}>{item.totalPoints} pts</Text>
                    </View>
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
  header: { marginBottom: 16 },
  back: { fontSize: 15, color: '#2563EB', fontWeight: '500', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },

  myRankChip: {
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: 'flex-start', marginBottom: 16,
  },
  myRankText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardMe: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  rankText: { fontSize: 22, width: 44, textAlign: 'center' },
  userInfo: { flex: 1, gap: 6, marginLeft: 8 },
  username: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  usernameMe: { color: '#2563EB' },
  pointsBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pointsBadgeText: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  listBottom: { height: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
});
