import React, { useEffect, useRef } from 'react';
import { Animated, ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VoiceMicButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isDisabled: boolean;
  elapsedSeconds: number;
  onPress: () => void;
}

function formatElapsed(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function VoiceMicButton({ isRecording, isTranscribing, isDisabled, elapsedSeconds, onPress }: VoiceMicButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      loop.current.start();
    } else {
      loop.current?.stop();
      pulse.setValue(1);
    }
    return () => loop.current?.stop();
  }, [isRecording, pulse]);

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]} />
      )}
      <TouchableOpacity
        style={[styles.btn, isRecording && styles.btnRecording, isDisabled && styles.btnDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
        accessibilityRole="button"
      >
        {isTranscribing
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.icon}>🎤</Text>
        }
      </TouchableOpacity>
      {isRecording && <Text style={styles.timer}>{formatElapsed(elapsedSeconds)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2.5, borderColor: '#EF4444',
    backgroundColor: 'transparent',
  },
  btn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
  },
  btnRecording: { backgroundColor: '#EF4444' },
  btnDisabled: { opacity: 0.4 },
  icon: { fontSize: 20 },
  timer: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#EF4444' },
});
