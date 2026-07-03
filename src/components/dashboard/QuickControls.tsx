import React, { memo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { SectionCard } from './SectionCard';

type QuickControlsProps = {
  isPoweredOn: boolean;
  isAutoMode: boolean;
  onTogglePower: () => void;
  onCycleFanSpeed: () => void;
  onToggleAutoMode: (value: boolean) => void;
};

function QuickControlsComponent({
  isPoweredOn,
  isAutoMode,
  onTogglePower,
  onCycleFanSpeed,
  onToggleAutoMode,
}: QuickControlsProps) {
  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Quick Controls</Text>
        <Text style={styles.subtitle}>Instant device actions</Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onTogglePower}
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryButton,
            !isPoweredOn && styles.powerOff,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="power" size={20} color={dashboardTheme.colors.lightText} />
          <Text style={styles.primaryButtonText}>{isPoweredOn ? 'Power Off' : 'Power On'}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onCycleFanSpeed}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="fan" size={20} color={dashboardTheme.colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>Fan Speed</Text>
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Auto Mode</Text>
          <Text style={styles.toggleCaption}>Let the purifier manage fan speed automatically</Text>
        </View>
        <Switch
          value={isAutoMode}
          onValueChange={onToggleAutoMode}
          trackColor={{ false: dashboardTheme.colors.border, true: dashboardTheme.colors.primarySoft }}
          thumbColor={isAutoMode ? dashboardTheme.colors.primary : dashboardTheme.colors.surface}
        />
      </View>
    </SectionCard>
  );
}

export const QuickControls = memo(QuickControlsComponent);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: dashboardTheme.radii.md,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  primaryButton: {
    backgroundColor: dashboardTheme.colors.primary,
    borderColor: dashboardTheme.colors.primary,
  },
  powerOff: {
    backgroundColor: dashboardTheme.colors.dark,
    borderColor: dashboardTheme.colors.dark,
  },
  primaryButtonText: {
    color: dashboardTheme.colors.lightText,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  toggleRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleLabel: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  toggleCaption: {
    color: dashboardTheme.colors.textSecondary,
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 250,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.985 }],
  },
});