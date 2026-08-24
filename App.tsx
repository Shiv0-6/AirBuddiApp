import 'react-native-url-polyfill/auto';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  ActivityIndicator,
  Animated,
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

import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { store } from './src/store/store';
import { resetDashboard } from './src/features/dashboard/dashboardSlice';

const AUTH_STORAGE_KEY = '@airbuddi_signed_in';
const REGISTERED_ACCOUNT_STORAGE_KEY =
  '@airbuddi_registered_account';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={
            isDarkMode
              ? 'light-content'
              : 'dark-content'
          }
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
        const value = await AsyncStorage.getItem(
          AUTH_STORAGE_KEY
        );

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

      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        'true'
      );

      setIsSignedIn(true);
    } catch (error) {
      console.error(
        '[AirBuddi] Sign in failed:',
        error
      );
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await AsyncStorage.clear();

      await AsyncStorage.removeItem(
        AUTH_STORAGE_KEY
      );
    } catch (error) {
      console.error(
        '[AirBuddi] Storage clear failed:',
        error
      );
    } finally {
      store.dispatch(resetDashboard(undefined));

      setIsSignedIn(false);
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={['top']}
      >
        <ActivityIndicator
          size="large"
          color="#16A34A"
        />
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    return (
      <SignInScreen
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <DashboardScreen
        onSignOut={handleSignOut}
      />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────
   SIGN IN SCREEN
───────────────────────────────────────────── */

function SignInScreen({
  onSignIn,
}: {
  onSignIn: () => void;
}) {
  const [isRegistering, setIsRegistering] =
    useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [focusedInput, setFocusedInput] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const glowAnim = useRef(
    new Animated.Value(0)
  ).current;

  /* Logo breathing animation */

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),

        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [glowAnim]);

  /* ─────────────────────────────────────────
     LOGIN / REGISTER
  ───────────────────────────────────────── */

  const handleSubmit = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setErrorMessage(
        'Please enter both username and password.'
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /* REGISTER */

      if (isRegistering) {
        if (trimmedUsername.length < 3) {
          setErrorMessage(
            'Username must be at least 3 characters.'
          );

          return;
        }

        if (password.length < 6) {
          setErrorMessage(
            'Password must be at least 6 characters.'
          );

          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage(
            'Passwords do not match.'
          );

          return;
        }

        await AsyncStorage.setItem(
          REGISTERED_ACCOUNT_STORAGE_KEY,
          JSON.stringify({
            username: trimmedUsername,
            password,
          })
        );

        setErrorMessage('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');

        onSignIn();

        return;
      }

      /* SIGN IN */

      let isValidLogin = false;

      /*
        Default test account.

        It is NOT shown anywhere in the UI.
        You can remove this later when you connect
        your real backend authentication.
      */

      if (
        trimmedUsername === 'admin' &&
        password === 'admin123'
      ) {
        isValidLogin = true;
      }

      const storedAccount =
        await AsyncStorage.getItem(
          REGISTERED_ACCOUNT_STORAGE_KEY
        );

      if (storedAccount) {
        const account =
          JSON.parse(storedAccount);

        if (
          account.username === trimmedUsername &&
          account.password === password
        ) {
          isValidLogin = true;
        }
      }

      if (isValidLogin) {
        setErrorMessage('');

        setUsername('');
        setPassword('');

        onSignIn();
      } else {
        setErrorMessage(
          'Invalid username or password.'
        );
      }
    } catch (error) {
      console.error(
        '[AirBuddi] Authentication failed:',
        error
      );

      setErrorMessage(
        isRegistering
          ? 'Unable to create your account. Please try again.'
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────
     SWITCH LOGIN / REGISTER
  ───────────────────────────────────────── */

  const switchAuthMode = (
    register: boolean
  ) => {
    setIsRegistering(register);

    setUsername('');
    setPassword('');
    setConfirmPassword('');

    setErrorMessage('');
    setFocusedInput('');
  };

  const glowScale =
    glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.13],
    });

  const glowOpacity =
    glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.25, 0.65],
    });

  return (
    <SafeAreaView
      style={signInStyles.container}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={signInStyles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View
          style={signInStyles.background}
        >
          {/* Decorative background */}

          <View
            pointerEvents="none"
            style={signInStyles.airLineOne}
          />

          <View
            pointerEvents="none"
            style={signInStyles.airLineTwo}
          />

          <View
            pointerEvents="none"
            style={signInStyles.airLineThree}
          />

          <MaterialCommunityIcons
            pointerEvents="none"
            name="leaf"
            size={38}
            color="rgba(34,197,94,0.15)"
            style={signInStyles.leafLeft}
          />

          <MaterialCommunityIcons
            pointerEvents="none"
            name="leaf"
            size={30}
            color="rgba(34,197,94,0.14)"
            style={signInStyles.leafRight}
          />

          <ScrollView
            contentContainerStyle={
              signInStyles.scrollContent
            }
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {/* ───────── LOGO SECTION ───────── */}

            <View
              style={signInStyles.logoSection}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  signInStyles.logoGlow,
                  {
                    opacity: glowOpacity,
                    transform: [
                      {
                        scale: glowScale,
                      },
                    ],
                  },
                ]}
              />

              <View
                style={
                  signInStyles.logoCircleOuter
                }
              >
                <View
                  style={
                    signInStyles.logoCircle
                  }
                >
                  <Image
                    source={require('./assets/airbuddi-favicon.png')}
                    style={
                      signInStyles.logoImage
                    }
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text
                style={signInStyles.brandName}
              >
                GREENVERSE
              </Text>

              <Text
                style={signInStyles.appName}
              >
                AirBuddi
              </Text>

              <Text
                style={signInStyles.tagline}
              >
                Your indoor air companion
              </Text>
            </View>

            {/* ───────── FORM CARD ───────── */}

            <View
              style={signInStyles.formCard}
            >
              <Text
                style={signInStyles.formTitle}
              >
                {isRegistering
                  ? 'Create your account'
                  : 'Welcome back 👋'}
              </Text>

              <Text
                style={
                  signInStyles.formSubtitle
                }
              >
                {isRegistering
                  ? 'Create an account to manage your devices'
                  : 'Sign in to monitor and control your devices'}
              </Text>

              {/* ERROR MESSAGE */}

              {Boolean(errorMessage) && (
                <View
                  style={
                    signInStyles.errorBox
                  }
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={19}
                    color="#DC2626"
                  />

                  <Text
                    style={
                      signInStyles.errorText
                    }
                  >
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* ───────── USERNAME ───────── */}

              <View
                style={
                  signInStyles.inputGroup
                }
              >
                <Text
                  style={signInStyles.label}
                >
                  Username
                </Text>

                <View
                  style={[
                    signInStyles.inputWrapper,

                    focusedInput ===
                      'username' &&
                      signInStyles.inputWrapperFocused,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={22}
                    color={
                      focusedInput ===
                      'username'
                        ? '#16A34A'
                        : '#64748B'
                    }
                    style={
                      signInStyles.inputIcon
                    }
                  />

                  <TextInput
                    style={signInStyles.input}
                    placeholder="Enter your username"
                    placeholderTextColor="#94A3B8"
                    value={username}
                    editable={true}
                    onFocus={() =>
                      setFocusedInput(
                        'username'
                      )
                    }
                    onBlur={() =>
                      setFocusedInput('')
                    }
                    onChangeText={text => {
                      setUsername(text);

                      if (errorMessage) {
                        setErrorMessage('');
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* ───────── PASSWORD ───────── */}

              <View
                style={
                  signInStyles.inputGroup
                }
              >
                <Text
                  style={signInStyles.label}
                >
                  Password
                </Text>

                <View
                  style={[
                    signInStyles.inputWrapper,

                    focusedInput ===
                      'password' &&
                      signInStyles.inputWrapperFocused,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={22}
                    color={
                      focusedInput ===
                      'password'
                        ? '#16A34A'
                        : '#64748B'
                    }
                    style={
                      signInStyles.inputIcon
                    }
                  />

                  <TextInput
                    style={signInStyles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    editable={true}
                    onFocus={() =>
                      setFocusedInput(
                        'password'
                      )
                    }
                    onBlur={() =>
                      setFocusedInput('')
                    }
                    onChangeText={text => {
                      setPassword(text);

                      if (errorMessage) {
                        setErrorMessage('');
                      }
                    }}
                    secureTextEntry={
                      !showPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType={
                      isRegistering
                        ? 'next'
                        : 'done'
                    }
                    onSubmitEditing={() => {
                      if (!isRegistering) {
                        handleSubmit();
                      }
                    }}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword(
                        previous => !previous
                      )
                    }
                    style={
                      signInStyles.eyeButton
                    }
                    hitSlop={{
                      top: 10,
                      bottom: 10,
                      left: 10,
                      right: 10,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={
                        showPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={22}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ───────── CONFIRM PASSWORD ───────── */}

              {isRegistering && (
                <View
                  style={
                    signInStyles.inputGroup
                  }
                >
                  <Text
                    style={
                      signInStyles.label
                    }
                  >
                    Confirm Password
                  </Text>

                  <View
                    style={[
                      signInStyles.inputWrapper,

                      focusedInput ===
                        'confirmPassword' &&
                        signInStyles.inputWrapperFocused,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="lock-check-outline"
                      size={22}
                      color={
                        focusedInput ===
                        'confirmPassword'
                          ? '#16A34A'
                          : '#64748B'
                      }
                      style={
                        signInStyles.inputIcon
                      }
                    />

                    <TextInput
                      style={
                        signInStyles.input
                      }
                      placeholder="Confirm your password"
                      placeholderTextColor="#94A3B8"
                      value={confirmPassword}
                      editable={true}
                      onFocus={() =>
                        setFocusedInput(
                          'confirmPassword'
                        )
                      }
                      onBlur={() =>
                        setFocusedInput('')
                      }
                      onChangeText={text => {
                        setConfirmPassword(
                          text
                        );

                        if (errorMessage) {
                          setErrorMessage('');
                        }
                      }}
                      secureTextEntry={
                        !showPassword
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={
                        handleSubmit
                      }
                    />
                  </View>
                </View>
              )}

              {/* ───────── SIGN IN BUTTON ───────── */}

              <TouchableOpacity
                style={[
                  signInStyles.signInButton,

                  isSubmitting &&
                    signInStyles.signInButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name={
                        isRegistering
                          ? 'account-plus-outline'
                          : 'login'
                      }
                      size={23}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        signInStyles.signInButtonText
                      }
                    >
                      {isRegistering
                        ? 'Create Account'
                        : 'Sign In'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* DIVIDER */}

              <View
                style={signInStyles.divider}
              >
                <View
                  style={
                    signInStyles.dividerLine
                  }
                />

                <Text
                  style={
                    signInStyles.dividerText
                  }
                >
                  or
                </Text>

                <View
                  style={
                    signInStyles.dividerLine
                  }
                />
              </View>

              {/* LOGIN / REGISTER SWITCH */}

              <View
                style={
                  signInStyles.authPrompt
                }
              >
                <Text
                  style={
                    signInStyles.authPromptText
                  }
                >
                  {isRegistering
                    ? 'Already have an account?'
                    : 'New to AirBuddi?'}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    switchAuthMode(
                      !isRegistering
                    )
                  }
                  activeOpacity={0.7}
                  style={
                    signInStyles.authActionButton
                  }
                >
                  <Text
                    style={
                      signInStyles.authPromptAction
                    }
                  >
                    {isRegistering
                      ? 'Sign In'
                      : 'Create an account'}
                  </Text>

                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={19}
                    color="#16A34A"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────
   GENERAL STYLES
───────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────
   SIGN IN STYLES
───────────────────────────────────────────── */

const signInStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#EFF8F2',
  },

  background: {
    flex: 1,
    backgroundColor: '#EFF8F2',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },

  /* Decorative Air Lines */

  airLineOne: {
    position: 'absolute',
    width: 500,
    height: 150,
    borderRadius: 300,
    borderWidth: 1,
    borderColor:
      'rgba(34,197,94,0.08)',
    top: 170,
    left: -130,
    transform: [
      {
        rotate: '-8deg',
      },
    ],
  },

  airLineTwo: {
    position: 'absolute',
    width: 520,
    height: 180,
    borderRadius: 300,
    borderWidth: 1,
    borderColor:
      'rgba(34,197,94,0.06)',
    top: 190,
    left: -100,
    transform: [
      {
        rotate: '-8deg',
      },
    ],
  },

  airLineThree: {
    position: 'absolute',
    width: 560,
    height: 210,
    borderRadius: 300,
    borderWidth: 1,
    borderColor:
      'rgba(34,197,94,0.05)',
    top: 210,
    left: -80,
    transform: [
      {
        rotate: '-8deg',
      },
    ],
  },

  leafLeft: {
    position: 'absolute',
    top: 120,
    left: 25,
    transform: [
      {
        rotate: '-25deg',
      },
    ],
  },

  leafRight: {
    position: 'absolute',
    top: 250,
    right: 28,
    transform: [
      {
        rotate: '30deg',
      },
    ],
  },

  /* Logo */

  logoSection: {
    alignItems: 'center',
    marginBottom: 26,
  },

  logoGlow: {
    position: 'absolute',
    top: -8,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor:
      'rgba(34,197,94,0.15)',
  },

  logoCircleOuter: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor:
      'rgba(34,197,94,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  logoCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E6F7EC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor:
      'rgba(34,197,94,0.28)',
  },

  logoImage: {
    width: 43,
    height: 43,
  },

  brandName: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 5,
    color: '#4B8A61',
    marginBottom: 6,
  },

  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#102A1B',
    letterSpacing: -1.5,
    marginBottom: 8,
  },

  tagline: {
    fontSize: 16,
    color: '#496455',
    textAlign: 'center',
    fontWeight: '500',
  },

  /* Form Card */

  formCard: {
    backgroundColor:
      'rgba(255,255,255,0.96)',
    borderRadius: 30,
    padding: 24,

    shadowColor: '#173322',

    shadowOffset: {
      width: 0,
      height: 10,
    },

    shadowOpacity: 0.1,
    shadowRadius: 22,

    elevation: 6,

    borderWidth: 1,

    borderColor:
      'rgba(34,197,94,0.14)',
  },

  formTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#173322',
    marginBottom: 7,
  },

  formSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    marginBottom: 22,
  },

  /* Error */

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
  },

  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },

  /* Input */

  inputGroup: {
    marginBottom: 17,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#F8FAFC',

    borderWidth: 1.5,
    borderColor: '#E2E8F0',

    borderRadius: 17,

    paddingHorizontal: 15,

    height: 58,
  },

  inputWrapperFocused: {
    borderColor: '#22C55E',

    backgroundColor: '#FFFFFF',

    shadowColor: '#22C55E',

    shadowOffset: {
      width: 0,
      height: 0,
    },

    shadowOpacity: 0.12,
    shadowRadius: 8,

    elevation: 2,
  },

  inputIcon: {
    marginRight: 11,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',

    paddingVertical: 0,

    height: '100%',
  },

  eyeButton: {
    padding: 6,
  },

  /* Main Button */

  signInButton: {
    width: '100%',

    height: 58,

    borderRadius: 17,

    backgroundColor: '#159447',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 11,

    shadowColor: '#159447',

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.25,

    shadowRadius: 12,

    elevation: 5,
  },

  signInButtonDisabled: {
    opacity: 0.7,
  },

  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  /* Divider */

  divider: {
    flexDirection: 'row',

    alignItems: 'center',

    marginVertical: 22,
  },

  dividerLine: {
    flex: 1,

    height: 1,

    backgroundColor: '#E2E8F0',
  },

  dividerText: {
    fontSize: 13,

    color: '#94A3B8',

    marginHorizontal: 12,
  },

  /* Bottom */

  authPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  authPromptText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },

  authActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  authPromptAction: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
    marginRight: 4,
  },
});

export default App;