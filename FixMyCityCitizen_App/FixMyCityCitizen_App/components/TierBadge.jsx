import { View, Text, StyleSheet } from 'react-native';

const TIER_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
};

export default function TierBadge({ tier }) {
  const color = TIER_COLORS[tier] ?? TIER_COLORS.BRONZE;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.label}>{tier}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
