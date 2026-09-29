import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { DEFAULT_FILTERS } from '../utils/historyUtils';

const CATEGORIES = ['ALL', 'pothole', 'garbage', 'water_leak', 'streetlight', 'road_damage', 'power_cut', 'other'];
const SEVERITIES = ['ALL', 'LOW', 'MEDIUM', 'HIGH'];
const STATUSES   = ['ALL', 'RECEIVED', 'JOB_CREATED', 'IN_PROGRESS', 'COMPLETED'];

const SEVERITY_COLOR = { LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444' };

function ChipRow({ label, options, selected, onSelect, disabled, colorMap }) {
  return (
    <View style={styles.chipSection}>
      <Text style={styles.chipLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.map((opt) => {
          const active = selected === opt;
          const color = colorMap?.[opt];
          return (
            <Pressable
              key={opt}
              onPress={() => !disabled && onSelect(opt)}
              style={[
                styles.chip,
                active && styles.chipActive,
                color && !active && { borderColor: color },
              ]}
            >
              {color && !active && <View style={[styles.dot, { backgroundColor: color }]} />}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt === 'ALL' ? 'All' : opt.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function FilterPanel({ filters, disabled, onChange, onReset }) {
  function validateDate(val, field) {
    if (!val) return true;
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      Alert.alert('Invalid Date', `${field} must be a valid date (e.g. 2024-01-15)`);
      return false;
    }
    return true;
  }

  return (
    <View style={styles.container}>
      <ChipRow
        label="Category"
        options={CATEGORIES}
        selected={filters.category}
        onSelect={(v) => onChange({ ...filters, category: v })}
        disabled={disabled}
      />
      <ChipRow
        label="Severity"
        options={SEVERITIES}
        selected={filters.severity}
        onSelect={(v) => onChange({ ...filters, severity: v })}
        disabled={disabled}
        colorMap={SEVERITY_COLOR}
      />
      <ChipRow
        label="Status"
        options={STATUSES}
        selected={filters.status}
        onSelect={(v) => onChange({ ...filters, status: v })}
        disabled={disabled}
      />

      {/* Date range */}
      <View style={styles.chipSection}>
        <Text style={styles.chipLabel}>Date Range</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.dateInput, disabled && styles.inputDisabled]}
            placeholder="Start (YYYY-MM-DD)"
            placeholderTextColor="#9CA3AF"
            value={filters.startDate}
            editable={!disabled}
            onEndEditing={(e) => {
              const val = e.nativeEvent.text;
              if (validateDate(val, 'Start Date')) onChange({ ...filters, startDate: val });
            }}
            onChangeText={(v) => onChange({ ...filters, startDate: v })}
          />
          <Text style={styles.dateSep}>→</Text>
          <TextInput
            style={[styles.dateInput, disabled && styles.inputDisabled]}
            placeholder="End (YYYY-MM-DD)"
            placeholderTextColor="#9CA3AF"
            value={filters.endDate}
            editable={!disabled}
            onEndEditing={(e) => {
              const val = e.nativeEvent.text;
              if (validateDate(val, 'End Date')) onChange({ ...filters, endDate: val });
            }}
            onChangeText={(v) => onChange({ ...filters, endDate: v })}
          />
        </View>
      </View>

      <Pressable onPress={() => !disabled && onReset()} style={[styles.resetBtn, disabled && styles.resetBtnDisabled]}>
        <Text style={styles.resetText}>↺ Reset Filters</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  chipSection: { paddingHorizontal: 16, paddingTop: 8 },
  chipLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12, color: '#1A1A2E' },
  inputDisabled: { opacity: 0.5 },
  dateSep: { color: '#9CA3AF', fontSize: 14 },
  resetBtn: { marginHorizontal: 16, marginTop: 8, paddingVertical: 7, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  resetBtnDisabled: { opacity: 0.4 },
  resetText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
});
