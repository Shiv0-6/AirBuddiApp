import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  showDeviceInfo?: boolean;
  onProfilePress: () => void;
  onRefreshPress: () => void;
  onMenuPress: () => void;
};

function DashboardHeaderComponent({title, subtitle, showDeviceInfo = true, onProfilePress, onRefreshPress, onMenuPress,}: DashboardHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topActionRow}>
        <View style={styles.brandRow}>
          <TouchableOpacity accessibilityLabel="Open profile" onPress={onProfilePress} activeOpacity={0.75} style={styles.brandMark}>
            <Image source={require('../../../assets/airbuddi-favicon.png')} style={styles.logoImage} resizeMode="contain" />
          </TouchableOpacity>
          <Text style={styles.brandText}>GREENVERSE</Text>
        </View>

        <View style={styles.actionsContainer}>
          {/* <TouchableOpacity accessibilityLabel="Refresh data" onPress={onRefreshPress} activeOpacity={0.75} style={styles.iconBtn}>
            <MaterialCommunityIcons name="refresh" size={20} color={dashboardTheme.colors.textSecondary} />
          </TouchableOpacity> */}
          <TouchableOpacity accessibilityLabel="More options" onPress={onMenuPress} activeOpacity={0.75} style={styles.iconBtn}>
            <MaterialCommunityIcons name="dots-vertical" size={23} color={dashboardTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      {showDeviceInfo && (
      <View style={styles.heroSection}>
        <Text style={styles.welcomeText}>Your Space</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.statusDot} />
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View> )}
    </View>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  topActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: dashboardTheme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: 27, height: 27 },
  brandText: { color: dashboardTheme.colors.textPrimary, fontSize: 14, fontWeight: '900', letterSpacing: 1.7 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: dashboardTheme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: dashboardTheme.colors.border, ...dashboardTheme.shadows.soft },
  heroSection: { gap: 5, paddingHorizontal: 2, paddingBottom: 10 },
  welcomeText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.colors.textMuted, letterSpacing: 0.2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: dashboardTheme.colors.primary, marginTop: 5 },
  title: { flexShrink: 1, fontSize: 28, fontWeight: '800', color: dashboardTheme.colors.textPrimary, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, fontWeight: '500', color: dashboardTheme.colors.textMuted , marginTop:1, },
});
