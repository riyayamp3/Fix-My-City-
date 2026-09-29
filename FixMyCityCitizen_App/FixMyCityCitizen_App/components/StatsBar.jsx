import { View, Text, StyleSheet } from 'react-native';

export default function StatsBar({ stats }) {
  const { total, resolutionRate, topCategory } = stats;
  return (
    <View style={styles.container}>
      <View style={styles.block}>
        <Text style={styles.value}>{total}</Text>
        <Text style={styles.label}>Total</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.block}>
        <Text style={[styles.value, { color: '#16A34A' }]}>{resolutionRate}%</Text>
        <Text style={styles.label}>Resolved</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.block}>
        <Text style={[styles.value, styles.topCat]} numberOfLines={1}>
          {topCategory === '—' ? '—' : topCategory.replace(/_/g, ' ')}
        </Text>
        <Text style={styles.label}>Top Issue</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
  },
  block: { flex: 1, alignItems: 'center' },
  value: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  topCat: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  label: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  divider: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
});
