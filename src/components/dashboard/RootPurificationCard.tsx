import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type RootPurificationCardProps = {
  upperBedChamber?: 'Active' | 'Standby';
  lowerBedChamber?: 'Active' | 'Standby';
  onUpperPress?: () => void;
  onLowerPress?: () => void;
  disabled?: boolean;
};

export function RootPurificationCard({
  upperBedChamber = 'Active',
  lowerBedChamber = 'Standby',
  onUpperPress,
  onLowerPress,
  disabled = false,
}: RootPurificationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="sprout"
            size={24}
            color={dashboardTheme.colors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Root Purification</Text>
          <Text style={styles.subtitle}>Upper & lower bed chambers</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.chamberRow}>
        <View style={styles.chamberLeft}>
          <Text style={styles.chamberLabel}>Upper Bed Chamber</Text>
          <Text style={styles.chamberValue}>{upperBedChamber}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={disabled}
          onPress={onUpperPress}
          style={[styles.statusPill, disabled && styles.statusPillDisabled, upperBedChamber === 'Active' ? styles.statusPillOn : styles.statusPillOff]}
          accessibilityLabel="Toggle upper bed chamber"
        >
          <Text style={[styles.statusText, upperBedChamber === 'Active' ? styles.statusTextOn : styles.statusTextOff]}>
            {upperBedChamber}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chamberRow}>
        <View style={styles.chamberLeft}>
          <Text style={styles.chamberLabel}>Lower Bed Chamber</Text>
          <Text style={styles.chamberValue}>{lowerBedChamber}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={disabled}
          onPress={onLowerPress}
          style={[styles.statusPill, disabled && styles.statusPillDisabled, lowerBedChamber === 'Active' ? styles.statusPillOn : styles.statusPillOff]}
          accessibilityLabel="Toggle lower bed chamber"
        >
          <Text style={[styles.statusText, lowerBedChamber === 'Active' ? styles.statusTextOn : styles.statusTextOff]}>
            {lowerBedChamber}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.medium,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: dashboardTheme.colors.textMuted,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: dashboardTheme.colors.border,
    marginBottom: 14,
  },
  chamberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  chamberLeft: {
    flex: 1,
  },
  chamberLabel: {
    fontSize: 12,
    color: dashboardTheme.colors.textMuted,
    marginBottom: 3,
  },
  chamberValue: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillOn: {
    backgroundColor: dashboardTheme.colors.primarySoft,
    borderColor: dashboardTheme.colors.primary,
  },
  statusPillOff: {
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    borderColor: dashboardTheme.colors.border,
  },
  statusPillDisabled: { opacity: 0.45 },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextOn: {
    color: dashboardTheme.colors.primary,
  },
  statusTextOff: {
    color: dashboardTheme.colors.textMuted,
  },
});
