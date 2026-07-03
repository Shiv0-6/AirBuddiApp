import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import type { DashboardDevice } from '../../features/dashboard/dashboardTypes';
import { SectionCard } from './SectionCard';

type DeviceCardProps = {
  device: DashboardDevice;
};

function DeviceCardComponent({ device }: DeviceCardProps) {
  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{device.name}</Text>
          <Text style={styles.subtitle}>Last updated {device.lastUpdated}</Text>
        </View>
        <View style={styles.statusChip}>
          <View style={[styles.statusDot, device.status === 'Online' ? styles.online : styles.offline]} />
          <Text style={styles.statusText}>{device.status}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="shield-check-outline" size={19} color={dashboardTheme.colors.primary} />
          <Text style={styles.metaLabel}>Mode</Text>
          <Text style={styles.metaValue}>{device.mode === 'auto' ? 'Auto' : 'Manual'}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons
            name={device.power === 'on' ? 'power-plug' : 'power-plug-off'}
            size={19}
            color={device.power === 'on' ? dashboardTheme.colors.success : dashboardTheme.colors.textMuted}
          />
          <Text style={styles.metaLabel}>Power</Text>
          <Text style={styles.metaValue}>{device.power === 'on' ? 'ON' : 'OFF'}</Text>
        </View>
      </View>
    </SectionCard>
  );
}

export const DeviceCard = memo(DeviceCardComponent);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: dashboardTheme.colors.textSecondary,
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  online: {
    backgroundColor: dashboardTheme.colors.success,
  },
  offline: {
    backgroundColor: dashboardTheme.colors.danger,
  },
  statusText: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaGrid: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    padding: 14,
    borderRadius: dashboardTheme.radii.md,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    gap: 6,
  },
  metaLabel: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});