import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Pressable, Text } from 'react-native';

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

export function DashboardScreen() {
  const dashboard = useAppSelector(selectDashboard) as DashboardRuntimeState;
  const { setPowerState, setAutoMode, cycleFanSpeed } = useDashboardRealtimeBridge();
  const [activeTab, setActiveTab] = useState<'overview' | 'sensors' | 'device'>('overview');
  const device = dashboard.device;
  const sensors = dashboard.sensors ?? [];

  const connectionLabel = useMemo(
    () => connectionLabels[dashboard.connection],
    [dashboard.connection],
  );

  const realtimeLabel = useMemo(() => {
    if (dashboard.errorMessage) {
      return dashboard.errorMessage;
    }

    if (dashboard.liveMode) {
      return 'Live data synced from ESP32 via AWS IoT Core';
    }

    return 'Waiting for ESP32 telemetry and AWS IoT Core connection.';
  }, [dashboard.errorMessage, dashboard.liveMode]);

  const handleTogglePower = useCallback(() => {
    if (!device) {
      return;
    }

    setPowerState(device.power !== 'on');
  }, [device, setPowerState]);

  const handleCycleFanSpeed = useCallback(() => {
    cycleFanSpeed();
  }, [cycleFanSpeed]);

  const handleToggleAutoMode = useCallback((value: boolean) => {
    setAutoMode(value);
  }, [setAutoMode]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundBlobOne} />
      <View style={styles.backgroundBlobTwo} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          title={dashboard.appTitle}
          subtitle="Real-time telemetry dashboard"
          notificationCount={dashboard.connectedDeviceCount}
        />

        <View style={styles.realtimeBanner}>
          <View style={styles.realtimeHeaderRow}>
            <ConnectionPill label={connectionLabel} status={dashboard.connection} />
            <Text style={styles.realtimeMeta}>
              {dashboard.connectedDeviceCount} device{dashboard.connectedDeviceCount === 1 ? '' : 's'}
            </Text>
          </View>
          <Text style={styles.realtimeLabel}>{realtimeLabel}</Text>
          <Text style={styles.realtimeSubtext}>
            Last update: {device?.lastSeenAt ?? device?.lastUpdated ?? 'Waiting for live data'}
          </Text>
        </View>

        {/* Custom Segmented Tab Bar */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBar}>
            {(['overview', 'sensors', 'device'] as const).map(tab => {
              const isActive = activeTab === tab;
              const label =
                tab === 'overview'
                  ? 'Overview'
                  : tab === 'sensors'
                  ? 'Sensors'
                  : 'Device';
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabButton, isActive && styles.activeTabButton]}
                >
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <AirQualityCard aqi={dashboard.aqi} />
            <View style={styles.sectionGap}>
              <QuickControls
                isPoweredOn={device?.power === 'on'}
                isAutoMode={device?.mode === 'auto'}
                fanSpeed={device?.fanSpeed}
                onTogglePower={handleTogglePower}
                onCycleFanSpeed={handleCycleFanSpeed}
                onToggleAutoMode={handleToggleAutoMode}
              />
            </View>
          </View>
        )}

        {activeTab === 'sensors' && (
          <View style={styles.tabContent}>
            <SensorGrid sensors={sensors} />
          </View>
        )}

        {activeTab === 'device' && (
          <View style={styles.tabContent}>
            <DeviceCard device={device} />
            <View style={styles.sectionGap}>
              <FilterHealthCard
                health={dashboard.filterHealth}
                remainingLifeDays={dashboard.remainingLifeDays}
              />
            </View>
            <View style={styles.sectionGap}>
              <ConnectionPill label={connectionLabel} status={dashboard.connection} />
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  flex: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  realtimeBanner: {
    marginTop: 18,
    padding: 16,
    borderRadius: dashboardTheme.radii.lg,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    gap: 10,
  },
  realtimeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  realtimeMeta: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  realtimeLabel: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  realtimeSubtext: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  tabContainer: {
    marginVertical: 18,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: dashboardTheme.colors.primary,
  },
  tabText: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  sectionGap: {
    marginTop: 16,
  },
  bottomSpace: {
    height: 28,
  },
  backgroundBlobOne: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
  },
  backgroundBlobTwo: {
    position: 'absolute',
    top: 300,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
});