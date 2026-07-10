import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  notificationCount: number;
};

function DashboardHeaderComponent({ title, subtitle, notificationCount }: DashboardHeaderProps) {
  const count = Math.max(0, notificationCount);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerCard}>
        {/* Top row: back arrow | title | settings + notifications */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.circleBtn} activeOpacity={0.75}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={22}
              color={dashboardTheme.colors.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.titleGroup}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </Text>
          </View>

          <View style={styles.rightGroup}>
            <TouchableOpacity style={styles.circleBtn} activeOpacity={0.75}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={20}
                color={dashboardTheme.colors.textPrimary}
              />
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.circleBtn} activeOpacity={0.75}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={20}
                color={dashboardTheme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
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
  headerCard: {
    borderRadius: dashboardTheme.radii.xl,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleGroup: {
    flex: 1,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 220,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: dashboardTheme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.surface,
  },
  badgeText: {
    color: dashboardTheme.colors.lightText,
    fontSize: 10,
    fontWeight: '900',
  },
});
