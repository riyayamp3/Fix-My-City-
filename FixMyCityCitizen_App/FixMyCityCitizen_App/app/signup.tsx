import {
  View, Text, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import InputField from '../components/InputFeild';
import PrimaryButton from '../components/PrimaryButton';
import authService from '../services/authService';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.signup(username.trim(), password);
      Alert.alert('Account created!', 'You can now sign in.', [
        { text: 'Sign In', onPress: () => router.replace('/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Signup failed', err?.message || 'Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🏙️</Text>
          </View>
          <Text style={styles.appName}>FixMyCity</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to report and track civic issues</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
          />
          <InputField
            label="Password"
            placeholder="Create a password (min 6 chars)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <InputField
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={setConfirm}
            secureTextEntry
          />
          <View style={styles.buttonGap}>
            {loading ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.loadingText}>Creating account...</Text>
              </View>
            ) : (
              <PrimaryButton label="Create Account" onPress={handleSignup} />
            )}
          </View>
        </View>

        <Pressable onPress={() => router.push('/login')} disabled={loading}>
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkHighlight}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconEmoji: { fontSize: 32 },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: { marginBottom: 24 },
  buttonGap: { marginTop: 8 },
  loadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  loadingText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  linkText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
  linkHighlight: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
