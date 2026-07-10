import React, { memo } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import type { DashboardSensor } from '../../features/dashboard/dashboardTypes';
import { formatSensorValue, getSensorTone } from '../../features/dashboard/dashboardUtils';
import { SectionCard } from './SectionCard';

type SensorGridProps = {
  sensors: DashboardSensor[] | null;
};

function SensorCard({ sensor }: { sensor: DashboardSensor }) {
  const tone = getSensorTone(sensor.status);

  return (
    <View style={[styles.sensorCard, { borderColor: tone + '18' }]}>
      <View style={styles.iconRow}>
        <View style={[styles.iconBubble, { backgroundColor: tone + '12' }]}>
          <MaterialCommunityIcons name={sensor.icon as never} size={18} color={tone} />
        </View>
        <View style={[styles.statusTag, { backgroundColor: tone + '0F', borderColor: tone + '25' }]}>
          <Text style={[styles.statusTagText, { color: tone }]}>
            {sensor.status === 'good' ? 'Optimal' : sensor.status === 'warning' ? 'Monitor' : 'Alert'}
          </Text>
        </View>
      </View>

      <View style={styles.valueGroup}>
        <Text style={styles.sensorValue} numberOfLines={1}>
          {formatSensorValue(sensor.value)}
          <Text style={styles.sensorUnit}> {sensor.unit}</Text>
        </Text>
        <Text style={styles.sensorName} numberOfLines={1}>
          {sensor.name}
        </Text>
      </View>
    </View>
  );
}

const renderSensorItem = ({ item }: ListRenderItemInfo<DashboardSensor>) => (
  <SensorCard sensor={item} />
);

const renderSensorSeparator = () => <View style={styles.rowGap} />;

function SensorGridComponent({ sensors }: SensorGridProps) {
  const data = sensors ?? [];

  if (!data.length) {
    return (
      <SectionCard padding={18}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Environmental Sensors</Text>
          <Text style={styles.subtitle}>Waiting for live telemetry</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No sensor readings received yet.</Text>
        </View>
      </SectionCard>
    );
  }

  return (
    <SectionCard padding={18}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Environmental Sensors</Text>
        <Text style={styles.subtitle}>Live Indoor Analytics</Text>
      </View>

      <FlatList
        data={data}
        renderItem={renderSensorItem}
        keyExtractor={item => item.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={renderSensorSeparator}
        style={styles.list}
      />
    </SectionCard>
  );
}

export const SensorGrid = memo(SensorGridComponent);

const styles = StyleSheet.create({
  headerRow: {
    marginBottom: 16,
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: dashboardTheme.colors.textSecondary,
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  emptyState: {
    minHeight: 120,
    borderRadius: dashboardTheme.radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: dashboardTheme.colors.border,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyStateText: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  sensorCard: {
    flex: 1,
    minHeight: 124,
    padding: 14,
    borderRadius: dashboardTheme.radii.md,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    borderWidth: 1,
    gap: 16,
    justifyContent: 'space-between',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  valueGroup: {
    gap: 2,
  },
  sensorName: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sensorValue: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sensorUnit: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});