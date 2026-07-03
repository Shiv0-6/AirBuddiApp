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
import { useDashboardRealtimeBridge } from './useDashboardRealtimeBridge';

export function DashboardScreen() {
  const dashboard = useAppSelector(selectDashboard);
  const { setPowerState, setAutoMode, cycleFanSpeed } = useDashboardRealtimeBridge();
  const [activeTab, setActiveTab] = useState<'overview' | 'sensors' | 'device'>('overview');

  const connectionLabel = useMemo(
    () => connectionLabels[dashboard.connection],
    [dashboard.connection],
  );

  const handleTogglePower = useCallback(() => {
    setPowerState(dashboard.device.power !== 'on');
  }, [dashboard.device.power, setPowerState]);

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
          greeting={dashboard.greeting}
          userName={dashboard.userName}
          notificationCount={dashboard.notificationCount}
        />

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
                isPoweredOn={dashboard.device.power === 'on'}
                isAutoMode={dashboard.device.mode === 'auto'}
                fanSpeed={dashboard.device.fanSpeed}
                onTogglePower={handleTogglePower}
                onCycleFanSpeed={handleCycleFanSpeed}
                onToggleAutoMode={handleToggleAutoMode}
              />
            </View>
          </View>
        )}

        {activeTab === 'sensors' && (
          <View style={styles.tabContent}>
            <SensorGrid sensors={dashboard.sensors} />
          </View>
        )}

        {activeTab === 'device' && (
          <View style={styles.tabContent}>
            <DeviceCard device={dashboard.device} />
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