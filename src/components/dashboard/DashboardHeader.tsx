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
      {/* Top Status Bar like row */}
      <View style={styles.topActionRow}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name="menu"
            size={24}
            color={dashboardTheme.colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.rightGroup}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={22}
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

          <TouchableOpacity style={styles.profileBtn} activeOpacity={0.7}>
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={20} color={dashboardTheme.colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Welcome Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="sparkles" size={14} color={dashboardTheme.colors.primary} />
          <Text style={styles.heroBadgeText}>Live • 24/7 protection</Text>
        </View>
        <Text style={styles.welcomeText}>Hello, User</Text>
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
    marginBottom: 24,
  },
  heroSection: {
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  heroBadgeText: {
    color: dashboardTheme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
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
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: dashboardTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...dashboardTheme.shadows.soft,
  },
  profileBtn: {
    marginLeft: 4,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: dashboardTheme.colors.surface,
    ...dashboardTheme.shadows.soft,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: dashboardTheme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: dashboardTheme.colors.surface,
  },
  badgeText: {
    color: dashboardTheme.colors.lightText,
    fontSize: 8,
    fontWeight: '900',
  },
});
