import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { SectionCard } from './SectionCard';

type ChamberStatusCardProps = {
  upperBedChamber?: 'Active' | 'Standby';
  lowerBedChamber?: 'Active' | 'Standby';
};

function ChamberRow({
  label,
  status,
}: {
  label: string;
  status: 'Active' | 'Standby';
}) {
  const isActive = status === 'Active';
  const tone = isActive ? dashboardTheme.colors.success : dashboardTheme.colors.textMuted;

  return (
    <View style={styles.chamberCard}>
      <View style={[styles.iconBubble, { backgroundColor: tone + '12' }]}>
        <MaterialCommunityIcons name="sprout" size={18} color={tone} />
      </View>
      <View style={styles.chamberCopy}>
        <Text style={styles.chamberLabel}>{label}</Text>
        <Text style={[styles.chamberValue, { color: tone }]}>{status}</Text>
      </View>
      <View style={[styles.statusTag, { backgroundColor: tone + '0F', borderColor: tone + '25' }]}>
        <Text style={[styles.statusTagText, { color: tone }]}>
          {isActive ? 'Running' : 'Idle'}
        </Text>
      </View>
    </View>
  );
}

function ChamberStatusCardComponent({
  upperBedChamber = 'Standby',
  lowerBedChamber = 'Standby',
}: ChamberStatusCardProps) {
  return (
    <SectionCard padding={18}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Bed Chambers</Text>
        <Text style={styles.subtitle}>Root Purification Status</Text>
      </View>

      <View style={styles.grid}>
        <ChamberRow label="Upper Chamber" status={upperBedChamber} />
        <ChamberRow label="Lower Chamber" status={lowerBedChamber} />
      </View>
    </SectionCard>
  );
}

export const ChamberStatusCard = memo(ChamberStatusCardComponent);

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
  grid: {
    gap: 12,
  },
  chamberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: dashboardTheme.radii.md,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chamberCopy: {
    flex: 1,
    gap: 2,
  },
  chamberLabel: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chamberValue: {
    fontSize: 16,
    fontWeight: '800',
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
});
