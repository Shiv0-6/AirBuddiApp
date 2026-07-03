import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { clamp } from '../../features/dashboard/dashboardUtils';
import { SectionCard } from './SectionCard';

type FilterHealthCardProps = {
  health: number;
  remainingLifeDays: number;
};

function FilterHealthCardComponent({ health, remainingLifeDays }: FilterHealthCardProps) {
  const clamped = clamp(health, 0, 100);

  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Filter Health</Text>
          <Text style={styles.subtitle}>Estimated remaining life</Text>
        </View>
        <Text style={styles.percent}>{clamped}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clamped}%` }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Life Remaining</Text>
        <Text style={styles.footerValue}>{remainingLifeDays} days</Text>
      </View>
    </SectionCard>
  );
}

export const FilterHealthCard = memo(FilterHealthCardComponent);

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
    marginTop: 5,
    fontSize: 13,
    fontWeight: '500',
  },
  percent: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  progressTrack: {
    marginTop: 16,
    height: 12,
    borderRadius: 999,
    backgroundColor: dashboardTheme.colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: dashboardTheme.colors.primary,
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  footerValue: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
});