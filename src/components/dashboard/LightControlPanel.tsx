import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type LightZone = {
  id: string;
  label: string;
  icon: string;
  isOn: boolean;
};

type LightControlPanelProps = {
  lights: LightZone[];
  onToggleLight: (lightId: string) => void;
};

export function LightControlPanel({ lights, onToggleLight }: LightControlPanelProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={28}
            color={dashboardTheme.colors.accent}
          />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Light Control</Text>
          <Text style={styles.subtitle}>Test lamp zones with professional lighting controls.</Text>
        </View>
      </View>

      <View style={styles.lightGrid}>
        {lights.map((light, index) => (
          <TouchableOpacity
            key={light.id}
            accessibilityLabel={`Toggle ${light.label}`}
            activeOpacity={0.88}
            onPress={() => onToggleLight(light.id)}
            style={[styles.lightCard, light.isOn && styles.lightCardActive]}
          >
            <View style={[styles.lightBadge, light.isOn && styles.lightBadgeActive]}>
              <MaterialCommunityIcons
                name={light.icon}
                size={20}
                color={light.isOn ? '#fff' : dashboardTheme.colors.textPrimary}
              />
            </View>
            <Text style={[styles.lightLabel, light.isOn && styles.lightLabelActive]}>{light.label}</Text>
            <Text style={styles.zoneLabel}>{`Zone ${index + 1}`}</Text>
            <Text style={[styles.statusPill, light.isOn && styles.statusPillActive]}>
              {light.isOn ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    marginTop: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.primarySoft,
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  lightGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  lightCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    alignItems: 'flex-start',
  },
  lightCardActive: {
    backgroundColor: dashboardTheme.colors.primarySoft,
    borderColor: dashboardTheme.colors.primary,
  },
  lightBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.surface,
    marginBottom: 10,
  },
  lightBadgeActive: {
    backgroundColor: dashboardTheme.colors.primary,
  },
  lightLabel: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  lightLabelActive: {
    color: dashboardTheme.colors.primary,
  },
  zoneLabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: dashboardTheme.colors.surface,
    color: dashboardTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  statusPillActive: {
    backgroundColor: dashboardTheme.colors.primary,
    color: '#fff',
  },
});
