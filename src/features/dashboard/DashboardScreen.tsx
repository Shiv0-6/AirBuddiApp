import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { dashboardTheme } from './dashboardTheme';
import { dashboardMockState, connectionLabels } from './dashboardMockData';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DeviceCard } from '../../components/dashboard/DeviceCard';
import { AirQualityCard } from '../../components/dashboard/AirQualityCard';
import { SensorGrid } from '../../components/dashboard/SensorGrid';
import { QuickControls } from '../../components/dashboard/QuickControls';
import { FilterHealthCard } from '../../components/dashboard/FilterHealthCard';
import { ConnectionPill } from '../../components/dashboard/ConnectionPill';

export function DashboardScreen() {
  const [isPoweredOn, setIsPoweredOn] = useState(dashboardMockState.device.power === 'on');
  const [isAutoMode, setIsAutoMode] = useState(dashboardMockState.device.mode === 'auto');

  const mockState = dashboardMockState;

  const connectionLabel = useMemo(
    () => connectionLabels[mockState.connection],
    [mockState.connection],
  );

  const handleTogglePower = useCallback(() => {
    Alert.alert('AirBuddi', 'Power control is wired to mock state for now.');
    setIsPoweredOn(previous => !previous);
  }, []);

  const handleCycleFanSpeed = useCallback(() => {
    Alert.alert('AirBuddi', 'Fan speed control will connect to MQTT later.');
  }, []);

  const handleToggleAutoMode = useCallback((value: boolean) => {
    setIsAutoMode(value);
  }, []);

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
          greeting={mockState.greeting}
          userName={mockState.userName}
          notificationCount={mockState.notificationCount}
        />

        <View style={styles.sectionGap}>
          <DeviceCard
            device={{
              ...mockState.device,
              power: isPoweredOn ? 'on' : 'off',
              mode: isAutoMode ? 'auto' : 'manual',
            }}
          />
        </View>

        <View style={styles.sectionGap}>
          <AirQualityCard aqi={mockState.aqi} />
        </View>

        <View style={styles.sectionGap}>
          <SensorGrid sensors={mockState.sensors} />
        </View>

        <View style={styles.sectionGap}>
          <QuickControls
            isPoweredOn={isPoweredOn}
            isAutoMode={isAutoMode}
            onTogglePower={handleTogglePower}
            onCycleFanSpeed={handleCycleFanSpeed}
            onToggleAutoMode={handleToggleAutoMode}
          />
        </View>

        <View style={styles.sectionGap}>
          <FilterHealthCard
            health={mockState.filterHealth}
            remainingLifeDays={mockState.remainingLifeDays}
          />
        </View>

        <View style={styles.sectionGap}>
          <ConnectionPill label={connectionLabel} status={mockState.connection} />
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