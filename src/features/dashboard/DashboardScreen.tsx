import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

import { useAppSelector } from '../../store/hooks';
import { selectDashboard } from './dashboardSelectors';
import type { DashboardRuntimeState } from './dashboardSlice';
import { useDashboardRealtimeBridge } from './useDashboardRealtimeBridge';


// ─── Bottom Tab Config

type TabId = 'airquality' | 'fan' | 'light' | 'more';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'airquality', label: 'Air quality', icon: 'lightning-bolt' },
  { id: 'fan',        label: 'Fan',         icon: 'fan'            },
  { id: 'light',      label: 'Light',       icon: 'lightbulb-outline' },
  { id: 'more',       label: 'More',        icon: 'dots-horizontal' },
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
  } = useDashboardRealtimeBridge();

  const [activeTab, setActiveTab] = useState<TabId>('fan');
  const device = dashboard.device;
  const sensors = dashboard.sensors ?? [];
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

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  // ── Device title (truncated to 20 chars for header) ───────────────────────
  const deviceTitle = device?.name ?? 'AirBuddi Pro';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Dynamic Background */}
      <View pointerEvents="none" style={styles.bgContainer}>
        <View style={styles.bgCirclePrimary} />
        <View style={styles.bgCircleSecondary} />
      </View>

      <DashboardHeader
        title={deviceTitle}
        subtitle="Connected • Optimal Performance"
        notificationCount={dashboard.connectedDeviceCount}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Fan Tab (main purifier control) ─────────────────── */}
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

        {/* ── Air Quality Tab ─────────────────────────────────── */}
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

        {/* ── Light Tab ───────────────────────────────────────── */}
        {activeTab === 'light' && (
          <Animated.View style={[styles.tabContent, contentStyle]}>
            <View style={styles.tabPad}>
              <View style={styles.placeholderCard}>
                <View style={styles.placeholderIconWrap}>
                  <MaterialCommunityIcons
                    name="lightbulb-variant"
                    size={48}
                    color={dashboardTheme.colors.primary}
                  />
                </View>
                <Text style={styles.placeholderTitle}>Ambience Control</Text>
                <Text style={styles.placeholderSub}>
                  Customize your air purifier's LED ring colors and brightness to match your mood.
                </Text>
                <TouchableOpacity style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>COMING SOON</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── More Tab ────────────────────────────────────────── */}
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

      {/* ── Modern Bottom Navigation ─────────────────────────── */}
      <View style={styles.navBarWrapper}>
        <View style={styles.navBar}>
          {TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.7}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <View style={[styles.navIconContainer, isActive && styles.navIconContainerActive]}>
                  <MaterialCommunityIcons
                    name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                    size={24}
                    color={isActive ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
                  />
                  {isActive && <View style={styles.activeDot} />}
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
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  bgCirclePrimary: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: dashboardTheme.colors.primarySoft,
    opacity: 0.5,
  },
  bgCircleSecondary: {
    position: 'absolute',
    bottom: 100,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  flex: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 100, // Extra space for floating nav
  },
  tabContent: {
    width: '100%',
  },
  tabPad: {
    paddingHorizontal: 20,
  },
  gap: {
    marginTop: 20,
  },
  bottomSpace: {
    height: 40,
  },

  // Placeholder card (Light tab)
  placeholderCard: {
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.lg,
    padding: 32,
    alignItems: 'center',
    ...dashboardTheme.shadows.medium,
  },
  placeholderIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
    marginBottom: 12,
  },
  placeholderSub: {
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  comingSoonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: dashboardTheme.colors.dark,
  },
  comingSoonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Modern Floating Bottom Nav
  navBarWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...dashboardTheme.shadows.strong,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
  },
  navIconContainer: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navIconContainerActive: {
    // No background needed for this style
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: dashboardTheme.colors.primary,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: dashboardTheme.colors.textMuted,
    marginTop: 4,
  },
  navLabelActive: {
    color: dashboardTheme.colors.primary,
    fontWeight: '700',
  },
});
