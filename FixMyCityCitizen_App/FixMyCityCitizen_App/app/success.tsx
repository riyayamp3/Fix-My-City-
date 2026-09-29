import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import PrimaryButton from '../components/PrimaryButton';

export default function SuccessScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>✅</Text>
      </View>
      <Text style={styles.heading}>Complaint Submitted!</Text>
      <Text style={styles.subtext}>
        Your report has been received and forwarded to the relevant authority. You can track the
        status in My Complaints.
      </Text>

      <View style={styles.actions}>
        <PrimaryButton label="Go to Home" onPress={() => router.replace('/')} />
        <View style={styles.gap} />
        <PrimaryButton
          label="View My Complaints"
          onPress={() => router.push('/my-complaints')}
          variant="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 44 },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 40,
  },
  actions: { width: '100%' },
  gap: { height: 12 },
});