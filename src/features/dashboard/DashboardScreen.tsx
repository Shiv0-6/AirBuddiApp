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
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { dashboardTheme } from './dashboardTheme';
import { connectionLabels } from './dashboardMockData';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { AirQualityCard } from '../../components/dashboard/AirQualityCard';
import { SensorGrid } from '../../components/dashboard/SensorGrid';
import { QuickControls } from '../../components/dashboard/QuickControls';
import { ConnectionPill } from '../../components/dashboard/ConnectionPill';
import { LightControlPanel } from '../../components/dashboard/LightControlPanel';
import { RootPurificationCard } from '../../components/dashboard/RootPurificationCard';

import { useAppSelector } from '../../store/hooks';
import { selectDashboard } from './dashboardSelectors';
import type { DashboardRuntimeState } from './dashboardSlice';
import { useDashboardRealtimeBridge } from './useDashboardRealtimeBridge';
import { fetchLatestTelemetry } from '../../services/awsIot/awsTelemetryApiClient';

// ─── Bottom Tab Config ────────────────────────────────────────────────────────

type TabId = 'airquality' | 'fan' | 'light' | 'more';

type SheetId = 'profile' | 'add-device' | 'edit-device' | 'menu' | 'about' | 'linked-accounts' | 'notifications' | 'alert-thresholds' | 'appearance' | 'units' | 'data-privacy' | 'help' | 'contact-support' | 'explore-products' | null;
type HomeDevice = {
  id: string;
  name: string;
  room: string;
  status: 'Online' | 'Offline';
  aqi: number | null;
  icon: string;
};

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'fan', label: 'Home', icon: 'home-outline' },
  { id: 'airquality', label: 'Monitor', icon: 'chart-line' },
  { id: 'light', label: 'Control', icon: 'lightbulb-outline' },
  { id: 'more', label: 'Settings', icon: 'cog-outline' },
];

const PROFILE_STORAGE_KEY = '@airbuddi_profile';
const DEVICES_STORAGE_KEY = '@airbuddi_devices';
const NOTIFICATIONS_STORAGE_KEY = '@airbuddi_notifications';
const PREFERENCES_STORAGE_KEY = '@airbuddi_preferences';

// ─── Screen ───────────────────────────────────────────────────────────────────

export function DashboardScreen({ onSignOut }: { onSignOut: () => void }) {
  const dashboard = useAppSelector(selectDashboard) as DashboardRuntimeState;
  const device = dashboard.device;
  const sensors = dashboard.sensors ?? [];
  const pm25Value = sensors.find(s => s.id === 'pm2_5')?.value ?? null;

  const [activeTab, setActiveTab] = useState<TabId>('fan');
  const [refreshing, setRefreshing] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);

  // profile
  const [profileName, setProfileName] = useState('AirBuddi Member');
  const [profileEmail, setProfileEmail] = useState('member@airbuddi.app');
  const [profileAvatarUri, setProfileAvatarUri] = useState<string | null>(null);
  const [profileNameError, setProfileNameError] = useState('');
  const [profileEmailError, setProfileEmailError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  // Notification preferences
  const [notifPush, setNotifPush] = useState(true);
  const [notifAqiAlerts, setNotifAqiAlerts] = useState(true);
  const [notifDeviceOffline, setNotifDeviceOffline] = useState(true);
  const [notifFilterReminder, setNotifFilterReminder] = useState(true);

  // App preferences
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [aqiStandard, setAqiStandard] = useState<'us' | 'india'>('us');

  // Alert thresholds
  const [aqiWarningThreshold, setAqiWarningThreshold] = useState('100');
  const [aqiDangerThreshold, setAqiDangerThreshold] = useState('200');

  // FAQ expansion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const {
    setPowerState,
    setAutoMode,
    setSleepModeState,
    setUvcModeState,
    setFanSpeedState,
    setLightStateState,
    setUpperBedChamberStateState,
    setLowerBedChamberStateState,
    refreshData,
  } = useDashboardRealtimeBridge(selectedDeviceId);

  const lightZones = useMemo(
  () => [
  { id: 'zone-1', label: 'Ambient', icon: 'lamp', isOn: device?.lightZones?.['zone-1'] ?? false },
  { id: 'zone-2', label: 'Task', icon: 'desk-lamp', isOn: device?.lightZones?.['zone-2'] ?? false },
  { id: 'zone-3', label: 'Accent', icon: 'spotlight', isOn: device?.lightZones?.['zone-3'] ?? false },
  ],
    [device?.lightZones],
  );

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

        if (!stored) {
          return;
        }

        const parsed = JSON.parse(stored);

        if (parsed.name) {
          setProfileName(parsed.name);
        }

        if (parsed.email) {
          setProfileEmail(parsed.email);
        }

        if (parsed.avatarUri) {
          setProfileAvatarUri(parsed.avatarUri);
        }
      } catch (error) {
        console.error('[AirBuddi] Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

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
          const parsed = JSON.parse(notifStored);
          if (parsed.push !== undefined) { setNotifPush(parsed.push); }
          if (parsed.aqiAlerts !== undefined) { setNotifAqiAlerts(parsed.aqiAlerts); }
          if (parsed.deviceOffline !== undefined) { setNotifDeviceOffline(parsed.deviceOffline); }
          if (parsed.filterReminder !== undefined) { setNotifFilterReminder(parsed.filterReminder); }
        }
        if (prefStored) {
          const parsed = JSON.parse(prefStored);
          if (parsed.theme) { setThemePreference(parsed.theme); }
          if (parsed.tempUnit) { setTempUnit(parsed.tempUnit); }
          if (parsed.aqiStandard) { setAqiStandard(parsed.aqiStandard); }
          if (parsed.aqiWarning) { setAqiWarningThreshold(parsed.aqiWarning); }
          if (parsed.aqiDanger) { setAqiDangerThreshold(parsed.aqiDanger); }
        }
      } catch (error) {
        console.error('[AirBuddi] Failed to load preferences:', error);
      } finally {
        prefsLoadedRef.current = true;
      }
    };
    loadPrefs();
  }, []);

  // Auto-save notification preferences
  useEffect(() => {
    if (!prefsLoadedRef.current) { return; }
    AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify({
      push: notifPush,
      aqiAlerts: notifAqiAlerts,
      deviceOffline: notifDeviceOffline,
      filterReminder: notifFilterReminder,
    })).catch(e => console.error('[AirBuddi] Failed to save notification prefs:', e));
  }, [notifPush, notifAqiAlerts, notifDeviceOffline, notifFilterReminder]);

  // Auto-save app preferences
  useEffect(() => {
    if (!prefsLoadedRef.current) { return; }
    AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({
      theme: themePreference,
      tempUnit,
      aqiStandard,
      aqiWarning: aqiWarningThreshold,
      aqiDanger: aqiDangerThreshold,
    })).catch(e => console.error('[AirBuddi] Failed to save preferences:', e));
  }, [themePreference, tempUnit, aqiStandard, aqiWarningThreshold, aqiDangerThreshold]);

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
          setProfileAvatarUri(uri);
        }
      },
    );
  }, []);

  const saveProfile = useCallback(async () => {
    const name = profileName.trim();
    const email = profileEmail.trim();

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
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          name,
          email,
          avatarUri: profileAvatarUri,
        }),
      );

      setProfileName(name);
      setProfileEmail(email);
      setActiveSheet(null);
    } catch (error) {
      console.error('[AirBuddi] Failed to save profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  }, [profileName, profileEmail, profileAvatarUri]);

  const clearProfileData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (error) {
      console.error('[AirBuddi] Failed to clear profile:', error);
    }
    setProfileName('AirBuddi Member');
    setProfileEmail('member@airbuddi.app');
    setProfileAvatarUri(null);
    setProfileNameError('');
    setProfileEmailError('');
  }, []);

  const handleSignOut = useCallback(() => {
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

  const handleSelectFanSpeed = useCallback((speed: '1' | '2' | '3' | 'turbo') => {
    setFanSpeedState(speed);
  }, [setFanSpeedState]);

  const handleToggleLightZone = useCallback((zoneId: string) => {
    const nextState = !(device?.lightZones?.[zoneId] ?? false);
    setLightStateState(zoneId, nextState);
  }, [device?.lightZones, setLightStateState]);

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
        name: telemetry.esp32?.deviceName || name,
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
      setActiveSheet(null);
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
    setActiveSheet('edit-device');
  }, []);
  const saveEditedDevice = useCallback(() => {
    const name = editingDeviceName.trim();
    const room = editingDeviceRoom.trim();

    if (!editingDeviceId) {
      setActiveSheet(null);
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
    setActiveSheet(null);
  }, [editingDeviceId, editingDeviceName, editingDeviceRoom]);

  const removeEditedDevice = useCallback(() => {
    if (!editingDeviceId) {
      setActiveSheet(null);
      return;
    }

    setDevices(current => current.filter(item => item.id !== editingDeviceId));
    setEditingDeviceId(null);
    setEditingDeviceName('');
    setEditingDeviceRoom('');
    setEditDeviceError('');
    setActiveSheet(null);
  }, [editingDeviceId]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.safeArea}>
      {/* Subtle background decor */}
      <View pointerEvents="none" style={styles.bgContainer}>
        <View style={styles.bgCirclePrimary} />
        <View style={styles.bgCircleSecondary} />
      </View>

      <DashboardHeader
        title={deviceTitle}
        subtitle={`${displayDeviceName} · ${selectedDevice?.status ?? 'Offline'}`}
        showDeviceInfo={activeTab !== 'more'}
        onProfilePress={() => setActiveSheet('profile')}
        onRefreshPress={handleRefresh}
        onMenuPress={() => setActiveSheet('menu')}
/>
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
        {activeTab === 'fan' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
            <View style={styles.homeHeading}>
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

              <View style={styles.homeHeadingActions}>
                <TouchableOpacity
                  accessibilityLabel="Refresh devices"
                  style={styles.refreshButton}
                  activeOpacity={0.8}
                  onPress={handleRefresh}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={19}
                    color={dashboardTheme.colors.primaryDark}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityLabel="Add device"
                  style={styles.addDeviceHeaderButton}
                  activeOpacity={0.8}
                  onPress={() => setActiveSheet('add-device')}
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
              </View>
            </View>
              <View style={styles.deviceGrid}>
                {devices.length === 0 ? (
                  <TouchableOpacity
                  style={styles.emptyDeviceState}
                  activeOpacity={0.9}
                  onPress={() => setActiveSheet('add-device')}
                >
                  {/* Connection icon */}
                  <View style={styles.connectionIconWrapper}>
                    <View style={styles.connectionIconRingOuter} />

                    <View style={styles.connectionIconRingInner}>
                      <MaterialCommunityIcons
                        name="help"
                        size={30}
                        color={dashboardTheme.colors.primaryDark}
                      />
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={styles.emptyDeviceTitle}>
                    Connect your AirBuddi
                  </Text>

                  {/* Description */}
                  <Text style={styles.emptyDeviceCopy}>
                    Add a device to monitor your air quality and
                    control your space.
                  </Text>

                  {/* Add device button */}
                  <View style={styles.emptyDeviceButton}>
                    <MaterialCommunityIcons
                      name="plus"
                      size={22}
                      color="#FFFFFF"
                    />

                    <Text style={styles.emptyDeviceButtonText}>
                      Add a device
                    </Text>
                  </View>

                  {/* MAC address information */}
                  <View style={styles.macHintCard}>
                    <MaterialCommunityIcons
                      name="shield-check-outline"
                      size={20}
                      color={dashboardTheme.colors.primary}
                    />

                    <Text style={styles.macHintText}>
                      You'll need your device's MAC address
                    </Text>
                  </View>

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
                        description="Enter your device MAC address"
                      />

                      <View style={styles.stepConnector} />

                      <SetupStep
                        number="2"
                        icon="wifi"
                        title="Connect"
                        description="Your device connects via Wi-Fi"
                      />

                      <View style={styles.stepConnector} />

                      <SetupStep
                        number="3"
                        icon="chart-bar"
                        title="Monitor"
                        description="View real-time air quality"
                      />

                    </View>
                  </View>

                  {/* Help */}
                  <TouchableOpacity
                    style={styles.connectionHelp}
                    activeOpacity={0.8}
                    onPress={() => setActiveSheet('about')}
                  >
                    <View style={styles.connectionHelpIcon}>
                      <MaterialCommunityIcons
                        name="leaf"
                        size={22}
                        color={dashboardTheme.colors.primaryDark}
                      />
                    </View>

                    <View style={styles.connectionHelpText}>
                      <Text style={styles.connectionHelpTitle}>
                        Need help connecting?
                      </Text>

                      <Text style={styles.connectionHelpSubtitle}>
                        View our quick guide
                      </Text>
                    </View>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={26}
                      color={dashboardTheme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
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
        {activeTab === 'airquality' && (
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
        {activeTab === 'light' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <QuickControls
              isPoweredOn={device?.power === 'on'}
              isAutoMode={device?.mode === 'auto'}
              isSleepMode={device?.sleepMode ?? false}
              isUvc={device?.uvc ?? true}
              fanSpeed={device?.fanSpeed}
              onTogglePower={handleTogglePower}
              onToggleAutoMode={handleToggleAutoMode}
              onToggleSleepMode={handleToggleSleepMode}
              onToggleUvc={handleToggleUvc}
              onSelectFanSpeed={handleSelectFanSpeed}
            />
            <View style={styles.tabPad}>
              <RootPurificationCard
                upperBedChamber={device?.upperBedChamber ?? 'Active'}
                lowerBedChamber={device?.lowerBedChamber ?? 'Standby'}
                onUpperPress={() => {
                  const currentVal = device?.upperBedChamber ?? 'Active';
                  setUpperBedChamberStateState(currentVal === 'Active' ? 'Standby' : 'Active');
                }}
                onLowerPress={() => {
                  const currentVal = device?.lowerBedChamber ?? 'Standby';
                  setLowerBedChamberStateState(currentVal === 'Active' ? 'Standby' : 'Active');
                }}
                disabled={device?.power !== 'on'}
              />
              <LightControlPanel
                lights={lightZones}
                onToggleLight={handleToggleLightZone}
                disabled={device?.power !== 'on'}
              />
            </View>
          </Animated.View>
        )}

        {/* ── Settings Tab ──────────────────────────────────────────── */}
        {activeTab === 'more' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your account and AirBuddi home.
              </Text>

              <Text style={styles.settingsSectionLabel}>ACCOUNT</Text>
              <View style={styles.settingsCard}>
                <SettingsRow icon="account-circle-outline" title="Profile" subtitle={profileName} onPress={() => setActiveSheet('profile')} />
                <SettingsRow icon="link-variant" title="Linked Accounts" subtitle="Google, Apple" onPress={() => setActiveSheet('linked-accounts')} last />
              </View>

              <Text style={styles.settingsSectionLabel}>DEVICES</Text>
              <View style={styles.settingsCard}>
                <SettingsRow icon="air-filter" title="My Devices" subtitle={devices.length > 0 ? `${devices.length} device${devices.length === 1 ? '' : 's'} added` : 'No device connected'} onPress={() => setActiveTab('fan')} />
                <SettingsRow icon="plus-circle-outline" title="Add New Device" subtitle="Pair a new AirBuddi" onPress={() => setActiveSheet('add-device')} last />
              </View>

              <Text style={styles.settingsSectionLabel}>NOTIFICATIONS</Text>
              <View style={styles.settingsCard}>
                <SettingsRow icon="bell-outline" title="Push Notifications" subtitle="AQI alerts & reminders" onPress={() => setActiveSheet('notifications')} />
                <SettingsRow icon="alert-circle-outline" title="Alert Thresholds" subtitle="Set AQI warning levels" onPress={() => setActiveSheet('alert-thresholds')} last />
              </View>

              <Text style={styles.settingsSectionLabel}>PREFERENCES</Text>
              <View style={styles.settingsCard}>
                <SettingsRow icon="palette-outline" title="Appearance" subtitle={`Theme: ${themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}`} onPress={() => setActiveSheet('appearance')} />
                <SettingsRow icon="earth" title="Units & Region" subtitle={`${tempUnit === 'celsius' ? '°C' : '°F'} · ${aqiStandard === 'us' ? 'US EPA' : 'India NAQI'}`} onPress={() => setActiveSheet('units')} />
                <SettingsRow icon="shield-lock-outline" title="Data & Privacy" subtitle="Manage your data" onPress={() => setActiveSheet('data-privacy')} last />
              </View>

              <Text style={styles.settingsSectionLabel}>SUPPORT</Text>
              <View style={styles.settingsCard}>
                <SettingsRow icon="help-circle-outline" title="Help & Troubleshooting" subtitle="FAQs & guides" onPress={() => setActiveSheet('help')} />
                <SettingsRow icon="headphones" title="Contact Support" subtitle="Email, phone, or chat" onPress={() => setActiveSheet('contact-support')} />
                <SettingsRow icon="information-outline" title="About AirBuddi" subtitle="App version & legal" onPress={() => setActiveSheet('about')} last />
              </View>

              <Text style={styles.settingsSectionLabel}>MORE</Text>
              <View style={styles.settingsCard}>
                <SettingsRow icon="leaf-circle-outline" title="Explore Other Products" subtitle="Discover GreenVerse devices" onPress={() => setActiveSheet('explore-products')} />
                <SettingsRow icon="logout" title="Sign Out" subtitle="Sign out of your account" onPress={handleSignOut} last />
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ── Account, device, and overflow sheets ───────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={activeSheet !== null && activeSheet !== 'menu'}
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.profileBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActiveSheet(null)}
          />
          <View style={styles.profileSheet}>
            <View style={styles.sheetHandle} />
            {activeSheet === 'profile' && <>
              <Text style={styles.sheetTitle}>Your profile</Text>
              <Text style={styles.sheetIntro}>Keep your account details up to date.</Text>

              <TouchableOpacity style={styles.profileIdentity} activeOpacity={0.8} onPress={pickProfileImage}>
                <View style={styles.profileAvatar}>
                  {profileAvatarUri ? (
                    <Image source={{ uri: profileAvatarUri }} style={styles.profileAvatarPhoto} />
                  ) : (
                    <Text style={styles.profileAvatarText}>{getInitials(profileName)}</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.profileName}>{profileName || 'Add your name'}</Text>
                  <Text style={styles.profileEmail}>Tap to change photo</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>DISPLAY NAME</Text>
              <TextInput value={profileName} onChangeText={value => { setProfileName(value); setProfileNameError(''); }} style={styles.textInput} placeholder="Your name" placeholderTextColor={dashboardTheme.colors.textMuted} />
              {!!profileNameError && <Text style={styles.inputError}>{profileNameError}</Text>}

              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput value={profileEmail} onChangeText={value => { setProfileEmail(value); setProfileEmailError(''); }} style={styles.textInput} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={dashboardTheme.colors.textMuted} />
              {!!profileEmailError && <Text style={styles.inputError}>{profileEmailError}</Text>}

              <TouchableOpacity style={[styles.primarySheetButton, isSavingProfile && styles.primarySheetButtonDisabled]} disabled={isSavingProfile} onPress={saveProfile}>
                <Text style={styles.primarySheetButtonText}>{isSavingProfile ? 'Saving…' : 'Save profile'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerSheetButton} onPress={clearProfileData}>
                <MaterialCommunityIcons name="restore" size={18} color="#DC2626" />
                <Text style={styles.dangerSheetButtonText}>Reset profile to default</Text>
              </TouchableOpacity>
            </>}

            {activeSheet === 'add-device' && <>
              <Text style={styles.sheetTitle}>Add a device</Text>
              <Text style={styles.sheetIntro}>Enter the device MAC address. AirBuddi will use it to fetch this device's live data.</Text>
              <Text style={styles.inputLabel}>DEVICE ID (MAC ADDRESS)</Text>
              <TextInput value={newDeviceId} onChangeText={value => { setNewDeviceId(value); setAddDeviceError(''); }} style={styles.textInput} autoCapitalize="characters" autoCorrect={false} placeholder="e.g. F4:65:0B:49:12:60" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <Text style={styles.inputLabel}>DEVICE NAME</Text>
              <TextInput value={newDeviceName} onChangeText={setNewDeviceName} style={styles.textInput} placeholder="e.g. AirBuddi Mini" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <Text style={styles.inputLabel}>ROOM OR SPACE</Text>
              <TextInput value={newDeviceRoom} onChangeText={setNewDeviceRoom} style={styles.textInput} placeholder="e.g. Bedroom" placeholderTextColor={dashboardTheme.colors.textMuted} />
              {!!addDeviceError && <Text style={styles.inputError}>{addDeviceError}</Text>}
              <TouchableOpacity style={[styles.primarySheetButton, isAddingDevice && styles.primarySheetButtonDisabled]} disabled={isAddingDevice} onPress={addDevice}><Text style={styles.primarySheetButtonText}>{isAddingDevice ? 'Connecting…' : 'Add device'}</Text></TouchableOpacity>
            </>}
            {activeSheet === 'edit-device' && <>
              <Text style={styles.sheetTitle}>Edit device</Text>
              <Text style={styles.sheetIntro}>Update the display details for this device. The MAC address stays the same.</Text>
              <Text style={styles.inputLabel}>DEVICE NAME</Text>
              <TextInput value={editingDeviceName} onChangeText={value => { setEditingDeviceName(value); setEditDeviceError(''); }} style={styles.textInput} placeholder="e.g. AirBuddi Mini" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <Text style={styles.inputLabel}>ROOM OR SPACE</Text>
              <TextInput value={editingDeviceRoom} onChangeText={value => { setEditingDeviceRoom(value); setEditDeviceError(''); }} style={styles.textInput} placeholder="e.g. Bedroom" placeholderTextColor={dashboardTheme.colors.textMuted} />
              {!!editDeviceError && <Text style={styles.inputError}>{editDeviceError}</Text>}
              <TouchableOpacity style={styles.primarySheetButton} onPress={saveEditedDevice}><Text style={styles.primarySheetButtonText}>Save device</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerSheetButton} onPress={removeEditedDevice}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                <Text style={styles.dangerSheetButtonText}>Remove device</Text>
              </TouchableOpacity>
            </>}

            {activeSheet === 'about' && <>
              <View style={styles.aboutIcon}><MaterialCommunityIcons name="leaf" size={34} color="#FFFFFF" /></View>
              <Text style={styles.sheetTitle}>About AirBuddi</Text>
              <Text style={styles.aboutCopy}>AirBuddi helps you understand and improve the air in every room you call home. Monitor your devices, manage comfort settings, and stay connected to healthier spaces.</Text>
              <Text style={styles.aboutVersion}>AirBuddi app · Version 1.0</Text>
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}

            {/* ── Linked Accounts ─────────────────────────────────── */}
            {activeSheet === 'linked-accounts' && <>
              <Text style={styles.sheetTitle}>Linked Accounts</Text>
              <Text style={styles.sheetIntro}>Connect third-party accounts for faster sign-in.</Text>
              <View style={styles.contactOption}>
                <View style={styles.contactIconWrap}><MaterialCommunityIcons name="google" size={22} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.contactInfo}><Text style={styles.contactLabel}>Google</Text><Text style={styles.contactSub}>Coming soon</Text></View>
              </View>
              <View style={[styles.contactOption, styles.contactOptionLast]}>
                <View style={styles.contactIconWrap}><MaterialCommunityIcons name="apple" size={22} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.contactInfo}><Text style={styles.contactLabel}>Apple</Text><Text style={styles.contactSub}>Coming soon</Text></View>
              </View>
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}

            {/* ── Notifications ───────────────────────────────────── */}
            {activeSheet === 'notifications' && <>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <Text style={styles.sheetIntro}>Choose which alerts you'd like to receive.</Text>
              <View style={styles.settingsToggleRow}>
                <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>Push Notifications</Text><Text style={styles.settingsToggleSublabel}>Enable all notifications</Text></View>
                <Switch value={notifPush} onValueChange={setNotifPush} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={notifPush ? '#22C55E' : '#F4F4F4'} />
              </View>
              <View style={styles.settingsToggleRow}>
                <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>AQI Alerts</Text><Text style={styles.settingsToggleSublabel}>Warn when air quality drops</Text></View>
                <Switch value={notifAqiAlerts} onValueChange={setNotifAqiAlerts} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={notifAqiAlerts ? '#22C55E' : '#F4F4F4'} />
              </View>
              <View style={styles.settingsToggleRow}>
                <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>Device Offline</Text><Text style={styles.settingsToggleSublabel}>Alert when device goes offline</Text></View>
                <Switch value={notifDeviceOffline} onValueChange={setNotifDeviceOffline} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={notifDeviceOffline ? '#22C55E' : '#F4F4F4'} />
              </View>
              <View style={[styles.settingsToggleRow, styles.settingsToggleRowLast]}>
                <View style={styles.toggleTextWrap}><Text style={styles.settingsToggleLabel}>Filter Replacement</Text><Text style={styles.settingsToggleSublabel}>Remind when filter needs replacing</Text></View>
                <Switch value={notifFilterReminder} onValueChange={setNotifFilterReminder} trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }} thumbColor={notifFilterReminder ? '#22C55E' : '#F4F4F4'} />
              </View>
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}

            {/* ── Alert Thresholds ────────────────────────────────── */}
            {activeSheet === 'alert-thresholds' && <>
              <Text style={styles.sheetTitle}>Alert Thresholds</Text>
              <Text style={styles.sheetIntro}>Set the AQI levels at which you want to be alerted.</Text>
              <Text style={styles.inputLabel}>WARNING LEVEL (AQI)</Text>
              <TextInput value={aqiWarningThreshold} onChangeText={setAqiWarningThreshold} style={styles.textInput} keyboardType="numeric" placeholder="100" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <Text style={styles.inputLabel}>DANGER LEVEL (AQI)</Text>
              <TextInput value={aqiDangerThreshold} onChangeText={setAqiDangerThreshold} style={styles.textInput} keyboardType="numeric" placeholder="200" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <TouchableOpacity style={styles.primarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.primarySheetButtonText}>Save</Text></TouchableOpacity>
            </>}

            {/* ── Appearance ──────────────────────────────────────── */}
            {activeSheet === 'appearance' && <>
              <Text style={styles.sheetTitle}>Appearance</Text>
              <Text style={styles.sheetIntro}>Customize how AirBuddi looks.</Text>
              <Text style={styles.inputLabel}>THEME</Text>
              <View style={styles.optionRow}>
                {(['light', 'dark', 'system'] as const).map(opt => (
                  <TouchableOpacity key={opt} style={[styles.optionChip, themePreference === opt && styles.optionChipActive]} onPress={() => setThemePreference(opt)}>
                    <Text style={[styles.optionChipText, themePreference === opt && styles.optionChipTextActive]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}

            {/* ── Units & Region ──────────────────────────────────── */}
            {activeSheet === 'units' && <>
              <Text style={styles.sheetTitle}>Units & Region</Text>
              <Text style={styles.sheetIntro}>Choose your preferred measurement units.</Text>
              <Text style={styles.inputLabel}>TEMPERATURE</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity style={[styles.optionChip, tempUnit === 'celsius' && styles.optionChipActive]} onPress={() => setTempUnit('celsius')}><Text style={[styles.optionChipText, tempUnit === 'celsius' && styles.optionChipTextActive]}>°C Celsius</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, tempUnit === 'fahrenheit' && styles.optionChipActive]} onPress={() => setTempUnit('fahrenheit')}><Text style={[styles.optionChipText, tempUnit === 'fahrenheit' && styles.optionChipTextActive]}>°F Fahrenheit</Text></TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>AQI STANDARD</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity style={[styles.optionChip, aqiStandard === 'us' && styles.optionChipActive]} onPress={() => setAqiStandard('us')}><Text style={[styles.optionChipText, aqiStandard === 'us' && styles.optionChipTextActive]}>US EPA</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, aqiStandard === 'india' && styles.optionChipActive]} onPress={() => setAqiStandard('india')}><Text style={[styles.optionChipText, aqiStandard === 'india' && styles.optionChipTextActive]}>India NAQI</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}

            {/* ── Data & Privacy ──────────────────────────────────── */}
            {activeSheet === 'data-privacy' && <>
              <Text style={styles.sheetTitle}>Data & Privacy</Text>
              <Text style={styles.sheetIntro}>Your data stays on your device. AirBuddi connects to your purifier locally and doesn't share personal information with third parties.</Text>
              <TouchableOpacity style={styles.primarySheetButton} onPress={async () => {
                try {
                  await AsyncStorage.removeItem(DEVICES_STORAGE_KEY);
                  await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
                  await AsyncStorage.removeItem(PREFERENCES_STORAGE_KEY);
                  setDevices([]);
                  setNotifPush(true);
                  setNotifAqiAlerts(true);
                  setNotifDeviceOffline(true);
                  setNotifFilterReminder(true);
                  setThemePreference('system');
                  setTempUnit('celsius');
                  setAqiStandard('us');
                  setAqiWarningThreshold('100');
                  setAqiDangerThreshold('200');
                  Alert.alert('Cache Cleared', 'Local app cache has been cleared successfully.');
                } catch (e) {
                  console.error('[AirBuddi] Failed to clear cache:', e);
                }
              }}><Text style={styles.primarySheetButtonText}>Clear App Cache</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerSheetButton} onPress={() => Alert.alert('Delete Account', 'This feature is not available in demo mode.', [{ text: 'OK' }])}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                <Text style={styles.dangerSheetButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </>}

            {/* ── Help & Troubleshooting ──────────────────────────── */}
            {activeSheet === 'help' && <>
              <Text style={styles.sheetTitle}>Help & Troubleshooting</Text>
              <Text style={styles.sheetIntro}>Find answers to common questions.</Text>
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
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}

            {/* ── Contact Support ─────────────────────────────────── */}
            {activeSheet === 'contact-support' && <>
              <Text style={styles.sheetTitle}>Contact Support</Text>
              <Text style={styles.sheetIntro}>We're here to help. Reach us through any channel.</Text>
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
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}

            {/* ── Explore Other Products ──────────────────────────── */}
            {activeSheet === 'explore-products' && <>
              <Text style={styles.sheetTitle}>Explore GreenVerse</Text>
              <Text style={styles.sheetIntro}>Discover our family of smart environmental products.</Text>
              <View style={styles.productCard}>
                <View style={styles.productIconWrap}><MaterialCommunityIcons name="air-purifier" size={26} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.productInfo}><Text style={styles.productName}>AirBuddi Pro</Text><Text style={styles.productDesc}>Advanced air purification with HEPA H13 filter and UV-C sterilization.</Text></View>
                <View style={styles.productBadge}><Text style={styles.productBadgeText}>New</Text></View>
              </View>
              <View style={styles.productCard}>
                <View style={styles.productIconWrap}><MaterialCommunityIcons name="water-outline" size={26} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.productInfo}><Text style={styles.productName}>WaterBuddi</Text><Text style={styles.productDesc}>Smart water quality monitoring for your home.</Text></View>
                <View style={styles.productBadge}><Text style={styles.productBadgeText}>Soon</Text></View>
              </View>
              <View style={styles.productCard}>
                <View style={styles.productIconWrap}><MaterialCommunityIcons name="flower-outline" size={26} color={dashboardTheme.colors.primaryDark} /></View>
                <View style={styles.productInfo}><Text style={styles.productName}>SoilBuddi</Text><Text style={styles.productDesc}>Intelligent soil monitoring for healthier plants.</Text></View>
                <View style={styles.productBadge}><Text style={styles.productBadgeText}>Soon</Text></View>
              </View>
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}
          </View>
        </View>
      </Modal>

      {/* ── 3-dot overflow dropdown ─────────────────────────────────── */}
      <Modal
        transparent
        animationType="fade"
        visible={activeSheet === 'menu'}
        onRequestClose={() => setActiveSheet(null)}
      >
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setActiveSheet(null)}
        >
          <View style={styles.dropdownMenu}>
            <DropdownMenuItem icon="air-filter" label="My devices" onPress={() => { setActiveSheet(null); setActiveTab('fan'); }} />
            <DropdownMenuItem icon="chart-line" label="Air quality monitor" onPress={() => { setActiveSheet(null); setActiveTab('airquality'); }} />
            <DropdownMenuItem icon="account-circle-outline" label="Profile" onPress={() => setActiveSheet('profile')} />
            <DropdownMenuItem icon="cog-outline" label="Settings" onPress={() => { setActiveSheet(null); setActiveTab('more'); }} />
            <DropdownMenuItem icon="information-outline" label="About us" onPress={() => setActiveSheet('about')} />
            <DropdownMenuItem icon="logout" label="Sign out" onPress={() => { setActiveSheet(null); handleSignOut(); }} last />
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
                onPress={() => setActiveTab(tab.id)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 18,
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
    paddingTop: 34,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
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
    marginTop: 22,
    width: 250,
    height: 58,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: dashboardTheme.colors.primaryDark,
    ...dashboardTheme.shadows.medium,
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

  connectionHelp: {
    width: '100%',
    marginTop: 25,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE9DF',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  connectionHelpIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAF8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectionHelpText: {
    flex: 1,
    marginLeft: 12,
  },

  connectionHelpTitle: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  connectionHelpSubtitle: {
    marginTop: 4,
    color: dashboardTheme.colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
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
});