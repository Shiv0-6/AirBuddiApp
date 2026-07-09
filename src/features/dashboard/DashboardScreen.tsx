import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

// ─── Bottom Tab Config ────────────────────────────────────────────────────────

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
  const deviceTitle = device?.name ?? 'AirBuddi';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Header – rendered outside scroll so it's always visible */}
      <DashboardHeader
        title={deviceTitle}
        subtitle="Air purifier control"
        notificationCount={dashboard.connectedDeviceCount}
      />

      {/* Tab content */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Fan Tab (main purifier control) ─────────────────── */}
        {activeTab === 'fan' && (
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
        )}

        {/* ── Air Quality Tab ─────────────────────────────────── */}
        {activeTab === 'airquality' && (
          <View style={styles.tabPad}>
            <AirQualityCard aqi={dashboard.aqi} />
            <View style={styles.gap}>
              <SensorGrid sensors={sensors} />
            </View>
          </View>
        )}

        {/* ── Light Tab ───────────────────────────────────────── */}
        {activeTab === 'light' && (
          <View style={styles.tabPad}>
            <View style={styles.placeholderCard}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={40}
                color={dashboardTheme.colors.textMuted}
              />
              <Text style={styles.placeholderTitle}>Light Controls</Text>
              <Text style={styles.placeholderSub}>LED brightness and colour settings coming soon.</Text>
            </View>
          </View>
        )}

        {/* ── More Tab ────────────────────────────────────────── */}
        {activeTab === 'more' && (
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
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ── Bottom Navigation Bar ───────────────────────────── */}
      <View style={styles.navBar}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.75}
              style={styles.navItem}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={24}
                color={isActive ? dashboardTheme.colors.textPrimary : dashboardTheme.colors.textMuted}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  flex: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabPad: {
    paddingHorizontal: 16,
  },
  gap: {
    marginTop: 16,
  },
  bottomSpace: {
    height: 20,
  },

  // Placeholder card (Light tab)
  placeholderCard: {
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.lg,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    padding: 40,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
  },
  placeholderSub: {
    fontSize: 13,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bottom nav bar
  navBar: {
    flexDirection: 'row',
    backgroundColor: dashboardTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
    paddingVertical: 8,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: dashboardTheme.colors.textMuted,
  },
  navLabelActive: {
    color: dashboardTheme.colors.textPrimary,
    fontWeight: '700',
  },
});
