import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [dailyGoalEnabled, setDailyGoalEnabled] = useState(true);
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
        onProfilePress={() => setIsProfileOpen(true)}
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
            <View style={styles.tabPad}>
              <View style={styles.goalCard}>
                <View style={styles.goalIcon}>
                  <MaterialCommunityIcons name="leaf-circle-outline" size={24} color={dashboardTheme.colors.primary} />
                </View>
                <View style={styles.goalCopy}>
                  <Text style={styles.goalTitle}>Clean-air goal</Text>
                  <Text style={styles.goalSubtitle}>
                    {dailyGoalEnabled ? 'Tracking your healthy-air time today.' : 'Turn this on for gentle daily insights.'}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Toggle clean-air goal"
                  onPress={() => setDailyGoalEnabled(value => !value)}
                  style={[styles.goalToggle, dailyGoalEnabled && styles.goalToggleOn]}
                >
                  <View style={[styles.goalToggleThumb, dailyGoalEnabled && styles.goalToggleThumbOn]} />
                </TouchableOpacity>
              </View>
            </View>
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
              <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>AB</Text></View>
              <View>
                <Text style={styles.profileName}>AirBuddi member</Text>
                <Text style={styles.profileEmail}>Your home, healthier</Text>
              </View>
            </View>
            <Text style={styles.sheetLabel}>ACCOUNT</Text>
            <TouchableOpacity style={styles.profileAction} onPress={() => { setIsProfileOpen(false); setActiveTab('more'); }}>
              <MaterialCommunityIcons name="air-filter" size={21} color={dashboardTheme.colors.primary} />
              <Text style={styles.profileActionText}>My devices</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileAction} onPress={() => { setIsProfileOpen(false); setActiveTab('airquality'); }}>
              <MaterialCommunityIcons name="chart-line" size={21} color={dashboardTheme.colors.accent} />
              <Text style={styles.profileActionText}>Air quality history</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileAction} onPress={() => setIsProfileOpen(false)}>
              <MaterialCommunityIcons name="cog-outline" size={21} color={dashboardTheme.colors.textSecondary} />
              <Text style={styles.profileActionText}>Settings</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.md,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalCopy: { flex: 1, paddingRight: 10 },
  goalTitle: { color: dashboardTheme.colors.textPrimary, fontSize: 15, fontWeight: '800' },
  goalSubtitle: { color: dashboardTheme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  goalToggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    padding: 3,
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
  },
  goalToggleOn: { backgroundColor: dashboardTheme.colors.primary },
  goalToggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: dashboardTheme.colors.textMuted },
  goalToggleThumbOn: { alignSelf: 'flex-end', backgroundColor: dashboardTheme.colors.dark },

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
  profileBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 6, 23, 0.62)' },
  profileSheet: {
    backgroundColor: dashboardTheme.colors.surfaceElevated,
    borderTopLeftRadius: dashboardTheme.radii.xl,
    borderTopRightRadius: dashboardTheme.radii.xl,
    padding: 20,
    paddingBottom: 44,
  },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: dashboardTheme.colors.textMuted, opacity: 0.45, marginBottom: 22 },
  profileIdentity: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 28 },
  profileAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primary },
  profileAvatarText: { color: dashboardTheme.colors.dark, fontSize: 16, fontWeight: '900' },
  profileName: { color: dashboardTheme.colors.textPrimary, fontSize: 18, fontWeight: '800' },
  profileEmail: { color: dashboardTheme.colors.textMuted, fontSize: 13, marginTop: 3 },
  sheetLabel: { color: dashboardTheme.colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  profileAction: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: dashboardTheme.colors.border },
  profileActionText: { flex: 1, color: dashboardTheme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
});
