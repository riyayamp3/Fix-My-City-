import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { formatDate } from '../utils/historyUtils';

const CATEGORY_EMOJI = {
  pothole: '🕳️', garbage: '🗑️', water_leak: '💧',
  streetlight: '💡', road_damage: '🚧', power_cut: '⚡', other: '⚠️',
};

const SEVERITY_COLOR = { LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444' };

const STATUS_LABEL = {
  RECEIVED: 'Received', JOB_CREATED: 'Job Created',
  IN_PROGRESS: 'In Progress', COMPLETED: 'Resolved',
};

function TimelineCard({ item, onPress }) {
  const emoji = CATEGORY_EMOJI[item.category] ?? '⚠️';
  const sevColor = SEVERITY_COLOR[item.severity] ?? '#6B7280';
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => onPress(item)}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{emoji}  {item.category?.replace(/_/g, ' ')}</Text>
        <View style={[styles.sevBadge, { backgroundColor: sevColor + '22', borderColor: sevColor }]}>
          <Text style={[styles.sevText, { color: sevColor }]}>{item.severity}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>📌 {STATUS_LABEL[item.status] ?? item.status}</Text>
        {item.location?.address ? <Text style={styles.metaText} numberOfLines={1}>📍 {item.location.address}</Text> : null}
        <Text style={styles.metaText}>🕐 {formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.tap}>Tap for details →</Text>
    </Pressable>
  );
}

export default function TimelineView({ complaints, onItemPress, onEndReached, loadingMore }) {
  if (!complaints || complaints.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyText}>No complaints found for the selected filters.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={complaints}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <TimelineCard item={item} onPress={onItemPress} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      contentContainerStyle={styles.list}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} color="#2563EB" /> : null}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardPressed: { opacity: 0.85 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', flex: 1, marginRight: 8, textTransform: 'capitalize' },
  sevBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  sevText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { gap: 3, marginBottom: 6 },
  metaText: { fontSize: 12, color: '#6B7280' },
  tap: { fontSize: 11, color: '#9CA3AF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
});
