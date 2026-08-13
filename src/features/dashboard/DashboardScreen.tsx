import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  RefreshControl,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { dashboardTheme } from './dashboardTheme';
import { connectionLabels } from './dashboardMockData';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DeviceCard } from '../../components/dashboard/DeviceCard';
import { AirQualityCard } from '../../components/dashboard/AirQualityCard';
import { SensorGrid } from '../../components/dashboard/SensorGrid';
import { QuickControls } from '../../components/dashboard/QuickControls';
import { FilterHealthCard } from '../../components/dashboard/FilterHealthCard';
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

type SheetId = 'profile' | 'add-device' | 'edit-device' | 'menu' | 'about' | null;
type HomeDevice = {
  id: string;
  name: string;
  room: string;
  status: 'Online' | 'Offline';
  aqi: number | null;
  icon: string;
};

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'fan',        label: 'Home',     icon: 'home-outline' },
  { id: 'airquality', label: 'Monitor',  icon: 'chart-line' },
  { id: 'light',      label: 'Control',  icon: 'lightbulb-outline' },
  { id: 'more',       label: 'Settings', icon: 'cog-outline' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const dashboard = useAppSelector(selectDashboard) as DashboardRuntimeState;
  const device = dashboard.device;
  const sensors = dashboard.sensors ?? [];
  const pm25Value = sensors.find(s => s.id === 'pm2_5')?.value ?? null;

  const [activeTab, setActiveTab] = useState<TabId>('fan');
  const [refreshing, setRefreshing] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [profileName, setProfileName] = useState('AirBuddi Member');
  const [profileEmail, setProfileEmail] = useState('member@airbuddi.app');
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
      { id: 'zone-1', label: 'Ambient', icon: 'lamp',      isOn: device?.lightZones?.['zone-1'] ?? false },
      { id: 'zone-2', label: 'Task',    icon: 'desk-lamp', isOn: device?.lightZones?.['zone-2'] ?? false },
      { id: 'zone-3', label: 'Accent',  icon: 'spotlight', isOn: device?.lightZones?.['zone-3'] ?? false },
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

  // ← ADD THE NEW EFFECT RIGHT HERE
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

  // ── Handlers ────────────────────────────────────────────────────────────────

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
    <SafeAreaView style={styles.safeArea}>
      {/* Subtle background decor */}
      <View pointerEvents="none" style={styles.bgContainer}>
        <View style={styles.bgCirclePrimary} />
        <View style={styles.bgCircleSecondary} />
      </View>

      <DashboardHeader
        title={deviceTitle}
        subtitle={`${displayDeviceName} · ${selectedDevice?.status ?? 'Offline'}`}
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
                <View>
                  <Text style={styles.sectionTitle}>My devices</Text>
                  <Text style={styles.sectionSubtitle}>{devices.length > 0 ? `${devices.length} device${devices.length === 1 ? '' : 's'} added` : 'No device connected'}</Text>
                </View>
                {devices.length > 0 && (
                  <TouchableOpacity accessibilityLabel="Add another device" style={styles.addDeviceHeaderButton} activeOpacity={0.8} onPress={() => setActiveSheet('add-device')}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.deviceGrid}>
                {devices.length === 0 ? (
                  <TouchableOpacity style={styles.emptyDeviceState} activeOpacity={0.8} onPress={() => setActiveSheet('add-device')}>
                    <View style={styles.emptyDeviceIcon}>
                      <MaterialCommunityIcons name="plus" size={34} color={dashboardTheme.colors.primaryDark} />
                    </View>
                    <Text style={styles.emptyDeviceTitle}>Add your first device</Text>
                    <Text style={styles.emptyDeviceCopy}>Enter its MAC address to connect and view live data.</Text>
                  </TouchableOpacity>
                ) : devices.map(item => {
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
              <LightControlPanel
                lights={lightZones}
                onToggleLight={handleToggleLightZone}
                disabled={device?.power !== 'on'}
              />
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
            </View>
          </Animated.View>
        )}

        {/* ── Settings Tab ──────────────────────────────────────────── */}
        {activeTab === 'more' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <Text style={styles.sectionSubtitle}>Manage your account and AirBuddi home.</Text>
              <View style={styles.settingsCard}>
                <SettingsRow icon="account-circle-outline" title="Profile" subtitle={profileName} onPress={() => setActiveSheet('profile')} />
                <SettingsRow icon="air-filter" title="Devices" subtitle={devices.length > 0 ? `${devices.length} device${devices.length === 1 ? '' : 's'} added` : 'No device connected'} onPress={() => setActiveTab('fan')} />
                <SettingsRow icon="information-outline" title="About AirBuddi" subtitle="App details and support" onPress={() => setActiveSheet('about')} last />
              </View>
              <View style={styles.gap}><DeviceCard device={device} /></View>
              <View style={styles.gap}><FilterHealthCard health={dashboard.filterHealth} remainingLifeDays={dashboard.remainingLifeDays} /></View>
              <View style={styles.gap}><ConnectionPill label={connectionLabel} status={dashboard.connection} /></View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ── Account, device, and overflow sheets ───────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={activeSheet !== null}
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
              <Text style={styles.inputLabel}>DISPLAY NAME</Text>
              <TextInput value={profileName} onChangeText={setProfileName} style={styles.textInput} placeholder="Your name" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput value={profileEmail} onChangeText={setProfileEmail} style={styles.textInput} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={dashboardTheme.colors.textMuted} />
              <TouchableOpacity style={styles.primarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.primarySheetButtonText}>Save profile</Text></TouchableOpacity>
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
            {activeSheet === 'menu' && <>
              <Text style={styles.sheetTitle}>More</Text>
              <MenuAction icon="air-filter" label="My devices" onPress={() => { setActiveSheet(null); setActiveTab('fan'); }} />
              <MenuAction icon="chart-line" label="Air quality monitor" onPress={() => { setActiveSheet(null); setActiveTab('airquality'); }} />
              <MenuAction icon="account-circle-outline" label="Profile" onPress={() => setActiveSheet('profile')} />
              <MenuAction icon="cog-outline" label="Settings" onPress={() => { setActiveSheet(null); setActiveTab('more'); }} />
              <MenuAction icon="information-outline" label="About us" onPress={() => setActiveSheet('about')} />
            </>}
            {activeSheet === 'about' && <>
              <View style={styles.aboutIcon}><MaterialCommunityIcons name="leaf" size={34} color="#FFFFFF" /></View>
              <Text style={styles.sheetTitle}>About AirBuddi</Text>
              <Text style={styles.aboutCopy}>AirBuddi helps you understand and improve the air in every room you call home. Monitor your devices, manage comfort settings, and stay connected to healthier spaces.</Text>
              <Text style={styles.aboutVersion}>AirBuddi app · Version 1.0</Text>
              <TouchableOpacity style={styles.secondarySheetButton} onPress={() => setActiveSheet(null)}><Text style={styles.secondarySheetButtonText}>Done</Text></TouchableOpacity>
            </>}
          </View>
        </View>
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
    </SafeAreaView>
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

function MenuAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.profileAction} activeOpacity={0.75} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={20} color={dashboardTheme.colors.primaryDark} />
      <Text style={styles.profileActionText}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
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
    paddingTop: 8,
    paddingBottom: 110,
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
  homeHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: dashboardTheme.colors.textPrimary, letterSpacing: -0.3 },
  sectionSubtitle: { marginTop: 3, fontSize: 13, color: dashboardTheme.colors.textMuted, fontWeight: '500' },
  addDeviceHeaderButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primaryDark, ...dashboardTheme.shadows.medium },
  deviceGrid: { gap: 12 },
  homeDeviceCard: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: dashboardTheme.radii.md, backgroundColor: dashboardTheme.colors.surface, borderWidth: 1, borderColor: dashboardTheme.colors.border, ...dashboardTheme.shadows.soft },
  homeDeviceCardSelected: { borderColor: 'rgba(22, 163, 74, 0.38)', backgroundColor: dashboardTheme.colors.surfaceTint },
  emptyDeviceState: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 18, borderRadius: dashboardTheme.radii.md, borderWidth: 1, borderStyle: 'dashed', borderColor: dashboardTheme.colors.primary, backgroundColor: dashboardTheme.colors.surfaceTint },
  emptyDeviceIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.surface, marginBottom: 14 },
  emptyDeviceTitle: { color: dashboardTheme.colors.textPrimary, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyDeviceCopy: { marginTop: 4, color: dashboardTheme.colors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center', maxWidth: 260 },
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
  settingsCard: { marginTop: 18, borderRadius: dashboardTheme.radii.md, backgroundColor: dashboardTheme.colors.surface, borderWidth: 1, borderColor: dashboardTheme.colors.border, overflow: 'hidden', ...dashboardTheme.shadows.soft },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: dashboardTheme.colors.border },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: dashboardTheme.colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  settingsCopy: { flex: 1 },
  settingsTitle: { color: dashboardTheme.colors.textPrimary, fontSize: 15, fontWeight: '700' },
  settingsSubtitle: { color: dashboardTheme.colors.textMuted, fontSize: 12, marginTop: 2 },

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
});
