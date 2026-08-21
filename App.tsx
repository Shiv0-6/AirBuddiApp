import 'react-native-url-polyfill/auto';

import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { store } from './src/store/store';
import { resetDashboard } from './src/features/dashboard/dashboardSlice';

const AUTH_STORAGE_KEY = '@airbuddi_signed_in';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          translucent
          backgroundColor="transparent"
        />
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const value = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        setIsSignedIn(value === 'true');
      } catch {
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      store.dispatch(resetDashboard(undefined));
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsSignedIn(true);
    } catch (error) {
      console.error('[AirBuddi] Sign in failed:', error);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('[AirBuddi] Storage clear on sign out failed:', error);
    } finally {
      store.dispatch(resetDashboard(undefined));
      setIsSignedIn(false);
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#22C55E" />
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    return <SignInScreen onSignIn={handleSignIn} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardScreen onSignOut={handleSignOut} />
    </SafeAreaView>
  );
}

// ─── Sign In Screen ───────────────────────────────────────────────────────────

function SignInScreen({ onSignIn }: { onSignIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    if (trimmedUsername === 'admin' && password === 'admin123') {
      setErrorMessage('');
      setUsername('');
      setPassword('');
      onSignIn();
    } else {
      setErrorMessage('Invalid credentials. Use admin / admin123');
    }
  };

  const handleAutoFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={signInStyles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={signInStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={signInStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top section with logo and text */}
          <View style={signInStyles.logoSection}>
            <View style={signInStyles.logoCircleOuter}>
              <View style={signInStyles.logoCircle}>
                <Image
                  source={require('./assets/airbuddi-favicon.png')}
                  style={signInStyles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={signInStyles.brandName}>GREENVERSE</Text>
            <Text style={signInStyles.appName}>AirBuddi</Text>
            <Text style={signInStyles.tagline}>
              Monitor and control your{'\n'}indoor air quality
            </Text>
          </View>

          {/* Login Form Card */}
          <View style={signInStyles.formCard}>
            <Text style={signInStyles.formTitle}>Admin Login</Text>
            <Text style={signInStyles.formSubtitle}>Sign in to manage your devices</Text>

            {Boolean(errorMessage) && (
              <View style={signInStyles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text style={signInStyles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Username Input */}
            <View style={signInStyles.inputGroup}>
              <Text style={signInStyles.label}>Username</Text>
              <View style={signInStyles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#64748B" style={signInStyles.inputIcon} />
                <TextInput
                  style={signInStyles.input}
                  placeholder="Enter username (admin)"
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={text => {
                    setUsername(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={signInStyles.inputGroup}>
              <Text style={signInStyles.label}>Password</Text>
              <View style={signInStyles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#64748B" style={signInStyles.inputIcon} />
                <TextInput
                  style={signInStyles.input}
                  placeholder="Enter password (admin123)"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  style={signInStyles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Demo Fill Button */}
            <TouchableOpacity style={signInStyles.autoFillChip} onPress={handleAutoFill} activeOpacity={0.7}>
              <MaterialCommunityIcons name="key-variant" size={14} color="#16A34A" />
              <Text style={signInStyles.autoFillText}>Fill Demo Credentials (admin / admin123)</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={signInStyles.signInButton}
              activeOpacity={0.8}
              onPress={handleLogin}
            >
              <MaterialCommunityIcons name="login" size={20} color="#FFFFFF" />
              <Text style={signInStyles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F9F5',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F4F9F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const signInStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircleOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#7A9E87',
    marginBottom: 4,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0D2818',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#3D6B50',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0D2818',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.12)',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D2818',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  autoFillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 20,
  },
  autoFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  signInButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default App;