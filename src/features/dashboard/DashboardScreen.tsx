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
  Image,
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

// ─── Bottom Tab Config ────────────────────────────────────────────────────────

type TabId = 'airquality' | 'fan' | 'light' | 'more';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'fan',        label: 'Home',     icon: 'home-outline' },
  { id: 'airquality', label: 'Monitor',  icon: 'chart-line' },
  { id: 'light',      label: 'Control',  icon: 'lightbulb-outline' },
  { id: 'more',       label: 'Settings', icon: 'cog-outline' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const dashboard = useAppSelector(selectDashboard) as DashboardRuntimeState;
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
  } = useDashboardRealtimeBridge();

  const device = dashboard.device;
  const sensors = dashboard.sensors ?? [];

  const [activeTab, setActiveTab] = useState<TabId>('fan');
  const [refreshing, setRefreshing] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const deviceTitle = device?.name ?? 'AirBuddi Pro';

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
        subtitle="Connected · Optimal Performance"
        onProfilePress={() => setIsProfileOpen(true)}
        onRefreshPress={handleRefresh}
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
          </Animated.View>
        )}

        {/* ── Monitor Tab ───────────────────────────────────────────── */}
        {activeTab === 'airquality' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
              <AirQualityCard aqi={dashboard.aqi} />
              <View style={styles.gap}>
                <SensorGrid sensors={sensors} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Control Tab ───────────────────────────────────────────── */}
        {activeTab === 'light' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
              <LightControlPanel
                lights={lightZones}
                onToggleLight={handleToggleLightZone}
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
              />
            </View>
          </Animated.View>
        )}

        {/* ── Settings Tab ──────────────────────────────────────────── */}
        {activeTab === 'more' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
              <DeviceCard device={device} />
              <View style={styles.gap}>
                <FilterHealthCard
                  health={dashboard.filterHealth}
                  remainingLifeDays={dashboard.remainingLifeDays}
                />
              </View>
              <View style={styles.gap}>
                <ConnectionPill label={connectionLabel} status={dashboard.connection} />
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ── Profile Bottom Sheet ────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={isProfileOpen}
        onRequestClose={() => setIsProfileOpen(false)}
      >
        <View style={styles.profileBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsProfileOpen(false)}
          />
          <View style={styles.profileSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.profileIdentity}>
              <View style={styles.profileAvatar}>
                <Image
                  source={require('../../../assets/airbuddi-favicon.png')}
                  style={styles.profileAvatarImage}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.profileName}>AirBuddi Member</Text>
                <Text style={styles.profileEmail}>Your home, healthier</Text>
              </View>
            </View>
            <Text style={styles.sheetLabel}>ACCOUNT</Text>
            <TouchableOpacity
              style={styles.profileAction}
              activeOpacity={0.75}
              onPress={() => { setIsProfileOpen(false); setActiveTab('more'); }}
            >
              <MaterialCommunityIcons name="air-filter" size={20} color={dashboardTheme.colors.primary} />
              <Text style={styles.profileActionText}>My Devices</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileAction}
              activeOpacity={0.75}
              onPress={() => { setIsProfileOpen(false); setActiveTab('airquality'); }}
            >
              <MaterialCommunityIcons name="chart-line" size={20} color={dashboardTheme.colors.primary} />
              <Text style={styles.profileActionText}>Air Quality History</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileAction}
              activeOpacity={0.75}
              onPress={() => setIsProfileOpen(false)}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color={dashboardTheme.colors.textSecondary} />
              <Text style={styles.profileActionText}>Settings</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
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
});
