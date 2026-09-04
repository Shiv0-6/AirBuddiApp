import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  RefreshControl,
  TextInput,
  Image,
  Switch,
  Linking,
  Alert,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import { Camera, CameraType } from 'react-native-camera-kit';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { dashboardTheme } from './dashboardTheme';
import { connectionLabels } from './dashboardMockData';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { AirQualityCard } from '../../components/dashboard/AirQualityCard';
import { SensorGrid } from '../../components/dashboard/SensorGrid';
import { QuickControls } from '../../components/dashboard/QuickControls';
import { ConnectionPill } from '../../components/dashboard/ConnectionPill';
import { RootPurificationCard } from '../../components/dashboard/RootPurificationCard';

import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectDashboard } from './dashboardSelectors';
import type { DashboardRuntimeState } from './dashboardSlice';
import { useDashboardRealtimeBridge } from './useDashboardRealtimeBridge';
import { fetchLatestTelemetry } from '../../services/awsIot/awsTelemetryApiClient';

import ExploreProductsScreen from './ExploreProductScreen';
import { setNotifications, setPreferences, setProfile, setActiveSheet } from '../settings/settingsSlice';


// ─── Bottom Tab Config ────────────────────────────────────────────────────────

type TabId = 'home' | 'monitor' | 'control' | 'settings' | 'explore';


type HomeDevice = {
  id: string;
  name: string;
  room: string;
  status: 'Online' | 'Offline';
  aqi: number | null;
  icon: string;
};

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'monitor', label: 'Monitor', icon: 'chart-line' },
  { id: 'control', label: 'Control', icon: 'lightbulb-outline' },
  { id: 'explore', label: 'Explore', icon: 'shopping-outline' },
];

const PROFILE_STORAGE_KEY = '@airbuddi_profile';
const DEVICES_STORAGE_KEY = '@airbuddi_devices';
const NOTIFICATIONS_STORAGE_KEY = '@airbuddi_notifications';
const PREFERENCES_STORAGE_KEY = '@airbuddi_preferences';

// ─── Screen ───────────────────────────────────────────────────────────────────

export function DashboardScreen({ onSignOut }: { onSignOut: () => void }) {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(selectDashboard) as DashboardRuntimeState;
  const { notifications, preferences, profile, activeSheet } = useAppSelector(state => state.settings);
  const device = dashboard.device;
  const sensors = dashboard.sensors ?? [];
  const pm25Value = sensors.find(s => s.id === 'pm2_5')?.value ?? null;

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [refreshing, setRefreshing] = useState(false);

  // profile local UI state
  const {
    name: profileName,
    email: profileEmail,
    phone: profilePhone,
    location: profileLocation,
    avatarUri: profileAvatarUri
  } = profile;

  const [profileNameError, setProfileNameError] = useState('');
  const [profileEmailError, setProfileEmailError] = useState('');
  const [profilePhoneError, setProfilePhoneError] = useState('');
  const [profileLocationError, setProfileLocationError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [addDeviceMode, setAddDeviceMode] = useState<'qr' | 'manual'>('qr');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [isQrScannerVisible, setIsQrScannerVisible] = useState(false);
  const [scannedQrValue, setScannedQrValue] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceRoom, setNewDeviceRoom] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');
  const [addDeviceError, setAddDeviceError] = useState('');
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState('');
  const [editingDeviceRoom, setEditingDeviceRoom] = useState('');
  const [editDeviceError, setEditDeviceError] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [devices, setDevices] = useState<HomeDevice[]>([]);
  const devicesLoadedRef = useRef(false);
  const prefsLoadedRef = useRef(false);

  const {
    push: notifPush,
    aqiAlerts: notifAqiAlerts,
    deviceOffline: notifDeviceOffline,
    filterReminder: notifFilterReminder
  } = notifications;

  const {
    theme: themePreference,
    tempUnit,
    aqiStandard,
    aqiWarningThreshold,
    aqiDangerThreshold
  } = preferences;

  // FAQ expansion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const {
    setPowerState,
    setAutoMode,
    setSleepModeState,
    setUvcModeState,
    setFanSpeedState,
    setUpperBedChamberStateState,
    setLowerBedChamberStateState,
    refreshData,
  } = useDashboardRealtimeBridge(selectedDeviceId);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  // Tab transition animation
  const contentOpacity = useSharedValue(1);
  const contentTranslateY = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = 0;
    contentTranslateY.value = 10;
    contentOpacity.value = withTiming(1, { duration: 220 });
    contentTranslateY.value = withTiming(0, { duration: 220 });
  }, [activeTab, contentOpacity, contentTranslateY]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const connectionLabel = useMemo(
    () => connectionLabels[dashboard.connection],
    [dashboard.connection],
  );

  useEffect(() => {
    if (devices.length === 0) {
      if (selectedDeviceId !== null) {
        setSelectedDeviceId(null);
      }
      return;
    }

    const hasSelectedDevice = selectedDeviceId ? devices.some(item => item.id === selectedDeviceId) : false;
    if (!hasSelectedDevice) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (!selectedDeviceId || pm25Value === null) {
      return;
    }

    setDevices(current => current.map(item => item.id === selectedDeviceId ? { ...item, aqi: pm25Value } : item));
  }, [pm25Value, selectedDeviceId]);

  useEffect(() => {
    if (!selectedDeviceId || !device) {
      return;
    }

    setDevices(current =>
      current.map(item =>
        item.id === selectedDeviceId ? { ...item, status: device.status } : item,
      ),
    );
  }, [device?.status, selectedDeviceId]);

  // Load saved profile once on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (!stored) return;
        dispatch(setProfile(JSON.parse(stored)));
      } catch (error) {
        console.error('[AirBuddi] Failed to load profile:', error);
      }
    };
    loadProfile();
  }, [dispatch]);

  // Load saved devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const stored = await AsyncStorage.getItem(DEVICES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setDevices(parsed);
          }
        }
      } catch (error) {
        console.error('[AirBuddi] Failed to load devices:', error);
      } finally {
        devicesLoadedRef.current = true;
      }
    };
    loadDevices();
  }, []);

  // Persist devices whenever they change
  useEffect(() => {
    if (!devicesLoadedRef.current) { return; }
    AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices)).catch(error =>
      console.error('[AirBuddi] Failed to save devices:', error),
    );
  }, [devices]);

  // Load all preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const [notifStored, prefStored] = await Promise.all([
          AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
          AsyncStorage.getItem(PREFERENCES_STORAGE_KEY),
        ]);
        if (notifStored) {
          dispatch(setNotifications(JSON.parse(notifStored)));
        }
        if (prefStored) {
          dispatch(setPreferences(JSON.parse(prefStored)));
        }
      } catch (error) {
        console.error('[AirBuddi] Failed to load preferences:', error);
      } finally {
        prefsLoadedRef.current = true;
      }
    };
    loadPrefs();
  }, [dispatch]);

  // Auto-save notification preferences
  useEffect(() => {
    if (!prefsLoadedRef.current) { return; }
    AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
      .catch(e => console.error('[AirBuddi] Failed to save notification prefs:', e));
  }, [notifications]);

  // Auto-save app preferences
  useEffect(() => {
    if (!prefsLoadedRef.current) { return; }
    AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
      .catch(e => console.error('[AirBuddi] Failed to save preferences:', e));
  }, [preferences]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const pickProfileImage = useCallback(() => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7, selectionLimit: 1 },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          console.error('[AirBuddi] Image picker error:', response.errorMessage);
          return;
        }
        const uri = response.assets?.[0]?.uri;
        if (uri) {
          dispatch(setProfile({ avatarUri: uri }));
        }
      },
    );
  }, [dispatch]);

  const saveProfile = useCallback(async () => {
    const name = profileName.trim();
    const email = profileEmail.trim();
    const phone = profilePhone.trim();
    const location = profileLocation.trim();

    let hasError = false;

    if (!name) {
      setProfileNameError('Please enter your name.');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setProfileEmailError('Please enter your email.');
      hasError = true;
    } else if (!emailRegex.test(email)) {
      setProfileEmailError('Please enter a valid email address.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const profileData = {
        name,
        email,
        phone,
        location,
        avatarUri: profileAvatarUri,
      };

      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(profileData),
      );

      dispatch(setProfile(profileData));
      dispatch(setActiveSheet(null));
    } catch (error) {
      console.error('[AirBuddi] Failed to save profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  }, [profileName, profileEmail, profilePhone, profileLocation, profileAvatarUri, dispatch]);

  const clearProfileData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (error) {
      console.error('[AirBuddi] Failed to clear profile:', error);
    }
    dispatch(setProfile({
      name: 'AirBuddi Member',
      email: 'member@airbuddi.app',
      phone: '',
      location: '',
      avatarUri: null,
    }));
    setProfileNameError('');
    setProfileEmailError('');
    setProfilePhoneError('');
    setProfileLocationError('');
  }, [dispatch]);

  const handleSignOut = useCallback(() => {
    dispatch(setActiveSheet(null));
    setTimeout(() => {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out? All local data will be cleared.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => onSignOut(),
          },
        ],
      );
    }, 100);
  }, [onSignOut]);

  const handleTogglePower = useCallback(() => {
    if (!device) { return; }
    setPowerState(device.power !== 'on');
  }, [device, setPowerState]);

  const handleToggleAutoMode = useCallback((value: boolean) => {
    setAutoMode(value);
  }, [setAutoMode]);

  const handleToggleSleepMode = useCallback((value: boolean) => {
    setSleepModeState(value);
  }, [setSleepModeState]);

  const handleToggleUvc = useCallback((value: boolean) => {
    setUvcModeState(value);
  }, [setUvcModeState]);

  const handleSelectFanSpeed = useCallback((speed: 'off' | '1' | '2' | '3') => {
    setFanSpeedState(speed);
  }, [setFanSpeedState]);

  const applyScannedQrValue = useCallback((value: string) => {
    const scannedValue = value.trim();

    // 1. Try to find a MAC address
    const macMatch = scannedValue.match(/(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}/i);
    const scannedMac = macMatch?.[0].replace(/-/g, ':').toUpperCase() ?? '';

    // 2. Try to extract ID from a URL if the scanned value is a link
    let extractedId = scannedMac;
    if (!extractedId && (scannedValue.startsWith('http') || scannedValue.includes('/'))) {
      try {
        const urlMatch = scannedValue.match(/[?&](?:id|mac)=([^&]+)/i) || scannedValue.match(/\/([^/?#]+)$/);
        if (urlMatch) {
          extractedId = urlMatch[1].toUpperCase();
        }
      } catch (e) {
        // Fallback to raw value if URL parsing fails
      }
    }

    // 3. If still no ID, use the raw trimmed value if it looks like a valid ID
    if (!extractedId && scannedValue.length > 0) {
      extractedId = scannedValue.toUpperCase();
    }

    setScannedQrValue(scannedValue);
    setIsQrScannerVisible(false);
    setIsScanningQr(false);

    if (extractedId) {
      setAddDeviceError('');
      setNewDeviceId(extractedId);
      setNewDeviceName(prev => prev || 'AirBuddi Purifier');
      setNewDeviceRoom(prev => prev || 'Living Room');
    } else {
      setAddDeviceError('The QR code was read, but it appears to be empty or invalid.');
    }
  }, []);

  const handleScanQr = useCallback(async () => {
    setAddDeviceError('');
    setScannedQrValue('');

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'AirBuddi needs access to your camera to scan device QR codes.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setAddDeviceError('Camera permission is required to scan QR codes.');
          return;
        }
      } catch (err) {
        setAddDeviceError('Failed to request camera permission.');
        return;
      }
    }

    setIsScanningQr(true);
    setIsQrScannerVisible(true);
  }, []);

  const handlePickQrFromLibrary = useCallback(async () => {
    setIsScanningQr(true);
    setAddDeviceError('');
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (response.didCancel) {
        setIsScanningQr(false);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        if (!imageUri) {
          setAddDeviceError('The selected image could not be read.');
          return;
        }

        const barcodes = await BarcodeScanning.scan(imageUri);
        const scannedValue = barcodes.find(barcode => barcode.value)?.value;
        if (scannedValue) {
          applyScannedQrValue(scannedValue);
        } else {
          setAddDeviceError('No QR code was found in the selected image.');
        }
      }
    } catch (err) {
      setAddDeviceError(err instanceof Error ? err.message : 'Failed to decode the selected image.');
    } finally {
      setIsScanningQr(false);
    }
  }, [applyScannedQrValue]);

  const selectedDevice = devices.find(item => item.id === selectedDeviceId) ?? null;
  const deviceTitle = selectedDevice?.room ?? 'Add a device';
  const displayDeviceName = selectedDevice?.name ?? 'No device connected';
  const addDevice = useCallback(async () => {
    const name = newDeviceName.trim() || 'AirBuddi Device';
    const room = newDeviceRoom.trim() || 'New Room';
    const id = newDeviceId.trim().toUpperCase();
    if (devices.some(item => item.id.toLowerCase() === id.toLowerCase())) {
      setAddDeviceError('This device has already been added.');
      return;
    }
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(id)) {
      setAddDeviceError('Enter the device MAC address, for example F4:65:0B:49:12:60.');
      return;
    }
    setIsAddingDevice(true);
    setAddDeviceError('');
    try {
      const telemetry = await fetchLatestTelemetry(id);
      const nextConnection = telemetry.esp32?.connection ?? telemetry.connection ?? 'offline';
      const isOnline = nextConnection === 'connected';

      const nextDevice = {
        id,
        name,
        room,
        status: isOnline ? ('Online' as const) : ('Offline' as const),
        aqi: isOnline ? (telemetry.esp32?.aqi ?? telemetry.aqi ?? null) : null,
        icon: 'air-filter',
      };
      setDevices(current => [...current, nextDevice]);
      setSelectedDeviceId(current => current ?? id);
      setNewDeviceName('');
      setNewDeviceRoom('');
      setNewDeviceId('');
      dispatch(setActiveSheet(null));
    } catch (error) {
      setAddDeviceError(error instanceof Error ? error.message : 'Unable to connect to this device.');
    } finally {
      setIsAddingDevice(false);
    }
  }, [devices, newDeviceId, newDeviceName, newDeviceRoom]);
  const beginEditingDevice = useCallback((item: HomeDevice) => {
    setEditingDeviceId(item.id);
    setEditingDeviceName(item.name);
    setEditingDeviceRoom(item.room);
    setEditDeviceError('');
    dispatch(setActiveSheet('edit-device'));
  }, []);
  const saveEditedDevice = useCallback(() => {
    const name = editingDeviceName.trim();
    const room = editingDeviceRoom.trim();

    if (!editingDeviceId) {
      dispatch(setActiveSheet(null));
      return;
    }

    if (!name || !room) {
      setEditDeviceError('Device name and room are required.');
      return;
    }

    setDevices(current => current.map(item => item.id === editingDeviceId ? { ...item, name, room } : item));
    setEditingDeviceId(null);
    setEditingDeviceName('');
    setEditingDeviceRoom('');
    setEditDeviceError('');
    dispatch(setActiveSheet(null));
  }, [editingDeviceId, editingDeviceName, editingDeviceRoom]);

  const removeEditedDevice = useCallback(() => {
    if (!editingDeviceId) {
      dispatch(setActiveSheet(null));
      return;
    }

    setDevices(current => current.filter(item => item.id !== editingDeviceId));
    setEditingDeviceId(null);
    setEditingDeviceName('');
    setEditingDeviceRoom('');
    setEditDeviceError('');
    dispatch(setActiveSheet(null));
  }, [editingDeviceId]);

  // ─────────────────────────────────────────────────────────────────────────────

  const controlFanSpeed: 'off' | '1' | '2' | '3' | undefined =
    device?.fanSpeed === 'turbo' ? '3' : device?.fanSpeed;

  return (
    <View style={styles.safeArea}>
      {/* Subtle background decor */}
      <View pointerEvents="none" style={styles.bgContainer}>
        <View style={styles.bgCirclePrimary} />
        <View style={styles.bgCircleSecondary} />
      </View>

      {activeTab !== 'explore' && (
        <DashboardHeader
          title={deviceTitle}
          subtitle={`${displayDeviceName} · ${selectedDevice?.status ?? 'Offline'}`}
          deviceName={displayDeviceName}
          showDeviceInfo={activeTab === 'monitor' || activeTab === 'control'}
          onProfilePress={() => dispatch(setActiveSheet('profile'))}
          onRefreshPress={handleRefresh}
          onNotificationPress={() => dispatch(setActiveSheet('notifications'))}
          onMenuPress={() => dispatch(setActiveSheet('menu'))}
        />
      )}
      {activeTab === 'explore' ? (
        <View style={styles.exploreViewport}>
          <ExploreProductsScreen
            visible
            onClose={() => setActiveTab('home')}
            embedded
          />
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[dashboardTheme.colors.primary]}
              tintColor={dashboardTheme.colors.primary}
            />
          }
        >
        {/* ── Home Tab ──────────────────────────────────────────────── */}
        {activeTab === 'home' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
            <View style={styles.homeHeading}>
              <View style={styles.homeHeadingTopRow}>
                <View style={styles.homeHeadingText}>
                  <Text style={styles.sectionTitle}>
                    My devices
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    {devices.length > 0
                      ? `${devices.length} device${devices.length === 1 ? '' : 's'} added`
                      : 'No device connected'}
                  </Text>
                </View>

                {devices.length === 0 && (
                  <TouchableOpacity
                    style={styles.connectionHelp}
                    activeOpacity={0.8}
                    onPress={() => dispatch(setActiveSheet('help'))}
                  >
                    <View style={styles.connectionHelpText}>
                      <Text style={styles.connectionHelpTitle}>
                        Need help?
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={dashboardTheme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.homeHeadingActions}>
                {devices.length > 0 && (
                  <TouchableOpacity
                    accessibilityLabel="Add device"
                    style={styles.addDeviceHeaderButton}
                    activeOpacity={0.8}
                    onPress={() => dispatch(setActiveSheet('add-device'))}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.addDeviceHeaderButtonText}>
                      Add device
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
              <View style={styles.deviceGrid}>
                {devices.length === 0 ? (
                  <View style={styles.emptyDeviceState}>
                  {/* Connection icon */}
                  <View style={styles.connectionIconWrapper}>
                    {/* 1. Smoke Ribbon Layer (Behind Everything) */}
                    <Image
                      source={require('../../../assets/sm_bg.png')}
                      style={styles.ribbonBackground}
                      resizeMode="contain"
                    />
                      <Image
                        source={require('../../../assets/Max_l1.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
                  </View>

                  {/* Title */}
                  <Text style={styles.emptyDeviceTitle}>
                    Set up your AirBuddi
                  </Text>

                  {/* Description */}
                  <Text style={styles.emptyDeviceCopy}>
                    Bring nature closer with Airbuddi.
                  </Text>

                  {/* Add device button */}
                  <TouchableOpacity
                    accessibilityLabel="Add a device"
                    style={styles.emptyDeviceButton}
                    activeOpacity={0.8}
                    onPress={() => dispatch(setActiveSheet('add-device'))}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={22}
                      color="#FFFFFF"
                    />

                    <Text style={styles.emptyDeviceButtonText}>
                      Add a device
                    </Text>
                  </TouchableOpacity>

                  {/* How it works */}
                  <View style={styles.howItWorks}>
                    <Text style={styles.howItWorksTitle}>
                      How it works
                    </Text>

                    <View style={styles.stepsRow}>

                      <SetupStep
                        number="1"
                        icon="qrcode-scan"
                        title="Add Device"
                        description="Scan to pair"
                      />

                      <View style={styles.stepConnector} />

                      <SetupStep
                        number="2"
                        icon="wifi"
                        title="Connect"
                        description="connects via Wi-Fi"
                      />

                      <View style={styles.stepConnector} />

                      <SetupStep
                        number="3"
                        icon="chart-bar"
                        title="Monitor"
                        description="Monitor air quality"
                      />

                    </View>
                  </View>


                </View>
                ) : (
                  <>
                    {devices.map(item => {
                      const isSelected = item.id === selectedDeviceId;
                      const displayedAqi = isSelected ? pm25Value : item.aqi;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.82}
                          style={[styles.homeDeviceCard, isSelected && styles.homeDeviceCardSelected]}
                          onPress={() => setSelectedDeviceId(item.id)}
                        >
                          <View style={[styles.deviceIcon, isSelected && styles.deviceIconSelected]}>
                            <MaterialCommunityIcons name={item.icon} size={24} color={isSelected ? '#FFFFFF' : dashboardTheme.colors.primaryDark} />
                          </View>
                          <View style={styles.deviceCardContent}>
                            <Text style={styles.deviceRoom}>{item.room}</Text>
                            <Text style={styles.deviceName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.deviceMeta}>
                              <View style={[styles.deviceStatusDot, item.status === 'Offline' && styles.deviceStatusOffline]} />
                              <Text style={styles.deviceMetaText}>
                                {item.status}
                                {displayedAqi !== null && item.status !== 'Offline' ? ` · AQI ${displayedAqi}` : ''}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            accessibilityLabel={`Edit ${item.room} device`}
                            style={styles.editDeviceButton}
                            activeOpacity={0.75}
                            onPress={() => beginEditingDevice(item)}
                          >
                            <MaterialCommunityIcons name="pencil-outline" size={18} color={dashboardTheme.colors.textSecondary} />
                          </TouchableOpacity>
                          {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color={dashboardTheme.colors.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </View>
              {devices.length > 0 && (
                <TouchableOpacity
                  style={styles.connectionHelp}
                  activeOpacity={0.8}
                  onPress={() => dispatch(setActiveSheet('help'))}
                >
                  <View style={styles.connectionHelpText}>
                    <Text style={styles.connectionHelpTitle}>
                      Need help?
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={dashboardTheme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              {devices.length > 0 && <>
                <View style={styles.homeSummary}>
                  <MaterialCommunityIcons name="leaf-circle-outline" size={28} color={dashboardTheme.colors.primaryDark} />
                  <View style={styles.summaryText}><Text style={styles.summaryTitle}>Your air, at a glance</Text><Text style={styles.summaryCopy}>Select a space to see its live air quality and controls.</Text></View>
                </View>
              </>}
            </View>
          </Animated.View>
        )}

        {/* ── Monitor Tab ───────────────────────────────────────────── */}
        {activeTab === 'monitor' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
              <AirQualityCard aqi={pm25Value} />
              <View style={styles.gap}>
                <SensorGrid sensors={sensors} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Control Tab ───────────────────────────────────────────── */}
        {activeTab === 'control' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <QuickControls
              isPoweredOn={device?.power === 'on'}
              isAutoMode={device?.mode === 'auto'}
              isSleepMode={device?.sleepMode ?? false}
              isUvc={device?.uvc ?? true}
              fanSpeed={controlFanSpeed}
              onTogglePower={handleTogglePower}
              onToggleAutoMode={handleToggleAutoMode}
              onToggleSleepMode={handleToggleSleepMode}
              onToggleUvc={handleToggleUvc}
              onSelectFanSpeed={handleSelectFanSpeed}
            />
            <View style={styles.tabPad}>
              <RootPurificationCard
                upperBedChamber={device?.upperBedChamber ?? 'Standby'}
                lowerBedChamber={device?.lowerBedChamber ?? 'Standby'}
                onUpperPress={() => {
                  const currentVal = device?.upperBedChamber ?? 'Standby';
                  setUpperBedChamberStateState(currentVal === 'Active' ? 'Standby' : 'Active');
                }}
                onLowerPress={() => {
                  const currentVal = device?.lowerBedChamber ?? 'Standby';
                  setLowerBedChamberStateState(currentVal === 'Active' ? 'Standby' : 'Active');
                }}
                disabled={device?.power !== 'on' || device?.mode === 'auto'}
              />
            </View>
          </Animated.View>
        )}

        {/* ── Settings Tab ──────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your account and AirBuddi home.
              </Text>

              <Text style={styles.settingsSectionLabel}>SETTINGS</Text>
              <View style={styles.settingsCard}>
                <SettingsCategoryRow icon="account-circle-outline" title="Account" subtitle="Profile and linked accounts" onPress={() => dispatch(setActiveSheet('account'))} />
                <SettingsCategoryRow icon="air-filter" title="Devices" subtitle="Manage your AirBuddi devices" onPress={() => dispatch(setActiveSheet('devices'))} />
                <SettingsCategoryRow icon="bell-outline" title="Notifications" subtitle="Alerts and notification preferences" onPress={() => dispatch(setActiveSheet('notification-settings'))} />
                <SettingsCategoryRow icon="tune-variant" title="Preferences" subtitle="Appearance, units, and privacy" onPress={() => dispatch(setActiveSheet('preferences'))} />
                <SettingsCategoryRow icon="help-circle-outline" title="Support" subtitle="Help, contact, and app information" onPress={() => dispatch(setActiveSheet('support'))} />
                <SettingsCategoryRow icon="leaf-circle-outline" title="Explore Products" subtitle="Explore other products" onPress={() => { dispatch(setActiveSheet(null)); setActiveTab('explore'); }} />
                <SettingsCategoryRow icon="leaf-circle-outline" title="Sign Out" subtitle="Sign out of your account" onPress={handleSignOut} last />
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpace} />
        </ScrollView>
      )}

      {/* ── Account, device, and overflow sheets ───────────────────── */}
      <Modal
        animationType="slide"
        visible={activeSheet !== null && activeSheet !== 'menu' && activeSheet !== 'profile'}
        onRequestClose={() => dispatch(setActiveSheet(null))}
      >
        <View style={styles.fullPageContainer}>
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => {
              if (activeSheet === 'settings-main' || activeTab === 'settings') {
                dispatch(setActiveSheet(null));
              } else {
                dispatch(setActiveSheet('settings-main'));
              }
            }} style={styles.pageBackButton}>
              <MaterialCommunityIcons name="arrow-left" size={26} color={dashboardTheme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>{
               activeSheet === 'settings-main' ? 'Settings' :
               activeSheet === 'account' ? 'Account' :
               activeSheet === 'devices' ? 'Devices' :
               activeSheet === 'notification-settings' ? 'Notifications' :
               activeSheet === 'preferences' ? 'Preferences' :
               activeSheet === 'support' ? 'Support' :
               activeSheet === 'add-device' ? 'Add Device' :
               activeSheet === 'edit-device' ? 'Edit Device' :
               activeSheet === 'about' ? 'About' : 'Settings'
            }</Text>
            <View style={styles.pageHeaderPlaceholder} />
          </View>

          <ScrollView style={styles.pageContent} contentContainerStyle={styles.pageContentScroll} showsVerticalScrollIndicator={false}>
            {activeSheet === 'settings-main' && <>
              <View style={styles.settingsCard}>
                <SettingsCategoryRow icon="account-circle-outline" title="Account" subtitle="Profile and linked accounts" onPress={() => dispatch(setActiveSheet('account'))} />
                <SettingsCategoryRow icon="air-filter" title="Devices" subtitle="Manage your AirBuddi devices" onPress={() => dispatch(setActiveSheet('devices'))} />
                <SettingsCategoryRow icon="bell-outline" title="Notifications" subtitle="Alerts and notification preferences" onPress={() => dispatch(setActiveSheet('notification-settings'))} />
                <SettingsCategoryRow icon="tune-variant" title="Preferences" subtitle="Appearance, units, and privacy" onPress={() => dispatch(setActiveSheet('preferences'))} />
                <SettingsCategoryRow icon="help-circle-outline" title="Support" subtitle="Help, contact, and app information" onPress={() => dispatch(setActiveSheet('support'))} />
                <SettingsCategoryRow icon="leaf-circle-outline" title="Explore Products" subtitle="Explore other products" onPress={() => { dispatch(setActiveSheet(null)); setActiveTab('explore'); }} />
                <SettingsCategoryRow icon="logout" title="Sign Out" subtitle="Sign out of your account" onPress={handleSignOut} last />
              </View>
            </>}

            {activeSheet === 'account' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Account</Text>
                <Text style={styles.pageSectionSubtitle}>Manage your personal details and sign-in connections.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="account-circle-outline" title="Profile" subtitle={profileName || 'Add your name'} onPress={() => dispatch(setActiveSheet('profile'))} />
                <SettingsRow icon="link-variant" title="Linked Accounts" subtitle="Google, Apple" onPress={() => dispatch(setActiveSheet('linked-accounts'))} last />
              </View>
            </>}

            {activeSheet === 'devices' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Devices</Text>
                <Text style={styles.pageSectionSubtitle}>Manage the AirBuddi devices connected to your home.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="air-filter" title="My Devices" subtitle={devices.length > 0 ? `${devices.length} device${devices.length === 1 ? '' : 's'} added` : 'No device connected'} onPress={() => { dispatch(setActiveSheet(null)); setActiveTab('home'); }} />
                <SettingsRow icon="plus-circle-outline" title="Add New Device" subtitle="Pair a new AirBuddi" onPress={() => dispatch(setActiveSheet('add-device'))} last />
              </View>
            </>}

            {activeSheet === 'notification-settings' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Notifications</Text>
                <Text style={styles.pageSectionSubtitle}>Manage alerts and notification preferences.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="bell-outline" title="Notification Preferences" subtitle="Choose which alerts you receive" onPress={() => dispatch(setActiveSheet('notifications'))} />
                <SettingsRow icon="alert-circle-outline" title="Alert Thresholds" subtitle="Set AQI warning levels" onPress={() => dispatch(setActiveSheet('alert-thresholds'))} last />
              </View>
            </>}

            {activeSheet === 'preferences' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Preferences</Text>
                <Text style={styles.pageSectionSubtitle}>Personalize your AirBuddi experience.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="palette-outline" title="Appearance" subtitle={`Theme: ${themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}`} onPress={() => dispatch(setActiveSheet('appearance'))} />
                <SettingsRow icon="earth" title="Units & Region" subtitle={`${tempUnit === 'celsius' ? '°C' : '°F'} · ${aqiStandard === 'us' ? 'US EPA' : 'India NAQI'}`} onPress={() => dispatch(setActiveSheet('units'))} />
                <SettingsRow icon="shield-lock-outline" title="Data & Privacy" subtitle="Manage your data" onPress={() => dispatch(setActiveSheet('data-privacy'))} last />
              </View>
            </>}

            {activeSheet === 'support' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Support</Text>
                <Text style={styles.pageSectionSubtitle}>Find answers or get in touch with the AirBuddi team.</Text>
              </View>
              <View style={styles.settingsCard}>
                <SettingsRow icon="help-circle-outline" title="Help & Troubleshooting" subtitle="FAQs and setup guides" onPress={() => dispatch(setActiveSheet('help'))} />
                <SettingsRow icon="headphones" title="Contact Support" subtitle="Email, phone, or chat" onPress={() => dispatch(setActiveSheet('contact-support'))} />
                <SettingsRow icon="information-outline" title="About AirBuddi" subtitle="App version and legal" onPress={() => dispatch(setActiveSheet('about'))} last />
              </View>
            </>}

            {activeSheet === 'add-device' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Add a device</Text>
                <Text style={styles.pageSectionSubtitle}>Choose how you want to pair your AirBuddi device.</Text>
              </View>

              {/* Mode Switcher Tabs */}
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.modeToggleButton, addDeviceMode === 'qr' && styles.modeToggleButtonActive]}
                  onPress={() => { setAddDeviceMode('qr'); setAddDeviceError(''); }}
                >
                  <MaterialCommunityIcons name="qrcode-scan" size={18} color={addDeviceMode === 'qr' ? '#FFFFFF' : dashboardTheme.colors.textSecondary} />
                  <Text style={[styles.modeToggleText, addDeviceMode === 'qr' && styles.modeToggleTextActive]}>Scan QR Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.modeToggleButton, addDeviceMode === 'manual' && styles.modeToggleButtonActive]}
                  onPress={() => { setAddDeviceMode('manual'); setAddDeviceError(''); }}
                >
                  <MaterialCommunityIcons name="keyboard-outline" size={18} color={addDeviceMode === 'manual' ? '#FFFFFF' : dashboardTheme.colors.textSecondary} />
                  <Text style={[styles.modeToggleText, addDeviceMode === 'manual' && styles.modeToggleTextActive]}>Manual MAC</Text>
                </TouchableOpacity>
              </View>

              {addDeviceMode === 'qr' ? (
                <View style={styles.qrContainer}>
                  <View style={styles.qrFrame}>
                    <MaterialCommunityIcons name="qrcode" size={72} color={dashboardTheme.colors.primary} />
                    {isScanningQr && <View style={styles.qrLaser} />}
                  </View>
                  <Text style={styles.qrScanText}>Point camera at the QR code on device box or label</Text>

                  {newDeviceId ? (
                    <View style={styles.qrSuccessBadge}>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
                      <Text style={styles.qrSuccessBadgeText}>Scanned: {newDeviceId}</Text>
                    </View>
                  ) : null}
                  {scannedQrValue && !newDeviceId ? (
                    <Text style={styles.qrScanText}>Read: {scannedQrValue}</Text>
                  ) : null}

                  <View style={styles.qrActionsRow}>
                    <TouchableOpacity
                      style={[styles.qrScanBtn, isScanningQr && styles.qrScanBtnDisabled]}
                      disabled={isScanningQr}
                      onPress={handleScanQr}
                    >
                      <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
                      <Text style={styles.qrScanBtnText}>{isScanningQr ? 'Opening camera…' : newDeviceId ? 'Recapture Camera' : 'Open Camera'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.qrScanSecondaryBtn, isScanningQr && styles.qrScanBtnDisabled]}
                      disabled={isScanningQr}
                      onPress={handlePickQrFromLibrary}
                    >
                      <MaterialCommunityIcons name="image-outline" size={18} color={dashboardTheme.colors.primaryDark} />
                      <Text style={styles.qrScanSecondaryBtnText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.inputLabel}>DEVICE ID (MAC ADDRESS)</Text>
                  <TextInput
                    value={newDeviceId}
                    onChangeText={value => { setNewDeviceId(value); setAddDeviceError(''); }}
                    style={styles.textInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="e.g. F4:65:0B:49:12:60"
                    placeholderTextColor={dashboardTheme.colors.textMuted}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>DEVICE NAME</Text>
              <TextInput value={newDeviceName} onChangeText={setNewDeviceName} style={styles.textInput} placeholder="e.g. AirBuddi Mini" placeholderTextColor={dashboardTheme.colors.textMuted} />

              <Text style={styles.inputLabel}>ROOM OR SPACE</Text>
              <TextInput value={newDeviceRoom} onChangeText={setNewDeviceRoom} style={styles.textInput} placeholder="e.g. Bedroom" placeholderTextColor={dashboardTheme.colors.textMuted} />

              {!!addDeviceError && <Text style={styles.inputError}>{addDeviceError}</Text>}

              <TouchableOpacity
                style={[styles.primarySheetButtonRefined, (isAddingDevice || !newDeviceId) && styles.primarySheetButtonDisabled]}
                disabled={isAddingDevice || !newDeviceId}
                onPress={addDevice}
              >
                <Text style={styles.primarySheetButtonText}>{isAddingDevice ? 'Connecting…' : 'Add device'}</Text>
              </TouchableOpacity>
            </>}
            {activeSheet === 'edit-device' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Edit device</Text>
                <Text style={styles.pageSectionSubtitle}>Update the display details for this device. The MAC address stays the same.</Text>
              </View>
              <Text style={styles.inputLabel}>DEVICE MAC ADDRESS</Text>
              <View style={styles.readOnlyDeviceId}>
                <MaterialCommunityIcons name="bluetooth-connect" size={18} color={dashboardTheme.colors.textSecondary} />
                <Text style={styles.readOnlyDeviceIdText}>{editingDeviceId}</Text>
              </View>
              <Text style={styles.inputLabel}>DEVICE NAME</Text>
              <TextInput value={editingDeviceName} onChangeText={value => { setEditingDeviceName(value); setEditDeviceError(''); }} style={styles.textInput} placeholder="e.g. AirBuddi Mini" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <Text style={styles.inputLabel}>ROOM OR SPACE</Text>
              <TextInput value={editingDeviceRoom} onChangeText={value => { setEditingDeviceRoom(value); setEditDeviceError(''); }} style={styles.textInput} placeholder="e.g. Bedroom" placeholderTextColor={dashboardTheme.colors.textMuted} />
              {!!editDeviceError && <Text style={styles.inputError}>{editDeviceError}</Text>}
              <TouchableOpacity style={styles.primarySheetButtonRefined} onPress={saveEditedDevice}><Text style={styles.primarySheetButtonText}>Save device</Text></TouchableOpacity>
              <TouchableOpacity style={styles.ghostSheetButton} onPress={removeEditedDevice}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                <Text style={[styles.ghostSheetButtonText, { color: '#DC2626' }]}>Remove device</Text>
              </TouchableOpacity>
            </>}

            {activeSheet === 'about' && <>
              <View style={styles.aboutHero}>
                <View style={styles.aboutIcon}><MaterialCommunityIcons name="leaf" size={34} color="#FFFFFF" /></View>
                <Text style={styles.pageSectionTitle}>About AirBuddi</Text>
              </View>
              <Text style={styles.aboutCopy}>AirBuddi helps you understand and improve the air in every room you call home. Monitor your devices, manage comfort settings, and stay connected to healthier spaces.</Text>
              <Text style={styles.aboutVersion}>AirBuddi app · Version 1.0</Text>
            </>}

            {/* ── Linked Accounts ─────────────────────────────────── */}
            {activeSheet === 'linked-accounts' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Linked Accounts</Text>
                <Text style={styles.pageSectionSubtitle}>Connect third-party accounts for faster sign-in.</Text>
              </View>
              <View style={styles.contactOption}>
                <View style={styles.contactIconWrap}><MaterialCommunityIcons name="google" size={22} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.contactInfo}><Text style={styles.contactLabel}>Google</Text><Text style={styles.contactSub}>Coming soon</Text></View>
              </View>
              <View style={[styles.contactOption, styles.contactOptionLast]}>
                <View style={styles.contactIconWrap}><MaterialCommunityIcons name="apple" size={22} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.contactInfo}><Text style={styles.contactLabel}>Apple</Text><Text style={styles.contactSub}>Coming soon</Text></View>
              </View>
            </>}

            {/* ── Notifications ───────────────────────────────────── */}
            {activeSheet === 'notifications' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Alert Preferences</Text>
                <Text style={styles.pageSectionSubtitle}>Choose which alerts you'd like to receive.</Text>
              </View>
              <View style={styles.settingsToggleRow}>
                <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>Push Notifications</Text><Text style={styles.settingsToggleSublabel}>Enable all notifications</Text></View>
                <Switch value={notifPush} onValueChange={v => dispatch(setNotifications({ push: v }))} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={notifPush ? '#22C55E' : '#F4F4F4'} />
              </View>
              <View style={styles.settingsToggleRow}>
                <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>AQI Alerts</Text><Text style={styles.settingsToggleSublabel}>Warn when air quality drops</Text></View>
                <Switch value={notifAqiAlerts} onValueChange={v => dispatch(setNotifications({ aqiAlerts: v }))} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={notifAqiAlerts ? '#22C55E' : '#F4F4F4'} />
              </View>
              <View style={styles.settingsToggleRow}>
                <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>Device Offline</Text><Text style={styles.settingsToggleSublabel}>Alert when device goes offline</Text></View>
                <Switch value={notifDeviceOffline} onValueChange={v => dispatch(setNotifications({ deviceOffline: v }))} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={notifDeviceOffline ? '#22C55E' : '#F4F4F4'} />
              </View>
              <View style={[styles.settingsToggleRow, styles.settingsToggleRowLast]}>
                <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>Filter Replacement</Text><Text style={styles.settingsToggleSublabel}>Remind when filter needs replacing</Text></View>
                <Switch value={notifFilterReminder} onValueChange={v => dispatch(setNotifications({ filterReminder: v }))} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={notifFilterReminder ? '#22C55E' : '#F4F4F4'} />
              </View>
            </>}

            {/* ── Alert Thresholds ────────────────────────────────── */}
            {activeSheet === 'alert-thresholds' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Alert Thresholds</Text>
                <Text style={styles.pageSectionSubtitle}>Set the AQI levels at which you want to be alerted.</Text>
              </View>
              <Text style={styles.inputLabel}>WARNING LEVEL (AQI)</Text>
              <TextInput value={aqiWarningThreshold} onChangeText={v => dispatch(setPreferences({ aqiWarningThreshold: v }))} style={styles.textInput} keyboardType="numeric" placeholder="100" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <Text style={styles.inputLabel}>DANGER LEVEL (AQI)</Text>
              <TextInput value={aqiDangerThreshold} onChangeText={v => dispatch(setPreferences({ aqiDangerThreshold: v }))} style={styles.textInput} keyboardType="numeric" placeholder="200" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <TouchableOpacity style={styles.primarySheetButtonRefined} onPress={() => dispatch(setActiveSheet(null))}><Text style={styles.primarySheetButtonText}>Save Thresholds</Text></TouchableOpacity>
            </>}

            {/* ── Appearance ──────────────────────────────────────── */}
            {activeSheet === 'appearance' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Appearance</Text>
                <Text style={styles.pageSectionSubtitle}>Customize how AirBuddi looks.</Text>
              </View>
              <Text style={styles.inputLabel}>THEME</Text>
              <View style={styles.optionRow}>
                {(['light', 'dark', 'system'] as const).map(opt => (
                  <TouchableOpacity key={opt} style={[styles.optionChip, themePreference === opt && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ theme: opt }))}>
                    <Text style={[styles.optionChipText, themePreference === opt && styles.optionChipTextActive]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>}

            {/* ── Units & Region ──────────────────────────────────── */}
            {activeSheet === 'units' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Units & Region</Text>
                <Text style={styles.pageSectionSubtitle}>Choose your preferred measurement units.</Text>
              </View>
              <Text style={styles.inputLabel}>TEMPERATURE</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity style={[styles.optionChip, tempUnit === 'celsius' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ tempUnit: 'celsius' }))}><Text style={[styles.optionChipText, tempUnit === 'celsius' && styles.optionChipTextActive]}>°C Celsius</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, tempUnit === 'fahrenheit' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ tempUnit: 'fahrenheit' }))}><Text style={[styles.optionChipText, tempUnit === 'fahrenheit' && styles.optionChipTextActive]}>°F Fahrenheit</Text></TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>AQI STANDARD</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity style={[styles.optionChip, aqiStandard === 'us' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ aqiStandard: 'us' }))}><Text style={[styles.optionChipText, aqiStandard === 'us' && styles.optionChipTextActive]}>US EPA</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, aqiStandard === 'india' && styles.optionChipActive]} onPress={() => dispatch(setPreferences({ aqiStandard: 'india' }))}><Text style={[styles.optionChipText, aqiStandard === 'india' && styles.optionChipTextActive]}>India NAQI</Text></TouchableOpacity>
              </View>
            </>}

            {/* ── Data & Privacy ──────────────────────────────────── */}
            {activeSheet === 'data-privacy' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Data & Privacy</Text>
                <Text style={styles.pageSectionSubtitle}>Manage your local app data.</Text>
              </View>
              <Text style={styles.aboutCopy}>Your data stays on your device. AirBuddi connects to your purifier locally and doesn't share personal information with third parties.</Text>
              <TouchableOpacity style={styles.primarySheetButtonRefined} onPress={async () => {
                try {
                  await AsyncStorage.multiRemove([
                    PROFILE_STORAGE_KEY,
                    DEVICES_STORAGE_KEY,
                    NOTIFICATIONS_STORAGE_KEY,
                    PREFERENCES_STORAGE_KEY
                  ]);
                  dispatch(resetSettings());
                  setDevices([]);
                  Alert.alert('Cache Cleared', 'Local app cache has been cleared successfully.');
                } catch (e) {
                  console.error('[AirBuddi] Failed to clear cache:', e);
                }
              }}><Text style={styles.primarySheetButtonText}>Clear App Cache</Text></TouchableOpacity>
              <TouchableOpacity style={styles.ghostSheetButton} onPress={() => Alert.alert('Delete Account', 'This feature is not available in demo mode.', [{ text: 'OK' }])}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                <Text style={[styles.ghostSheetButtonText, { color: '#DC2626' }]}>Delete Account</Text>
              </TouchableOpacity>
            </>}

            {/* ── Help & Troubleshooting ──────────────────────────── */}
            {activeSheet === 'help' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Help Center</Text>
                <Text style={styles.pageSectionSubtitle}>Find answers to common questions.</Text>
              </View>
              {[
                { q: 'How do I add a device?', a: 'Go to the Home tab and tap "Add a device." Enter your AirBuddi\'s MAC address found on the device label.' },
                { q: 'My device shows as offline', a: 'Make sure your AirBuddi is powered on and connected to Wi-Fi. Try pulling down to refresh the device list.' },
                { q: 'How do I reset my device?', a: 'Press and hold the reset button on the back of your AirBuddi for 10 seconds until the LED flashes rapidly.' },
                { q: 'Can I control multiple devices?', a: 'Yes! Add multiple devices from the Home tab. Tap any device card to select and control it.' },
                { q: 'How accurate are the sensors?', a: 'AirBuddi uses industrial-grade PM2.5, temperature, and humidity sensors with ±5% accuracy.' },
              ].map((faq, index, arr) => (
                <TouchableOpacity key={index} style={[styles.faqItem, index === arr.length - 1 && styles.faqItemLast]} activeOpacity={0.7} onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                  <View style={styles.faqQuestion}>
                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                    <MaterialCommunityIcons name={expandedFaq === index ? 'chevron-up' : 'chevron-down'} size={22} color={dashboardTheme.colors.textMuted} />
                  </View>
                  {expandedFaq === index && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                </TouchableOpacity>
              ))}
            </>}

            {/* ── Contact Support ─────────────────────────────────── */}
            {activeSheet === 'contact-support' && <>
              <View style={styles.pageIntroSection}>
                <Text style={styles.pageSectionTitle}>Contact Us</Text>
                <Text style={styles.pageSectionSubtitle}>We're here to help. Reach us through any channel.</Text>
              </View>
              <TouchableOpacity style={styles.contactOption} activeOpacity={0.7} onPress={() => Linking.openURL('mailto:support@greenverse.in')}>
                <View style={styles.contactIconWrap}><MaterialCommunityIcons name="email-outline" size={22} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.contactInfo}><Text style={styles.contactLabel}>Email</Text><Text style={styles.contactSub}>support@greenverse.in</Text></View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactOption} activeOpacity={0.7} onPress={() => Linking.openURL('tel:+911234567890')}>
                <View style={styles.contactIconWrap}><MaterialCommunityIcons name="phone-outline" size={22} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.contactInfo}><Text style={styles.contactLabel}>Phone</Text><Text style={styles.contactSub}>+91 12345 67890</Text></View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactOption, styles.contactOptionLast]} activeOpacity={0.7} onPress={() => Alert.alert('Live Chat', 'Live chat is not available in demo mode.')}>
                <View style={styles.contactIconWrap}><MaterialCommunityIcons name="chat-outline" size={22} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.contactInfo}><Text style={styles.contactLabel}>Live Chat</Text><Text style={styles.contactSub}>Available 9 AM – 6 PM IST</Text></View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
              </TouchableOpacity>
            </>}
            <View style={styles.bottomSpaceLarge} />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={activeSheet === 'profile'}
        onRequestClose={() => dispatch(setActiveSheet(null))}
      >
        <View style={styles.fullPageContainer}>
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => dispatch(setActiveSheet(null))} style={styles.pageBackButton}>
              <MaterialCommunityIcons name="arrow-left" size={26} color={dashboardTheme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Profile</Text>
            <View style={styles.pageHeaderPlaceholder} />
          </View>

          <ScrollView style={styles.pageContent} contentContainerStyle={styles.pageContentScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.pageIntroSection}>
              <Text style={styles.pageSectionTitle}>Personal Info</Text>
              <Text style={styles.pageSectionSubtitle}>Update your photo and personal details here.</Text>
            </View>

            <TouchableOpacity style={styles.profileIdentityFull} activeOpacity={0.8} onPress={pickProfileImage}>
              <View style={styles.premiumAvatarContainerLarge}>
                <View style={styles.avatarGlowLarge} />
                <View style={styles.profileAvatarLarge}>
                  {profileAvatarUri ? (
                    <Image source={{ uri: profileAvatarUri }} style={styles.profileAvatarPhotoLarge} />
                  ) : (
                    <Text style={styles.profileAvatarTextLarge}>{getInitials(profileName)}</Text>
                  )}
                </View>
                <View style={styles.cameraBadgeLarge}>
                  <MaterialCommunityIcons name="camera" size={16} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.profileNameFull}>{profileName || 'Add your name'}</Text>
              <Text style={styles.profileActionLinkFull}>Change profile photo</Text>
            </TouchableOpacity>

            <View style={styles.formSectionCardRefined}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelRefined}>DISPLAY NAME</Text>
                <View style={styles.inputWithIconRefined}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={dashboardTheme.colors.primaryDark} style={styles.inputIcon} />
                  <TextInput value={profileName} onChangeText={value => { dispatch(setProfile({ name: value })); setProfileNameError(''); }} style={styles.textInputWithIcon} placeholder="Your name" placeholderTextColor={dashboardTheme.colors.textMuted} />
                </View>
                {!!profileNameError && <Text style={styles.inputError}>{profileNameError}</Text>}

                <View style={styles.inputSpacer} />

                <Text style={styles.inputLabelRefined}>EMAIL ADDRESS</Text>
                <View style={styles.inputWithIconRefined}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={dashboardTheme.colors.primaryDark} style={styles.inputIcon} />
                  <TextInput value={profileEmail} onChangeText={value => { dispatch(setProfile({ email: value })); setProfileEmailError(''); }} style={styles.textInputWithIcon} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={dashboardTheme.colors.textMuted} />
                </View>
                {!!profileEmailError && <Text style={styles.inputError}>{profileEmailError}</Text>}

                <View style={styles.inputSpacer} />

                <Text style={styles.inputLabelRefined}>PHONE</Text>
                <View style={styles.inputWithIconRefined}>
                  <MaterialCommunityIcons name="phone-outline" size={18} color={dashboardTheme.colors.primaryDark} style={styles.inputIcon} />
                  <TextInput value={profilePhone} onChangeText={value => { dispatch(setProfile({ phone: value })); }} style={styles.textInputWithIcon} keyboardType="phone-pad" placeholder="+91..." placeholderTextColor={dashboardTheme.colors.textMuted} />
                </View>

                <View style={styles.inputSpacer} />

                <Text style={styles.inputLabelRefined}>LOCATION</Text>
                <View style={styles.inputWithIconRefined}>
                  <MaterialCommunityIcons name="map-marker-outline" size={18} color={dashboardTheme.colors.primaryDark} style={styles.inputIcon} />
                  <TextInput value={profileLocation} onChangeText={value => { dispatch(setProfile({ location: value })); }} style={styles.textInputWithIcon} placeholder="City, IN" placeholderTextColor={dashboardTheme.colors.textMuted} />
                </View>
              </View>
            </View>

            <TouchableOpacity style={[styles.primarySheetButtonRefined, isSavingProfile && styles.primarySheetButtonDisabled]} disabled={isSavingProfile} onPress={saveProfile}>
              <Text style={styles.primarySheetButtonText}>{isSavingProfile ? 'Saving…' : 'Save Changes'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostSheetButton} onPress={clearProfileData}>
              <MaterialCommunityIcons name="restore" size={18} color={dashboardTheme.colors.textMuted} />
              <Text style={styles.ghostSheetButtonText}>Reset to Default</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpaceLarge} />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={isQrScannerVisible}
        onRequestClose={() => {
          setIsQrScannerVisible(false);
          setIsScanningQr(false);
        }}
      >
        <View style={styles.qrScannerScreen}>
          <Camera
            style={StyleSheet.absoluteFill}
            cameraType={CameraType.Back}
            scanBarcode
            showFrame
            laserColor="#22C55E"
            frameColor="#FFFFFF"
            allowedBarcodeTypes={['qr']}
            onReadCode={(event: { nativeEvent: { codeStringValue: string } }) => applyScannedQrValue(event.nativeEvent.codeStringValue)}
            onError={(event: { nativeEvent: { errorMessage: string } }) => {
              setAddDeviceError(`Camera error: ${event.nativeEvent.errorMessage}`);
              setIsQrScannerVisible(false);
              setIsScanningQr(false);
            }}
          />
          <View style={styles.qrScannerOverlay}>
            <Text style={styles.qrScannerTitle}>Scan device QR code</Text>
            <Text style={styles.qrScannerHint}>Align the code inside the frame</Text>
            <TouchableOpacity
              style={styles.qrScannerCloseButton}
              onPress={() => {
                setIsQrScannerVisible(false);
                setIsScanningQr(false);
              }}
            >
              <Text style={styles.qrScannerCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 3-dot overflow dropdown ─────────────────────────────────── */}
      <Modal
        transparent
        animationType="fade"
        visible={activeSheet === 'menu'}
        onRequestClose={() => dispatch(setActiveSheet(null))}
      >
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => dispatch(setActiveSheet(null))}
        >
          <View style={styles.dropdownMenu}>
            <DropdownMenuItem icon="account-circle-outline" label="Profile" onPress={() => dispatch(setActiveSheet('profile'))} />
            <DropdownMenuItem icon="air-filter" label="My devices" onPress={() => { dispatch(setActiveSheet(null)); setActiveTab('home'); }} />
            <DropdownMenuItem icon="chart-line" label="Air quality monitor" onPress={() => { dispatch(setActiveSheet(null)); setActiveTab('monitor'); }} />
            <DropdownMenuItem icon="cog-outline" label="Settings" onPress={() => dispatch(setActiveSheet('settings-main'))} />
            {/* <DropdownMenuItem icon="information-outline" label="About us" onPress={() => dispatch(setActiveSheet('about'))} /> */}
            <DropdownMenuItem icon="logout" label="Sign out" onPress={() => { dispatch(setActiveSheet(null)); handleSignOut(); }} last />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Bottom Navigation Bar ────────────────────────────────────── */}
      <View style={styles.navBarWrapper}>
        <View style={styles.navBar}>
          {TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                style={styles.navItem}
                onPress={() => {
                  if (tab.id === 'explore') {
                    setActiveTab('explore');
                    return;
                  }

                  setActiveTab(tab.id);
                }}
              >
                <View style={[styles.navIconContainer, isActive && styles.navIconContainerActive]}>
                  <MaterialCommunityIcons
                    name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                    size={22}
                    color={isActive ? '#FFFFFF' : dashboardTheme.colors.textMuted}
                  />
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function SetupStep({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.setupStep}>
      <View style={styles.setupIconWrapper}>
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color={dashboardTheme.colors.primaryDark}
        />

        <View style={styles.setupNumber}>
          <Text style={styles.setupNumberText}>
            {number}
          </Text>
        </View>
      </View>

      <Text style={styles.setupTitle}>
        {title}
      </Text>

      <Text style={styles.setupDescription}>
        {description}
      </Text>
    </View>
  );
}

function SettingsRow({ icon, title, subtitle, onPress, last = false }: { icon: string; title: string; subtitle: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.settingsRow, last && styles.settingsRowLast]} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.settingsIcon}><MaterialCommunityIcons name={icon} size={20} color={dashboardTheme.colors.primaryDark} /></View>
      <View style={styles.settingsCopy}><Text style={styles.settingsTitle}>{title}</Text><Text style={styles.settingsSubtitle}>{subtitle}</Text></View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
    </TouchableOpacity>
  );
}

function SettingsCategoryRow({ icon, title, subtitle, onPress, last = false }: { icon: string; title: string; subtitle: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.settingsCategoryRow, last && styles.settingsRowLast]} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.settingsCategoryIcon}><MaterialCommunityIcons name={icon} size={22} color={dashboardTheme.colors.primaryDark} /></View>
      <View style={styles.settingsCopy}><Text style={styles.settingsCategoryTitle}>{title}</Text><Text style={styles.settingsSubtitle}>{subtitle}</Text></View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={dashboardTheme.colors.textMuted} />
    </TouchableOpacity>
  );
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function DropdownMenuItem({ icon, label, onPress, last = false }: { icon: string; label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.dropdownItem, !last && styles.dropdownItemBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={18} color={dashboardTheme.colors.primaryDark} />
      <Text style={styles.dropdownItemText}>{label}</Text>
    </TouchableOpacity>
  );
}



// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  bgContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: -1,
  },
  bgCirclePrimary: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: dashboardTheme.colors.primarySoft,
    opacity: 0.6,
  },
  bgCircleSecondary: {
    position: 'absolute',
    bottom: 120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(34, 197, 94, 0.04)',
  },
  flex: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 150
  },
  tabContent: {
    width: '100%',
  },
  exploreViewport: {
    flex: 1,
  },
  tabPad: {
    paddingHorizontal: 20,
  },
  gap: {
    marginTop: 16,
  },
  bottomSpace: {
    height: 32,
  },
  homeHeading: {
    marginTop: 4,
    marginBottom: 18,
  },

  homeHeadingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  homeHeadingText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    marginTop: 5,
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '500',
  },

  homeHeadingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    justifyContent: 'flex-end',
  },

  addDeviceHeaderButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    elevation: 2,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  addDeviceHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  refreshButton: {
    height: 44,
    width: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FBF7',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.20)',
  },

  refreshButtonText: {
    color: dashboardTheme.colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },

  addDeviceCardInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(22, 163, 74, 0.35)',
    backgroundColor: 'rgba(34, 197, 94, 0.04)',
    marginTop: 4,
  },

  addDeviceCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addDeviceCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.colors.primaryDark,
  },

  deviceGrid: { gap: 14 },
  homeDeviceCard: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 20,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.soft,
  },

  homeDeviceCardSelected: {
    borderColor: 'rgba(22, 163, 74, 0.35)',
    backgroundColor: dashboardTheme.colors.surfaceTint,
  },

  emptyDeviceState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 25,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5EDE7',
    ...dashboardTheme.shadows.soft,
  },

  connectionIconWrapper: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  connectionIconRingOuter: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.10)',
  },

  connectionIconRingInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EAF8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyDeviceTitle: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: 16,
  },

  emptyDeviceCopy: {
    marginTop: 9,
    color: dashboardTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 330,
  },

  emptyDeviceButton: {
    marginTop: 20,
    width: 200,
    height: 58,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    // backgroundColor: dashboardTheme.colors.primaryDark,
    // ...dashboardTheme.shadows.medium,
    backgroundColor:'#11833cff'
  },

  emptyDeviceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  macHintCard: {
    marginTop: 18,
    width: '100%',
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: '#F5F9F5',
    borderWidth: 1,
    borderColor: '#E5EDE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  macHintText: {
    flex: 1,
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  howItWorks: {
    width: '100%',
    marginTop: 28,
  },

  howItWorksTitle: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 20,
  },

  stepsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  setupStep: {
    flex: 1,
    alignItems: 'center',
  },

  setupIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF8ED',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  setupNumber: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: dashboardTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  setupNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  setupTitle: {
    marginTop: 12,
    color: dashboardTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  setupDescription: {
    marginTop: 5,
    color: dashboardTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 3,
  },

  stepConnector: {
    width: 28,
    borderTopWidth: 2,
    borderTopColor: '#D8E7DA',
    borderStyle: 'dotted',
    marginTop: 31,
  },

  logoImage:{
    width: 105,
    height: 205,
    resizeMode: 'contain',
    marginBottom:45,
  },
    ribbonBackground: {
      position: 'absolute',
      width: 280,
      height: 100,
      zIndex: 0,
    },

  connectionHelp: {
    alignSelf: 'flex-end',
    width: 105,
    height:30,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE9DF',
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    marginTop:20,
  },

  connectionHelpText: {
    flex: 1,
    marginBottom:4,
    marginLeft: 4,
    alignItems: 'flex-end',

  },

  connectionHelpTitle: {
    // color: dashboardTheme.colors.textPrimary,
    color: '#123fa0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  deviceIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: dashboardTheme.colors.primarySoft },
  deviceIconSelected: { backgroundColor: dashboardTheme.colors.primary },
  deviceCardContent: { flex: 1, minWidth: 0 },
  deviceRoom: { color: dashboardTheme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  deviceName: { marginTop: 2, color: dashboardTheme.colors.textSecondary, fontSize: 13, fontWeight: '500' },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  deviceStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: dashboardTheme.colors.success },
  deviceStatusOffline: { backgroundColor: dashboardTheme.colors.textMuted },
  deviceMetaText: { color: dashboardTheme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  editDeviceButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.surfaceSecondary },
  homeSummary: { marginTop: 16, flexDirection: 'row', gap: 12, padding: 16, borderRadius: dashboardTheme.radii.md, backgroundColor: dashboardTheme.colors.primarySoft },
  summaryText: { flex: 1 },
  summaryTitle: { color: dashboardTheme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  summaryCopy: { marginTop: 3, color: dashboardTheme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  settingsCard: {
  marginTop: 0,
  marginBottom: 10,
  borderRadius: 18,
  backgroundColor: dashboardTheme.colors.surface,
  borderWidth: 1,
  borderColor: dashboardTheme.colors.border,
  overflow: 'hidden',
  ...dashboardTheme.shadows.soft,},
  accountCard: {
  marginBottom: 10,
  borderRadius: 18,
  backgroundColor: dashboardTheme.colors.surface,
  borderWidth: 1,
  borderColor: dashboardTheme.colors.border,
  overflow: 'hidden',
  ...dashboardTheme.shadows.soft,
  },
  accountIdentity: {
  minHeight: 92,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 13,
  paddingHorizontal: 16,
  paddingVertical: 14,
  backgroundColor: dashboardTheme.colors.surfaceTint,
  borderBottomWidth: 1,
  borderBottomColor: dashboardTheme.colors.border,
  },
  accountAvatar: {
  width: 54,
  height: 54,
  borderRadius: 27,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: dashboardTheme.colors.primaryDark,
  overflow: 'hidden',
  },
  accountAvatarPhoto: { width: 54, height: 54 },
  accountAvatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  accountIdentityCopy: { flex: 1, minWidth: 0 },
  accountName: { color: dashboardTheme.colors.textPrimary, fontSize: 17, fontWeight: '800' },
  accountEmail: { marginTop: 4, color: dashboardTheme.colors.textSecondary, fontSize: 13, fontWeight: '500' },
  settingsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  minHeight: 76,
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: dashboardTheme.colors.border,},
  settingsRowLast: { borderBottomWidth: 0 },
  settingsCategoryRow: {
  minHeight: 82,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: dashboardTheme.colors.border,
  },
  settingsCategoryIcon: {
  width: 42,
  height: 42,
  borderRadius: 13,
  backgroundColor: dashboardTheme.colors.primarySoft,
  justifyContent: 'center',
  alignItems: 'center',
  },
  settingsCategoryTitle: {
  color: dashboardTheme.colors.textPrimary,
  fontSize: 16,
  fontWeight: '800',
  },
  settingsIcon: {
  width: 36,
  height: 36,
  borderRadius: 11,
  backgroundColor: dashboardTheme.colors.primarySoft,
  justifyContent: 'center',
  alignItems: 'center',},
  settingsCopy: { flex: 1 },
  settingsTitle: {
  color: dashboardTheme.colors.textPrimary,
  letterSpacing: -0.3,
  fontSize: 15,
  fontWeight: '800',},
settingsSubtitle: {
  color: dashboardTheme.colors.textMuted,
  fontSize: 13,
  marginTop: 3,
  fontWeight: '500',},
  settingsSectionLabel: {
  marginTop: 14,
  marginBottom: 8,
  paddingHorizontal: 4,
  color: dashboardTheme.colors.textMuted,
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 1,},

  // Bottom nav
  navBarWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.strong,
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIconContainer: {
    width: 42,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  navIconContainerActive: {
    backgroundColor: dashboardTheme.colors.primary,
    ...dashboardTheme.shadows.soft,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: dashboardTheme.colors.textMuted,
    marginTop: 3,
  },
  navLabelActive: {
    color: dashboardTheme.colors.primaryDark,
    fontWeight: '700',
  },

  // Profile sheet
  profileBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13, 40, 24, 0.55)',
  },
  profileSheet: {
    backgroundColor: dashboardTheme.colors.surface,
    borderTopLeftRadius: dashboardTheme.radii.xl,
    borderTopRightRadius: dashboardTheme.radii.xl,
    padding: 20,
    paddingBottom: 44,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: dashboardTheme.colors.border,
    marginBottom: 22,
  },
  sheetTitle: { color: dashboardTheme.colors.textPrimary, fontSize: 23, fontWeight: '800', letterSpacing: -0.3 },
  sheetIntro: { marginTop: 7, marginBottom: 22, color: dashboardTheme.colors.textSecondary, fontSize: 14, lineHeight: 20 },
  inputLabel: { color: dashboardTheme.colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 7, marginTop: 14 },
  textInput: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: dashboardTheme.colors.border, backgroundColor: dashboardTheme.colors.surfaceTint, paddingHorizontal: 13, color: dashboardTheme.colors.textPrimary, fontSize: 15 },
  readOnlyDeviceId: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: dashboardTheme.colors.border, backgroundColor: dashboardTheme.colors.surfaceTint, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  readOnlyDeviceIdText: { color: dashboardTheme.colors.textSecondary, fontSize: 15, fontWeight: '600', letterSpacing: 0.4 },
  inputError: { marginTop: 8, color: '#DC2626', fontSize: 13, fontWeight: '500' },
  primarySheetButton: { marginTop: 24, height: 50, borderRadius: 14, backgroundColor: dashboardTheme.colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  primarySheetButtonDisabled: { opacity: 0.6 },
  primarySheetButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  dangerSheetButton: { marginTop: 12, height: 50, borderRadius: 14, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  dangerSheetButtonText: { color: '#DC2626', fontWeight: '800', fontSize: 15 },
  profileIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 28,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.primarySoft,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: 36,
    height: 36,
  },
  profileAvatarPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  profileName: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  profileEmail: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  sheetLabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  profileAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  profileActionText: {
    flex: 1,
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  aboutIcon: { width: 62, height: 62, marginBottom: 16, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primaryDark },
  aboutCopy: { marginTop: 12, color: dashboardTheme.colors.textSecondary, fontSize: 14, lineHeight: 21 },
  aboutVersion: { marginTop: 18, color: dashboardTheme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  secondarySheetButton: { marginTop: 24, height: 48, borderRadius: 14, backgroundColor: dashboardTheme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  secondarySheetButtonText: { color: dashboardTheme.colors.primaryDark, fontWeight: '800', fontSize: 15 },

  // 3-dot dropdown
  dropdownBackdrop: { flex: 1 },
  dropdownMenu: {
    position: 'absolute',
    top: 64,
    right: 20,
    minWidth: 210,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.md,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    paddingVertical: 6,
    ...dashboardTheme.shadows.strong,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: dashboardTheme.colors.border },
  dropdownItemText: { color: dashboardTheme.colors.textPrimary, fontSize: 14, fontWeight: '600' },

  // ── Toggle Row Styles ─────────────────────────────────────────────────────
  settingsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  settingsToggleRowLast: { borderBottomWidth: 0 },
  toggleTextWrap: { flex: 1, marginRight: 12 },
  settingsToggleLabel: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  settingsToggleSublabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // ── Option Chip Styles ────────────────────────────────────────────────────
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: dashboardTheme.colors.border,
    backgroundColor: dashboardTheme.colors.surface,
  },
  optionChipActive: {
    borderColor: dashboardTheme.colors.primary,
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.colors.textSecondary,
  },
  optionChipTextActive: {
    color: dashboardTheme.colors.primaryDark,
    fontWeight: '700',
  },

  // ── FAQ Styles ────────────────────────────────────────────────────────────
  faqItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  faqItemLast: { borderBottomWidth: 0 },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
    marginRight: 8,
  },
  faqAnswer: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: dashboardTheme.colors.textSecondary,
  },

  // ── Contact Support Styles ────────────────────────────────────────────────
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  contactOptionLast: { borderBottomWidth: 0 },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1 },
  contactLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
  },
  contactSub: {
    fontSize: 12,
    color: dashboardTheme.colors.textMuted,
    marginTop: 2,
  },

  // ── Product Card Styles ───────────────────────────────────────────────────
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    marginBottom: 12,
  },
  productIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
  },
  productDesc: {
    fontSize: 13,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  productBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  productBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.colors.primaryDark,
  },

  // ── Add Device Mode & QR Styles ─────────────────────────────────────────
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modeToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  modeToggleButtonActive: {
    backgroundColor: dashboardTheme.colors.primary,
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.colors.textSecondary,
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  qrFrame: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: dashboardTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  qrLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 2,
    backgroundColor: '#EF4444',
  },
  qrScannerScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  qrScannerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    paddingTop: 72,
  },
  qrScannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  qrScannerHint: {
    color: '#E2E8F0',
    fontSize: 14,
    marginTop: 8,
  },
  qrScannerCloseButton: {
    position: 'absolute',
    bottom: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  qrScannerCloseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  qrScanText: {
    fontSize: 12,
    fontWeight: '500',
    color: dashboardTheme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  qrSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  qrSuccessBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  qrScanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  qrActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  qrScanSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E4F5E7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6EAD0',
  },
  qrScanSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.colors.primaryDark,
  },
  qrScanBtnDisabled: {
    opacity: 0.6,
  },
  qrScanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumAvatarContainer: { position: 'relative', width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: dashboardTheme.colors.primarySoft, opacity: 0.3 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: dashboardTheme.colors.primary, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, borderWidth: 1, borderColor: dashboardTheme.colors.border, backgroundColor: dashboardTheme.colors.surfaceTint, paddingHorizontal: 12, marginTop: 4 },
  inputIcon: { marginRight: 10 },
  textInputWithIcon: { flex: 1, color: dashboardTheme.colors.textPrimary, fontSize: 15, padding: 0 },
  inputRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  inputHalf: { flex: 1 },
  sheetHeaderWithAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  profileIdentityRefined: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, padding: 4 },
  profileIdentityText: { flex: 1 },
  profileNameLarge: { fontSize: 20, fontWeight: '800', color: dashboardTheme.colors.textPrimary, letterSpacing: -0.5 },
  profileActionLink: { fontSize: 13, fontWeight: '600', color: dashboardTheme.colors.primary, marginTop: 4 },
  formSectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', ...dashboardTheme.shadows.soft },
  sectionLabelRefined: { fontSize: 11, fontWeight: '800', color: dashboardTheme.colors.textMuted, letterSpacing: 1.2, marginBottom: 16 },
  inputGroup: { gap: 0 },
  inputLabelRefined: { fontSize: 10, fontWeight: '700', color: dashboardTheme.colors.textSecondary, letterSpacing: 0.5, marginBottom: 6 },
  inputWithIconRefined: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12, backgroundColor: '#F1F5F9', paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  inputSpacer: { height: 16 },
  primarySheetButtonRefined: { marginTop: 8, height: 54, borderRadius: 16, backgroundColor: dashboardTheme.colors.primaryDark, alignItems: 'center', justifyContent: 'center', shadowColor: dashboardTheme.colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  ghostSheetButton: { marginTop: 16, height: 50, borderRadius: 16, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  ghostSheetButtonText: { color: dashboardTheme.colors.textMuted, fontWeight: '700', fontSize: 14 },
  sheetScroll: { maxHeight: 500 },
  bottomSheetGap: { height: 20 },
  fullPageContainer: { flex: 1, backgroundColor: dashboardTheme.colors.background },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 16, backgroundColor: dashboardTheme.colors.surface, borderBottomWidth: 1, borderBottomColor: dashboardTheme.colors.border },
  pageBackButton: { padding: 8, marginLeft: -8 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: dashboardTheme.colors.textPrimary },
  pageHeaderPlaceholder: { width: 42 },
  pageContent: { flex: 1 },
  pageContentScroll: { padding: 20 },
  pageIntroSection: { marginBottom: 24 },
  pageSectionTitle: { fontSize: 24, fontWeight: '800', color: dashboardTheme.colors.textPrimary, letterSpacing: -0.5 },
  pageSectionSubtitle: { fontSize: 14, color: dashboardTheme.colors.textSecondary, marginTop: 4, fontWeight: '500' },
  profileIdentityFull: { alignItems: 'center', marginBottom: 32 },
  premiumAvatarContainerLarge: { position: 'relative', width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  avatarGlowLarge: { position: 'absolute', width: 116, height: 116, borderRadius: 58, backgroundColor: dashboardTheme.colors.primarySoft, opacity: 0.25 },
  profileAvatarLarge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primarySoft, overflow: 'hidden', borderWidth: 3, borderColor: '#FFFFFF' },
  profileAvatarPhotoLarge: { width: 100, height: 100, borderRadius: 50 },
  profileAvatarTextLarge: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  cameraBadgeLarge: { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: dashboardTheme.colors.primary, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...dashboardTheme.shadows.soft },
  profileNameFull: { fontSize: 22, fontWeight: '800', color: dashboardTheme.colors.textPrimary, marginTop: 16 },
  profileActionLinkFull: { fontSize: 14, fontWeight: '700', color: dashboardTheme.colors.primary, marginTop: 6 },
  formSectionCardRefined: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', ...dashboardTheme.shadows.soft },
  bottomSpaceLarge: { height: 60 },
  aboutHero: { alignItems: 'center', marginBottom: 24 },
  aboutIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primaryDark, marginBottom: 16 },
  aboutCopy: { fontSize: 14, color: dashboardTheme.colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  aboutVersion: { fontSize: 12, color: dashboardTheme.colors.textMuted, textAlign: 'center', fontWeight: '600' },
  contactOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  contactOptionLast: { marginBottom: 0 },
  contactIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: dashboardTheme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 15, fontWeight: '700', color: dashboardTheme.colors.textPrimary },
  contactSub: { fontSize: 12, color: dashboardTheme.colors.textMuted, marginTop: 2 },
  faqItem: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  faqItemLast: { marginBottom: 0 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestionText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.colors.textPrimary, flex: 1, marginRight: 8 },
  faqAnswer: { fontSize: 14, color: dashboardTheme.colors.textSecondary, marginTop: 12, lineHeight: 20 },
});