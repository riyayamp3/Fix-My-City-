import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function ViewToggle({ mode, onChange }) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.btn, mode === 'heatmap' && styles.btnActive]}
        onPress={() => onChange('heatmap')}
      >
        <Text style={[styles.btnText, mode === 'heatmap' && styles.btnTextActive]}>🗺  Heatmap</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, mode === 'timeline' && styles.btnActive]}
        onPress={() => onChange('timeline')}
      >
        <Text style={[styles.btnText, mode === 'timeline' && styles.btnTextActive]}>📋  Timeline</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', margin: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', backgroundColor: '#fff',
  },
  btn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  btnActive: { backgroundColor: '#2563EB' },
  btnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  btnTextActive: { color: '#fff' },
});
