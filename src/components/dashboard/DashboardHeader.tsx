import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type DashboardHeaderProps = {
  greeting: string;
  userName: string;
  notificationCount: number;
};

function DashboardHeaderComponent({ greeting, userName, notificationCount }: DashboardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copyGroup}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.iconButton}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={dashboardTheme.colors.textPrimary} />
          {notificationCount > 0 ? (
            <View style={styles.badgeContainer}>
              <View style={styles.badgePulse} />
              <View style={styles.badge} />
            </View>
          ) : null}
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  copyGroup: {
    gap: 4,
  },
  greeting: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userName: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  badgeContainer: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: dashboardTheme.colors.danger,
    opacity: 0.35,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.colors.danger,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.primary,
    borderWidth: 1.5,
    borderColor: dashboardTheme.colors.primarySoft,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});