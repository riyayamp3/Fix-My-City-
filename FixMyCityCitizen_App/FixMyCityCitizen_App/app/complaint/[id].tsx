import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import complaintService from '../../services/complaintService';
import { api } from '../../services/api';

const STATUS_STEPS = ['RECEIVED', 'JOB_CREATED', 'IN_PROGRESS', 'COMPLETED'];
const STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Received',
  JOB_CREATED: 'Job Created',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Resolved',
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  'Received':    { bg: '#DBEAFE', text: '#1E40AF' },
  'Job Created': { bg: '#EDE9FE', text: '#5B21B6' },
  'In Progress': { bg: '#FEF3C7', text: '#92400E' },
  'Resolved':    { bg: '#D1FAE5', text: '#065F46' },
};

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upvoting, setUpvoting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);

  async function handleUpvote() {
    setUpvoting(true);
    try {
      await api.rewards.upvote(id as string);
      setUpvoted(true);
      Alert.alert('Upvoted!', 'You earned 5 Impact Points.');
    } catch (err: any) {
      const msg = err?.message || 'Could not upvote';
      Alert.alert('Upvote failed', msg);
    } finally {
      setUpvoting(false);
    }
  }

  useEffect(() => {
    complaintService.getComplaintById(id as string)
      .then(setComplaint)
      .catch((e: any) => setError(e?.message || 'Failed to load complaint'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );

  if (error || !complaint) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error || 'Complaint not found'}</Text>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Go Back</Text></Pressable>
    </View>
  );

  const statusLabel = STATUS_LABEL[complaint.status] || complaint.status;
  const statusColors = STATUS_COLOR[statusLabel] || { bg: '#F3F4F6', text: '#374151' };
  const currentStepIndex = STATUS_STEPS.indexOf(complaint.status);
  const submittedDate = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Unknown';
  const locationText = complaint.location?.address
    || (complaint.location?.lat ? `${complaint.location.lat.toFixed(5)}, ${complaint.location.lng.toFixed(5)}` : 'Not provided');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Complaint Details</Text>
      <Text style={styles.id}>Report ID: #{(id as string).slice(-8).toUpperCase()}</Text>

      {/* Image */}
      {complaint.imageUrl ? (
        <Image source={{ uri: complaint.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : null}

      {/* Info Card */}
      <View style={styles.card}>
        <Row label="Issue" value={complaint.description || complaint.category || 'Civic Issue'} />
        <Row label="Category" value={complaint.category || 'N/A'} />
        <Row label="Severity" value={complaint.severity || 'N/A'} />
        <Row label="Submitted" value={submittedDate} />
        <Row label="Location" value={locationText} />
        <Row label="Status" value={statusLabel} isStatus statusColors={statusColors} last />
      </View>

      {/* Upvote */}
      <Pressable
        onPress={handleUpvote}
        disabled={upvoting || upvoted}
        style={[styles.upvoteBtn, (upvoting || upvoted) && styles.upvoteBtnDisabled]}
      >
        <Text style={styles.upvoteBtnText}>
          {upvoted ? '✅  Upvoted (+5 pts)' : upvoting ? 'Upvoting…' : '👍  Upvote this Issue (+5 pts)'}
        </Text>
      </Pressable>

      {/* Timeline */}
      <Text style={styles.sectionTitle}>Progress Timeline</Text>
      <View style={styles.timeline}>
        {STATUS_STEPS.map((step, index) => {
          const done = index <= currentStepIndex;
          return (
            <View key={step} style={styles.timelineRow}>
              <View style={styles.dotColumn}>
                <View style={[styles.dot, done ? styles.dotDone : styles.dotPending]} />
                {index < STATUS_STEPS.length - 1 && (
                  <View style={[styles.line, done ? styles.lineDone : styles.linePending]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
                  {STATUS_LABEL[step]}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

type RowProps = {
  label: string;
  value: string;
  isStatus?: boolean;
  statusColors?: { bg: string; text: string };
  last?: boolean;
};

function Row({ label, value, isStatus = false, statusColors, last = false }: RowProps) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {isStatus && statusColors ? (
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.rowValue}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FA' },
  back: { fontSize: 15, color: '#2563EB', fontWeight: '500', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  id: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1,
    borderColor: '#F3F4F6', overflow: 'hidden', marginBottom: 28,
  },
  row: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500', flex: 1 },
  rowValue: { fontSize: 14, color: '#1A1A2E', fontWeight: '500', flex: 2, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  errorText: { color: '#EF4444', fontSize: 15, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 20 },
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: 'row', marginBottom: 0 },
  dotColumn: { alignItems: 'center', marginRight: 16, width: 20 },
  dot: { width: 18, height: 18, borderRadius: 9, marginTop: 2 },
  dotDone: { backgroundColor: '#2563EB' },
  dotPending: { backgroundColor: '#E5E7EB', borderWidth: 1.5, borderColor: '#D1D5DB' },
  line: { width: 2, flex: 1, minHeight: 36, marginVertical: 4 },
  lineDone: { backgroundColor: '#2563EB' },
  linePending: { backgroundColor: '#E5E7EB' },
  timelineContent: { flex: 1, paddingBottom: 28 },
  stepLabel: { fontSize: 15, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 },
  stepLabelDone: { color: '#1A1A2E' },
  upvoteBtn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 28,
  },
  upvoteBtnDisabled: { backgroundColor: '#93C5FD' },
  upvoteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
