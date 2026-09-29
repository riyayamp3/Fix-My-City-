import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import authService from '../services/authService';

export default function HomeScreen() {
  useEffect(() => {
    authService.isLoggedIn().then((loggedIn) => {
      if (!loggedIn) router.replace('/login');
    });
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🏙️</Text>
        </View>
        <Text style={styles.title}>FixMyCity</Text>
        <Text style={styles.subtitle}>Report civic issues in your neighbourhood</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="  Report an Issue"
          onPress={() => router.push('/report')}
        />
        <View style={styles.gap} />
        <PrimaryButton
          label="  My Complaints"
          onPress={() => router.push('/my-complaints')}
          variant="outline"
        />
        <View style={styles.gap} />
        <PrimaryButton
          label="  View Hotspot Map"
          onPress={() => router.push('/map')}
          variant="outline"
        />
        <View style={styles.gap} />
        <PrimaryButton
          label="  Issue History & Heatmap"
          onPress={() => router.push('/history')}
          variant="outline"
        />
        <View style={styles.gap} />
        <PrimaryButton
          label="  Leaderboard"
          onPress={() => router.push('/leaderboard')}
          variant="outline"
        />
        <View style={styles.gap} />
        <PrimaryButton
          label="  My Profile & Points"
          onPress={() => router.push('/profile')}
          variant="outline"
        />
      </View>

      <Text style={styles.footer}>Helping build better cities, together.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
  },
  gap: {
    height: 12,
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 13,
    color: '#D1D5DB',
  },
});