import React, { useCallback, useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

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

        <View style={styles.sectionGap}>
          <DeviceCard
            device={{
              ...dashboard.device,
            }}
          />
        </View>

        <View style={styles.sectionGap}>
          <AirQualityCard aqi={dashboard.aqi} />
        </View>

        <View style={styles.sectionGap}>
          <SensorGrid sensors={dashboard.sensors} />
        </View>

        <View style={styles.sectionGap}>
          <QuickControls
            isPoweredOn={dashboard.device.power === 'on'}
            isAutoMode={dashboard.device.mode === 'auto'}
            onTogglePower={handleTogglePower}
            onCycleFanSpeed={handleCycleFanSpeed}
            onToggleAutoMode={handleToggleAutoMode}
          />
        </View>

        <View style={styles.sectionGap}>
          <FilterHealthCard
            health={dashboard.filterHealth}
            remainingLifeDays={dashboard.remainingLifeDays}
          />
        </View>

        <View style={styles.sectionGap}>
          <ConnectionPill label={connectionLabel} status={dashboard.connection} />
        </View>

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
  sectionGap: {
    marginTop: 16,
  },
  bottomSpace: {
    height: 28,
  },
  backgroundBlobOne: {
    position: 'absolute',
    top: -80,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: dashboardTheme.colors.primarySoft,
    opacity: 0.7,
  },
  backgroundBlobTwo: {
    position: 'absolute',
    top: 220,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(240, 162, 2, 0.10)',
  },
});