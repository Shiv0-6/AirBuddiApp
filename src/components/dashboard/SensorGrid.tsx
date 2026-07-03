import React, { memo } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import type { DashboardSensor } from '../../features/dashboard/dashboardTypes';
import { formatSensorValue, getSensorTone } from '../../features/dashboard/dashboardUtils';
import { SectionCard } from './SectionCard';

type SensorGridProps = {
  sensors: DashboardSensor[];
};

function SensorCard({ sensor }: { sensor: DashboardSensor }) {
  const tone = getSensorTone(sensor.status);

  return (
    <View style={styles.sensorCard}>
      <View style={styles.iconRow}>
        <View style={[styles.iconBubble, { backgroundColor: tone + '18' }]}>
          <MaterialCommunityIcons name={sensor.icon as never} size={20} color={tone} />
        </View>
        <View style={[styles.dot, { backgroundColor: tone }]} />
      </View>

      <Text style={styles.sensorName} numberOfLines={1}>
        {sensor.name}
      </Text>
      <Text style={styles.sensorValue}>
        {formatSensorValue(sensor.value)}
        <Text style={styles.sensorUnit}> {sensor.unit}</Text>
      </Text>
      <Text style={styles.sensorStatus}>{sensor.status === 'good' ? 'Stable' : sensor.status === 'warning' ? 'Monitor' : 'Attention'}</Text>
    </View>
  );
}

function SensorGridComponent({ sensors }: SensorGridProps) {
  const renderSensor = ({ item }: ListRenderItemInfo<DashboardSensor>) => <SensorCard sensor={item} />;

  return (
    <SectionCard padding={18}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Sensors</Text>
        <Text style={styles.subtitle}>Live environmental readings</Text>
      </View>

      <FlatList
        data={sensors}
        renderItem={renderSensor}
        keyExtractor={item => item.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={() => <View style={styles.rowGap} />}
        style={styles.list}
      />
    </SectionCard>
  );
}

export const SensorGrid = memo(SensorGridComponent);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    overflow: 'visible',
  },
  columnWrapper: {
    gap: 12,
  },
  rowGap: {
    height: 12,
  },
  sensorCard: {
    flex: 1,
    minHeight: 132,
    padding: 14,
    borderRadius: dashboardTheme.radii.md,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    gap: 8,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sensorName: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  sensorValue: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sensorUnit: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  sensorStatus: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});