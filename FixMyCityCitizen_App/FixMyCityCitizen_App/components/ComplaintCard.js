import { View, Text, Pressable, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  'Received':    { bg: '#DBEAFE', text: '#1E40AF' },
  'Job Created': { bg: '#EDE9FE', text: '#5B21B6' },
  'In Progress': { bg: '#FEF3C7', text: '#92400E' },
  'Resolved':    { bg: '#D1FAE5', text: '#065F46' },
};

export default function ComplaintCard({ title, status, category, location, date, onPress }) {
  const colors = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
        </View>
      </View>
      <View style={styles.meta}>
        {category ? <Text style={styles.metaText}>📁 {category}</Text> : null}
        {location ? <Text style={styles.metaText} numberOfLines={1}>📍 {location}</Text> : null}
        {date ? <Text style={styles.metaText}>🕐 {date}</Text> : null}
      </View>
      <Text style={styles.tap}>Tap to view details →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  meta: {
    gap: 4,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tap: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
