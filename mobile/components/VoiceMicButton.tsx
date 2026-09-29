import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface VoiceMicButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isDisabled: boolean;
  elapsedSeconds: number;
  onPress: () => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function VoiceMicButton({
  isRecording,
  isTranscribing,
  isDisabled,
  elapsedSeconds,
  onPress,
}: VoiceMicButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      loopRef.current?.stop();
    };
  }, [isRecording, pulseAnim]);

  const renderIcon = () => {
    if (isTranscribing) {
      return <ActivityIndicator color="#fff" size="small" />;
    }
    return <Text style={styles.micIcon}>🎤</Text>;
  };

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
      )}
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.buttonRecording,
          isDisabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
        accessibilityRole="button"
      >
        {renderIcon()}
      </TouchableOpacity>
      {isRecording && (
        <Text style={styles.timer}>{formatElapsed(elapsedSeconds)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#ef4444',
    backgroundColor: 'transparent',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRecording: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  micIcon: {
    fontSize: 22,
  },
  timer: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
});
