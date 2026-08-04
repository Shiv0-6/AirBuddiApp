import React, { memo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuickControlsProps = {
  isPoweredOn: boolean;
  isAutoMode: boolean;
  isSleepMode: boolean;
  isUvc: boolean;
  fanSpeed?: '1' | '2' | '3' | 'turbo';
  onTogglePower: () => void;
  onToggleAutoMode: (value: boolean) => void;
  onToggleSleepMode: (value: boolean) => void;
  onToggleUvc: (value: boolean) => void;
  onSelectFanSpeed: (speed: '1' | '2' | '3' | 'turbo') => void;
};

const SPEED_LABELS = ['Low', 'Medium', 'High'] as const;
const SPEED_MAP: Record<string, '1' | '2' | '3' | 'turbo'> = {
  Low: '1',
  Medium: '2',
  High: '3',
};
const SPEED_REVERSE_MAP: Record<string, string> = {
  '1': 'Low',
  '2': 'Medium',
  '3': 'High',
  turbo: 'High',
};

const PRESETS = [
  {
    id: 'fresh',
    label: 'Fresh Air',
    hint: 'Auto · Turbo speed',
    icon: 'weather-partly-cloudy',
    auto: true,
    sleep: false,
    uvc: true,
    speed: 'turbo' as const,
  },
  {
    id: 'sleep',
    label: 'Quiet Sleep',
    hint: 'Silent · Low noise',
    icon: 'weather-night',
    auto: false,
    sleep: true,
    uvc: false,
    speed: '1' as const,
  },
  {
    id: 'deep',
    label: 'Deep Clean',
    hint: 'Max filtration',
    icon: 'shield-check',
    auto: true,
    sleep: false,
    uvc: true,
    speed: '3' as const,
  },
] as const;

// ─── Fan rotation speeds ──────────────────────────────────────────────────────

const FAN_DURATIONS: Record<string, number> = {
  '1': 2400,
  '2': 1400,
  '3': 800,
  turbo: 380,
};

// ─── Component ────────────────────────────────────────────────────────────────

function QuickControlsComponent({
  isPoweredOn,
  isAutoMode,
  isSleepMode,
  isUvc,
  fanSpeed = '2',
  onTogglePower,
  onToggleAutoMode,
  onToggleSleepMode,
  onToggleUvc,
  onSelectFanSpeed,
}: QuickControlsProps) {
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.15);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPoweredOn) {
      ringScale.value = withRepeat(withTiming(1.15, { duration: 2000 }), -1, true);
      ringOpacity.value = withRepeat(withTiming(0.4, { duration: 2000 }), -1, true);
      const duration = FAN_DURATIONS[fanSpeed] ?? 1400;
      rotation.value = withRepeat(
        withTiming(360, { duration, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      ringScale.value = withTiming(1, { duration: 500 });
      ringOpacity.value = withTiming(0.15, { duration: 500 });
      rotation.value = withTiming(0, { duration: 1000 });
    }
  }, [isPoweredOn, fanSpeed, ringScale, ringOpacity, rotation]);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const fanStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const activeSpeedLabel = SPEED_REVERSE_MAP[fanSpeed] ?? 'Medium';

  const handleSpeedPress = useCallback((label: string) => {
    const mapped = SPEED_MAP[label];
    if (mapped) { onSelectFanSpeed(mapped); }
  }, [onSelectFanSpeed]);

  const handlePresetPress = useCallback((preset: (typeof PRESETS)[number]) => {
    onToggleAutoMode(preset.auto);
    onToggleSleepMode(preset.sleep);
    onToggleUvc(preset.uvc);
    onSelectFanSpeed(preset.speed);
  }, [onSelectFanSpeed, onToggleAutoMode, onToggleSleepMode, onToggleUvc]);

  const activePresetId = isSleepMode
    ? 'sleep'
    : isAutoMode && fanSpeed === 'turbo'
    ? 'fresh'
    : isAutoMode && fanSpeed === '3'
    ? 'deep'
    : null;

  const fanSpeedText = !isPoweredOn
    ? 'Off'
    : isAutoMode
    ? 'Auto'
    : fanSpeed === 'turbo' || fanSpeed === '3'
    ? 'High'
    : fanSpeed === '2'
    ? 'Medium'
    : 'Low';

  return (
    <View style={styles.container}>
      {/* ── Power Button Hero ──────────────────────────────────── */}
      <View style={styles.statusHero}>
        <View style={styles.powerSection}>
          <Animated.View style={[styles.ringOuter, outerRingStyle]} />
          <View style={styles.ringMid} />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onTogglePower}
            style={[styles.powerBtn, isPoweredOn && styles.powerBtnOn]}
          >
            <MaterialCommunityIcons
              name="power"
              size={40}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.statusText, isPoweredOn && styles.statusTextOn]}>
          {isPoweredOn ? 'Active' : 'Standby'}
        </Text>
      </View>

      {/* ── Focus Presets ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Presets</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map(preset => {
            const isActive = preset.id === activePresetId;
            return (
              <TouchableOpacity
                key={preset.id}
                activeOpacity={0.8}
                onPress={() => handlePresetPress(preset)}
                style={[styles.presetCard, isActive && styles.presetCardActive]}
              >
                <MaterialCommunityIcons
                  name={preset.icon}
                  size={24}
                  color={isActive ? '#FFFFFF' : dashboardTheme.colors.primary}
                />
                <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]} numberOfLines={1}>
                  {preset.label}
                </Text>
                <Text style={[styles.presetHintText, isActive && styles.presetHintTextActive]} numberOfLines={1}>
                  {preset.hint}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Fan Modes ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode</Text>
        <View style={styles.modesRow}>
          <ModeCard
            iconName="auto-fix"
            label="Auto"
            value={isAutoMode}
            onToggle={() => onToggleAutoMode(true)}
          />
          <ModeCard
            iconName="gesture-tap-button"
            label="Manual"
            value={!isAutoMode && isPoweredOn}
            onToggle={() => onToggleAutoMode(false)}
          />
          <ModeCard
            iconName="power"
            label="Off"
            value={!isPoweredOn}
            onToggle={onTogglePower}
          />
        </View>
      </View>

      {/* ── Fan Speed ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.fanHeader}>
          <View style={styles.fanIconWrapper}>
            <Animated.View style={fanStyle}>
              <MaterialCommunityIcons
                name="fan"
                size={22}
                color={isPoweredOn ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
              />
            </Animated.View>
          </View>
          <View>
            <Text style={styles.fanTitle}>Fan Speed</Text>
            <Text style={styles.fanLabel}>{fanSpeedText}</Text>
          </View>
        </View>

        <View style={styles.speedRow}>
          {SPEED_LABELS.map(label => {
            const isActive = label === activeSpeedLabel && isPoweredOn;
            return (
              <TouchableOpacity
                key={label}
                activeOpacity={0.75}
                disabled={!isPoweredOn}
                onPress={() => handleSpeedPress(label)}
                style={[
                  styles.speedBtn,
                  !isPoweredOn && styles.speedBtnDisabled,
                  isActive && styles.speedBtnActive,
                ]}
              >
                <Text style={[styles.speedBtnText, isActive && styles.speedBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── ModeCard ─────────────────────────────────────────────────────────────────

type ModeCardProps = {
  iconName: string;
  label: string;
  value: boolean;
  onToggle: () => void;
};

function ModeCard({ iconName, label, value, onToggle }: ModeCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onToggle}
      style={[modeStyles.card, value && modeStyles.cardActive]}
    >
      <View style={[modeStyles.iconWrap, value && modeStyles.iconWrapActive]}>
        <MaterialCommunityIcons
          name={iconName}
          size={22}
          color={value ? '#FFFFFF' : dashboardTheme.colors.textMuted}
        />
      </View>
      <Text style={[modeStyles.label, value && modeStyles.labelActive]}>{label}</Text>
      <View style={[modeStyles.indicator, value && modeStyles.indicatorActive]} />
    </TouchableOpacity>
  );
}

export const QuickControls = memo(QuickControlsComponent);

// ─── Styles ───────────────────────────────────────────────────────────────────

const POWER_BTN_SIZE = 88;
const RING_MID_SIZE = 138;
const RING_OUTER_SIZE = 176;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },

  // Hero
  statusHero: {
    alignItems: 'center',
    marginVertical: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.colors.textMuted,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  statusTextOn: {
    color: dashboardTheme.colors.primary,
  },

  // Power rings
  powerSection: {
    width: RING_OUTER_SIZE + 20,
    height: RING_OUTER_SIZE + 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: RING_OUTER_SIZE,
    height: RING_OUTER_SIZE,
    borderRadius: RING_OUTER_SIZE / 2,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.primary,
  },
  ringMid: {
    position: 'absolute',
    width: RING_MID_SIZE,
    height: RING_MID_SIZE,
    borderRadius: RING_MID_SIZE / 2,
    borderWidth: 1.5,
    borderColor: `${dashboardTheme.colors.primary}33`,
  },
  powerBtn: {
    width: POWER_BTN_SIZE,
    height: POWER_BTN_SIZE,
    borderRadius: POWER_BTN_SIZE / 2,
    backgroundColor: '#B0BFBA',
    alignItems: 'center',
    justifyContent: 'center',
    ...dashboardTheme.shadows.medium,
  },
  powerBtnOn: {
    backgroundColor: dashboardTheme.colors.primary,
  },

  // Section
  section: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  // Presets
  presetGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  presetCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: dashboardTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...dashboardTheme.shadows.soft,
  },
  presetCardActive: {
    borderColor: dashboardTheme.colors.primary,
    backgroundColor: dashboardTheme.colors.primary,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
    textAlign: 'center',
  },
  presetLabelActive: {
    color: '#FFFFFF',
  },
  presetHintText: {
    fontSize: 10,
    fontWeight: '600',
    color: dashboardTheme.colors.textMuted,
    textAlign: 'center',
  },
  presetHintTextActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // Modes
  modesRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Fan speed
  fanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  fanIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: dashboardTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.soft,
  },
  fanTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
  },
  fanLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: dashboardTheme.colors.textMuted,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  speedBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: dashboardTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.soft,
  },
  speedBtnDisabled: {
    opacity: 0.45,
  },
  speedBtnActive: {
    borderColor: dashboardTheme.colors.primary,
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  speedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.colors.textSecondary,
  },
  speedBtnTextActive: {
    color: dashboardTheme.colors.primaryDark,
  },
});

const modeStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.soft,
  },
  cardActive: {
    borderColor: dashboardTheme.colors.primary,
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: dashboardTheme.colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.colors.textSecondary,
  },
  labelActive: {
    color: dashboardTheme.colors.primaryDark,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: dashboardTheme.colors.primary,
  },
});