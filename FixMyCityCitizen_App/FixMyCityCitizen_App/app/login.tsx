import {
  View, Text, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import InputField from '../components/InputFeild';
import PrimaryButton from '../components/PrimaryButton';
import authService from '../services/authService';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.login(username.trim(), password);
      if (data.role !== 'CITIZEN') {
        await authService.logout();
        Alert.alert('Wrong portal', 'This app is for Citizens only. Use the web portals for Authority or Contractor access.');
        return;
      }
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Login failed', err?.message || 'Check your credentials and try again.');
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue reporting issues</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
          />
          <InputField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={styles.buttonGap}>
            {loading ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.loadingText}>Signing in...</Text>
              </View>
            ) : (
              <PrimaryButton label="Sign In" onPress={handleLogin} />
            )}
          </View>
        </View>

        <Pressable onPress={() => router.push('/signup')} disabled={loading}>
          <Text style={styles.linkText}>
            Don't have an account?{' '}
            <Text style={styles.linkHighlight}>Sign up</Text>
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
