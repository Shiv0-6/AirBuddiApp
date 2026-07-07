import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  notificationCount: number;
};

function DashboardHeaderComponent({ title }: DashboardHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {/* Top row: back arrow | title | settings */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.75}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={dashboardTheme.colors.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>

        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.75}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={20}
            color={dashboardTheme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Second row: timer icon (bottom-left) */}
      <View style={styles.secondRow}>
        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.75}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={dashboardTheme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
    letterSpacing: -0.2,
    marginHorizontal: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});