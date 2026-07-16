import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type LightControlPanelProps = {
  isLightOn: boolean;
  onTurnOn: () => void;
  onTurnOff: () => void;
};

export function LightControlPanel({ isLightOn, onTurnOn, onTurnOff }: LightControlPanelProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={isLightOn ? 'lightbulb-on' : 'lightbulb'}
            size={28}
            color={isLightOn ? dashboardTheme.colors.accent : dashboardTheme.colors.textMuted}
          />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Light Control</Text>
          <Text style={styles.subtitle}>
            {isLightOn ? 'Light is currently on' : 'Light is currently off'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          accessibilityLabel="Turn on light"
          activeOpacity={0.85}
          onPress={onTurnOn}
          style={[styles.button, styles.buttonPrimary, isLightOn && styles.buttonActive]}
        >
          <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Light On</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Turn off light"
          activeOpacity={0.85}
          onPress={onTurnOff}
          style={[styles.button, styles.buttonSecondary, !isLightOn && styles.buttonInactive]}
        >
          <MaterialCommunityIcons name="lightbulb-off-outline" size={18} color={dashboardTheme.colors.textPrimary} />
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Light Off</Text>
        </TouchableOpacity>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: dashboardTheme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
  },
  buttonActive: {
    backgroundColor: dashboardTheme.colors.accent,
  },
  buttonInactive: {
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    opacity: 0.85,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonTextSecondary: {
    color: dashboardTheme.colors.textPrimary,
  },
});
