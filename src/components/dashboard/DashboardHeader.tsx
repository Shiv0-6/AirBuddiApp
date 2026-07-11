import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  onProfilePress: () => void;
};

function DashboardHeaderComponent({ title, subtitle, onProfilePress }: DashboardHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topActionRow}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <MaterialCommunityIcons name="air-filter" size={20} color={dashboardTheme.colors.primary} />
          </View>
          <Text style={styles.brandText}>AIRBUDDI</Text>
        </View>

        <TouchableOpacity
          accessibilityLabel="Open profile"
          onPress={onProfilePress}
          style={styles.profileBtn}
          activeOpacity={0.75}
        >
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>AB</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.welcomeText}>Your space</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <View style={styles.statusDot} />
        </View>
        <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroSection: {
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.colors.success,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: dashboardTheme.colors.textMuted,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  profileBtn: {
    padding: 2,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: dashboardTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: dashboardTheme.colors.surfaceElevated,
    ...dashboardTheme.shadows.soft,
  },
  avatarText: {
    color: dashboardTheme.colors.dark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
