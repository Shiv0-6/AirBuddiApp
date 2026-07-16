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

// ─── Types ───────────────────────────────────────────────────────────────────

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

// Maps the visible fan speed labels to the app's underlying speed values
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
    hint: 'Auto + Turbo',
    icon: 'weather-partly-cloudy',
    auto: true,
    sleep: false,
    uvc: true,
    speed: 'turbo' as const,
  },
  {
    id: 'sleep',
    label: 'Quiet Sleep',
    hint: 'Low noise',
    icon: 'weather-night',
    auto: false,
    sleep: true,
    uvc: false,
    speed: '1' as const,
  },
  {
    id: 'deep',
    label: 'Deep Clean',
    hint: 'Maximum filtration',
    icon: 'shield-check',
    auto: true,
    sleep: false,
    uvc: true,
    speed: '3' as const,
  },
] as const;

// ─── Fan icon rotation ────────────────────────────────────────────────────────

const FAN_DURATIONS: Record<string, number> = {
  '1': 2400,
  '2': 1400,
  '3': 800,
  turbo: 380,
};

// ─── Component ───────────────────────────────────────────────────────────────

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
  // Power ring pulse
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.2);

  // Fan rotation
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
      ringOpacity.value = withTiming(0.2, { duration: 500 });
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

  // Determine active UI speed button
  const activeSpeedLabel = SPEED_REVERSE_MAP[fanSpeed] ?? '2';

  const handleSpeedPress = useCallback((label: string) => {
    const mapped = SPEED_MAP[label];
    if (mapped) onSelectFanSpeed(mapped);
  }, [onSelectFanSpeed]);

  const handlePresetPress = useCallback((preset: (typeof PRESETS)[number]) => {
    onToggleAutoMode(preset.auto);
    onToggleSleepMode(preset.sleep);
    onToggleUvc(preset.uvc);
    onSelectFanSpeed(preset.speed);
  }, [onSelectFanSpeed, onToggleAutoMode, onToggleSleepMode, onToggleUvc]);

  const activePresetId = isSleepMode ? 'sleep' : isAutoMode && fanSpeed === 'turbo' ? 'fresh' : isAutoMode && fanSpeed === '3' ? 'deep' : null;

  // Fan speed label text
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
      {/* ── Visual Status Area ────────────────────────────── */}
      <View style={styles.statusHero}>
        <View style={styles.powerSection}>
          <Animated.View style={[styles.ringOuter, outerRingStyle]} />
          <View style={styles.ringMid} />
          <TouchableOpacity
            activeOpacity={0.9}
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
          Device is {isPoweredOn ? 'Active' : 'Standby'}
        </Text>
      </View>

      {/* ── Focus presets ───────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Focus presets</Text>
          <Text style={styles.sectionHint}>Tap a preset to instantly refine your space.</Text>
        </View>
        <View style={styles.presetGrid}>
          {PRESETS.map(preset => {
            const isActive = preset.id === activePresetId;
            return (
              <TouchableOpacity
                key={preset.id}
                activeOpacity={0.85}
                onPress={() => handlePresetPress(preset)}
                style={[styles.presetCard, isActive && styles.presetCardActive]}
              >
                <View style={[styles.presetIconWrap, isActive && styles.presetIconWrapActive]}>
                  <MaterialCommunityIcons
                    name={preset.icon}
                    size={18}
                    color={isActive ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
                  />
                </View>
                <View style={styles.presetTextWrap}>
                  <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]}>{preset.label}</Text>
                  <Text style={styles.presetHintText}>{preset.hint}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Fan Modes ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fan Modes</Text>
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

      {/* ── Fan Speed Intensity ───────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.fanHeader}>
          <View style={styles.fanIconWrapper}>
            <Animated.View style={fanStyle}>
              <MaterialCommunityIcons
                name="fan"
                size={24}
                color={isPoweredOn ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
              />
            </Animated.View>
          </View>
          <View>
            <Text style={styles.fanTitle}>Fan Intensity</Text>
            <Text style={styles.fanLabel}>{fanSpeedText}</Text>
          </View>
        </View>

        <View style={styles.speedRow}>
          {SPEED_LABELS.map(label => {
            const isActive = label === activeSpeedLabel && isPoweredOn;
            return (
              <TouchableOpacity
                key={label}
                activeOpacity={0.7}
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
      activeOpacity={0.8}
      onPress={onToggle}
      style={[modeStyles.card, value && modeStyles.cardActive]}
    >
      <View style={[modeStyles.iconWrap, value && modeStyles.iconWrapActive]}>
        <MaterialCommunityIcons
          name={iconName}
          size={24}
          color={value ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
        />
      </View>
      <Text style={[modeStyles.label, value && modeStyles.labelActive]}>{label}</Text>
      <View style={[modeStyles.indicator, value && modeStyles.indicatorActive]} />
    </TouchableOpacity>
  );
}

export const QuickControls = memo(QuickControlsComponent);

// ─── Styles ───────────────────────────────────────────────────────────────────

const POWER_BTN_SIZE = 90;
const RING_MID_SIZE = 140;
const RING_OUTER_SIZE = 180;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  statusHero: {
    alignItems: 'center',
    marginVertical: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.colors.textMuted,
    marginTop: 10,
  },
  statusTextOn: {
    color: dashboardTheme.colors.primary,
  },

  // Power
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
    backgroundColor: '#CBD5E1',
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
    marginTop: 32,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  sectionHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.colors.textMuted,
  },
  presetGrid: {
    gap: 10,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.soft,
  },
  presetCardActive: {
    borderColor: dashboardTheme.colors.primary,
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  presetIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.surfaceElevated,
  },
  presetIconWrapActive: {
    backgroundColor: dashboardTheme.colors.surface,
  },
  presetTextWrap: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
  },
  presetLabelActive: {
    color: dashboardTheme.colors.primary,
  },
  presetHintText: {
    marginTop: 2,
    fontSize: 12,
    color: dashboardTheme.colors.textSecondary,
  },

  // Modes row
  modesRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Fan speed
  fanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  fanIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: dashboardTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...dashboardTheme.shadows.soft,
  },
  fanTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.colors.textPrimary,
  },
  fanLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: dashboardTheme.colors.textSecondary,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  speedBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: dashboardTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    ...dashboardTheme.shadows.soft,
  },
  speedBtnDisabled: {
    opacity: 0.5,
  },
  speedBtnActive: {
    borderColor: dashboardTheme.colors.primary,
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  speedBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.colors.textSecondary,
  },
  speedBtnTextActive: {
    color: dashboardTheme.colors.primary,
  },
});

const modeStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    ...dashboardTheme.shadows.medium,
  },
  cardActive: {
    borderColor: `${dashboardTheme.colors.primary}20`,
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
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.colors.textSecondary,
  },
  labelActive: {
    color: dashboardTheme.colors.textPrimary,
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