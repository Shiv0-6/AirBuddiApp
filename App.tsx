import 'react-native-url-polyfill/auto';

import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
// 1. Import SafeAreaView along with SafeAreaProvider
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { DashboardScreen } from './src/features/dashboard/DashboardScreen';

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
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsSignedIn(true);
    } catch (error) {
      console.error('[AirBuddi] Sign in failed:', error);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      setIsSignedIn(false);
    } catch (error) {
      console.error('[AirBuddi] Sign out failed:', error);
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
    // 2. Change your root View here to a SafeAreaView.
    // 3. Use edges={['top']} so padding is applied *only* to the top area 
    // where your status bar/battery icons sit, leaving the bottom unaffected.
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardScreen onSignOut={handleSignOut} />
    </SafeAreaView>
  );
}

// ─── Sign In Screen ───────────────────────────────────────────────────────────

function SignInScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <SafeAreaView style={signInStyles.container} edges={['top']}>
      <View style={signInStyles.content}>
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

        {/* Bottom section with sign in button */}
        <View style={signInStyles.bottomSection}>
          <TouchableOpacity
            style={signInStyles.signInButton}
            activeOpacity={0.8}
            onPress={onSignIn}
          >
            <MaterialCommunityIcons name="login" size={20} color="#FFFFFF" />
            <Text style={signInStyles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          <Text style={signInStyles.demoText}>
            Demo mode — tap to enter
          </Text>
        </View>
      </View>
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
    // 4. Match the background color to your app layout (#F4F9F5 or white) 
    // so the safe padding area blends seamlessly with your dashboard header.
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
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 50,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#7A9E87',
    marginBottom: 8,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0D2818',
    letterSpacing: -1,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 16,
    color: '#3D6B50',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    maxWidth: 280,
  },
  bottomSection: {
    alignItems: 'center',
  },
  signInButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0D2818',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  demoText: {
    marginTop: 16,
    color: '#7A9E87',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default App;