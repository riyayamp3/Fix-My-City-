import { Pressable, Text, StyleSheet } from 'react-native';

export default function PrimaryButton({ label, onPress, variant = 'solid' }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'outline' && styles.outline,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.label, variant === 'outline' && styles.outlineLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  outlineLabel: {
    color: '#2563EB',
  },
});