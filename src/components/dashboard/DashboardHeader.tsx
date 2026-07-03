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
          {notificationCount > 0 ? <View style={styles.badge} /> : null}
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
  },
  copyGroup: {
    gap: 6,
  },
  greeting: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  userName: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.colors.danger,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.textPrimary,
  },
  avatarText: {
    color: dashboardTheme.colors.lightText,
    fontSize: 16,
    fontWeight: '700',
  },
});