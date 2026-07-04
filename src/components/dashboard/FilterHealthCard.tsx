import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { clamp } from '../../features/dashboard/dashboardUtils';
import { SectionCard } from './SectionCard';

type FilterHealthCardProps = {
  health: number | null;
  remainingLifeDays: number | null;
};

function FilterHealthCardComponent({ health, remainingLifeDays }: FilterHealthCardProps) {
  if (health === null || remainingLifeDays === null) {
    return (
      <SectionCard>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={[styles.iconContainer, { backgroundColor: dashboardTheme.colors.surfaceTint }]}>
              <MaterialCommunityIcons name="air-filter" size={20} color={dashboardTheme.colors.textMuted} />
            </View>
            <View>
              <Text style={styles.title}>Filter Integrity</Text>
              <Text style={styles.subtitle}>Waiting for live filter telemetry</Text>
            </View>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No filter health data received yet.</Text>
        </View>
      </SectionCard>
    );
  }

  const clamped = clamp(health, 0, 100);

  const getStatusColor = (val: number) => {
    if (val > 50) return dashboardTheme.colors.success;
    if (val > 20) return dashboardTheme.colors.warning;
    return dashboardTheme.colors.danger;
  };

  const getStatusText = (val: number) => {
    if (val > 50) return 'Optimal Performance';
    if (val > 20) return 'Monitor Condition';
    return 'Replace HEPA Filter';
  };

  const color = getStatusColor(clamped);
  const statusNote = getStatusText(clamped);

  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            <MaterialCommunityIcons name="air-filter" size={20} color={color} />
          </View>
          <View>
            <Text style={styles.title}>Filter Integrity</Text>
            <Text style={styles.subtitle}>{statusNote}</Text>
          </View>
        </View>
        <Text style={[styles.percent, { color }]}>{clamped}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clamped}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>LIFE EXPECTANCY</Text>
          <Text style={styles.footerValue}>{remainingLifeDays} days left</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: color + '30', backgroundColor: color + '10' }]}>
          <Text style={[styles.statusBadgeText, { color }]}>
            {clamped > 20 ? 'Active' : 'Replace'}
          </Text>
        </View>
      </View>
    </SectionCard>
  );
}

export const FilterHealthCard = memo(FilterHealthCardComponent);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  percent: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  progressTrack: {
    marginTop: 20,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  footerRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCol: {
    gap: 2,
  },
  footerLabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  footerValue: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  emptyState: {
    marginTop: 18,
    padding: 16,
    borderRadius: dashboardTheme.radii.md,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  emptyStateText: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});