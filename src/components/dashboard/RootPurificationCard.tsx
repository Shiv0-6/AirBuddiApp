import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  upperBedChamber = 'Standby',
  lowerBedChamber = 'Standby',
  onUpperPress,
  onLowerPress,
  disabled = false,
}: RootPurificationCardProps) {
  const isUpperActive = upperBedChamber === 'Active';
  const isLowerActive = lowerBedChamber === 'Active';
  const activeCount = (isUpperActive ? 1 : 0) + (isLowerActive ? 1 : 0);

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="sprout"
              size={24}
              color={dashboardTheme.colors.primary}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Root Purification</Text>
            <Text style={styles.subtitle}>Bio-bed air treatment</Text>
          </View>
        </View>
      </View>

      {/* ── 2-Column Grid Layout ────────────────────────────────────────── */}
      <View style={styles.gridContainer}>
        {/* Upper Bed Chamber Tile */}
        <ChamberGridTile
          label="Upper Chamber"
          subtitle="Top soil bio-bed"
          icon="flower-tulip-outline"
          isActive={isUpperActive}
          onPress={onUpperPress}
          disabled={disabled}
        />

        {/* Lower Bed Chamber Tile */}
        <ChamberGridTile
          label="Lower Chamber"
          subtitle="Sub-root bio-bed"
          icon="layers-triple-outline"
          isActive={isLowerActive}
          onPress={onLowerPress}
          disabled={disabled}
        />
      </View>

      {/* ── Footer Quick Status Bar ──────────────────────────────────────── */}
      <View style={styles.footerRow}>
        <MaterialCommunityIcons
          name="information-outline"
          size={14}
          color={dashboardTheme.colors.textMuted}
        />
        <Text style={styles.footerText}>
          {activeCount === 2
            ? 'Both chambers active'
            : activeCount === 1
            ? 'One chamber active'
            : 'Purification off'}
        </Text>
      </View>
    </View>
  );
}

function ChamberGridTile({
  label,
  subtitle,
  icon,
  isActive,
  onPress,
  disabled,
}: {
  label: string;
  subtitle: string;
  icon: string;
  isActive: boolean;
  onPress?: () => void;
  disabled: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled || !onPress) {
      return;
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.tileWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        onPress={handlePress}
        style={[
          styles.tile,
          isActive ? styles.tileActive : styles.tileInactive,
          disabled && styles.tileDisabled,
        ]}
      >
        <View style={styles.tileTopRow}>
          <View
            style={[
              styles.tileIconWrap,
              isActive ? styles.tileIconWrapActive : styles.tileIconWrapInactive,
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={22}
              color={isActive ? dashboardTheme.colors.primaryDark : dashboardTheme.colors.textMuted}
            />
          </View>

          <View style={[styles.powerBadge, isActive ? styles.powerBadgeActive : styles.powerBadgeInactive]}>
            <MaterialCommunityIcons
              name="power"
              size={14}
              color={isActive ? '#FFFFFF' : dashboardTheme.colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.tileBottom}>
          <Text style={styles.tileLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.tileSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          <View style={[styles.statusTag, isActive ? styles.statusTagActive : styles.statusTagInactive]}>
            <Text style={[styles.statusTagText, isActive ? styles.statusTagTextActive : styles.statusTagTextInactive]}>
              {isActive ? 'Active' : 'Standby'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginTop: 2,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  summaryBadgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  summaryBadgeInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryDotActive: {
    backgroundColor: '#16A34A',
  },
  summaryDotInactive: {
    backgroundColor: '#94A3B8',
  },
  summaryText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryTextActive: {
    color: '#16A34A',
  },
  summaryTextInactive: {
    color: '#64748B',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tileWrapper: {
    flex: 1,
  },
  tile: {
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 140,
    borderWidth: 1.5,
  },
  tileActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  tileInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconWrapActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  tileIconWrapInactive: {
    backgroundColor: '#E2E8F0',
  },
  powerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerBadgeActive: {
    backgroundColor: '#16A34A',
  },
  powerBadgeInactive: {
    backgroundColor: '#CBD5E1',
  },
  tileBottom: {
    gap: 2,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
  },
  tileSubtitle: {
    fontSize: 11,
    color: dashboardTheme.colors.textMuted,
    marginBottom: 8,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagActive: {
    backgroundColor: '#16A34A',
  },
  statusTagInactive: {
    backgroundColor: '#94A3B8',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusTagTextActive: {
    color: '#FFFFFF',
  },
  statusTagTextInactive: {
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
  },
  footerText: {
    fontSize: 11,
    color: dashboardTheme.colors.textMuted,
    fontWeight: '500',
  },
});
