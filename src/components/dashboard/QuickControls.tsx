import React, { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { SectionCard } from './SectionCard';

type QuickControlsProps = {
  isPoweredOn: boolean;
  isAutoMode: boolean;
  fanSpeed?: '1' | '2' | '3' | 'turbo';
  onTogglePower: () => void;
  onCycleFanSpeed: () => void;
  onToggleAutoMode: (value: boolean) => void;
};

function QuickControlsComponent({
  isPoweredOn,
  isAutoMode,
  fanSpeed = '2',
  onTogglePower,
  onCycleFanSpeed,
  onToggleAutoMode,
}: QuickControlsProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPoweredOn) {
      let duration = 3000;
      if (fanSpeed === '1') duration = 2000;
      else if (fanSpeed === '2') duration = 1200;
      else if (fanSpeed === '3') duration = 650;
      else if (fanSpeed === 'turbo') duration = 350;

      rotation.value = withRepeat(
        withTiming(360, { duration, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 600 });
    }
  }, [isPoweredOn, fanSpeed, rotation]);

  const animatedFanStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <SectionCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Quick Controls</Text>
        <Text style={styles.subtitle}>Instant Device Actions</Text>
      </View>

      <View style={styles.controlsRow}>
        {/* Power Toggle Button */}
        <Pressable
          accessibilityRole="button"
          onPress={onTogglePower}
          style={({ pressed }) => [
            styles.actionButton,
            isPoweredOn ? styles.powerOnButton : styles.powerOffButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="power"
            size={22}
            color="#FFFFFF"
          />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonLabel}>Purifier Power</Text>
            <Text style={styles.buttonSublabel}>{isPoweredOn ? 'ACTIVE' : 'STANDBY'}</Text>
          </View>
        </Pressable>

        {/* Fan Speed Cycle Button */}
        <Pressable
          accessibilityRole="button"
          onPress={onCycleFanSpeed}
          disabled={!isPoweredOn}
          style={({ pressed }) => [
            styles.actionButton,
            styles.fanButton,
            !isPoweredOn && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          <Animated.View style={animatedFanStyle}>
            <MaterialCommunityIcons
              name="fan"
              size={22}
              color={isPoweredOn ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
            />
          </Animated.View>
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonLabel, !isPoweredOn && { color: dashboardTheme.colors.textMuted }]}>
              Fan Speed
            </Text>
            <Text style={[styles.buttonSublabel, !isPoweredOn && { color: dashboardTheme.colors.textMuted }]}>
              {isPoweredOn ? (fanSpeed === 'turbo' ? 'Turbo' : `Speed ${fanSpeed}`) : 'OFF'}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="shield-sync"
              size={20}
              color={isAutoMode ? dashboardTheme.colors.primary : dashboardTheme.colors.textSecondary}
            />
          </View>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Auto Air Purify</Text>
            <Text style={styles.toggleCaption}>
              Purifier automatically manages fan speed based on AQI values
            </Text>
          </View>
        </View>
        <Switch
          value={isAutoMode}
          onValueChange={onToggleAutoMode}
          trackColor={{ false: 'rgba(255,255,255,0.06)', true: dashboardTheme.colors.primarySoft }}
          thumbColor={isAutoMode ? dashboardTheme.colors.primary : '#64748B'}
        />
      </View>
    </SectionCard>
  );
}

export const QuickControls = memo(QuickControlsComponent);

const styles = StyleSheet.create({
  headerRow: {
    marginBottom: 16,
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: dashboardTheme.colors.textSecondary,
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 60,
    borderRadius: dashboardTheme.radii.md,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  powerOnButton: {
    backgroundColor: dashboardTheme.colors.primary,
    borderColor: dashboardTheme.colors.primary,
  },
  powerOffButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  fanButton: {
    backgroundColor: dashboardTheme.colors.surfaceTint,
    borderColor: dashboardTheme.colors.border,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
  },
  buttonTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonSublabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  toggleRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContent: {
    flex: 1,
    gap: 3,
  },
  toggleLabel: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleCaption: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});