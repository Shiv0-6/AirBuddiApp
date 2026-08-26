import React, { memo, useCallback, useEffect, useState } from 'react';
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
  fanSpeed?: 'off' | '1' | '2' | '3';
  onTogglePower: () => void;
  onToggleAutoMode: (value: boolean) => void;
  onToggleSleepMode: (value: boolean) => void;
  onToggleUvc: (value: boolean) => void;
  onSelectFanSpeed: (speed: 'off' | '1' | '2' | '3') => void;
};

const SPEED_LABELS = ['Off', 'Low', 'Medium', 'High'] as const;
const SPEED_MAP: Record<string, 'off' | '1' | '2' | '3'> = {
  Off: 'off',
  Low: '1',
  Medium: '2',
  High: '3'
};
const SPEED_REVERSE_MAP: Record<string, string> = {
  off: 'Off',
  '1': 'Low',
  '2': 'Medium',
  '3': 'High'
};

const PRESETS = [
  {
    id: 'fresh',
    label: 'Fresh Air',
    hint: 'Auto · High speed',
    icon: 'weather-partly-cloudy',
    auto: true,
    uvc: true,
    speed: '3' as const,
  },
  {
    id: 'deep',
    label: 'Deep Clean',
    hint: 'Max filtration',
    icon: 'shield-check',
    auto: true,
    uvc: true,
    speed: '3' as const,
  },
] as const;

// ─── Fan rotation speeds ──────────────────────────────────────────────────────

const FAN_DURATIONS: Record<string, number> = {
  '1': 2400,
  '2': 1400,
  '3': 800
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
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const effectiveFanSpeed = isSleepMode ? 'off' : fanSpeed;

  useEffect(() => {
    if (isPoweredOn && effectiveFanSpeed !== 'off') {
      ringScale.value = withRepeat(withTiming(1.15, { duration: 2000 }), -1, true);
      ringOpacity.value = withRepeat(withTiming(0.4, { duration: 2000 }), -1, true);
      const duration = FAN_DURATIONS[effectiveFanSpeed] ?? 1400;
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
  }, [isPoweredOn, effectiveFanSpeed, ringScale, ringOpacity, rotation]);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const fanStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const activeSpeedLabel = SPEED_REVERSE_MAP[effectiveFanSpeed] ?? 'Medium';
  const presetControlsDisabled = !isPoweredOn;
  const manualControlsDisabled = !isPoweredOn || isAutoMode;

  const handleSpeedPress = useCallback((label: string) => {
    const mapped = SPEED_MAP[label];
    if (mapped) {
      setActivePresetId(null);
      onToggleAutoMode(false);
      onSelectFanSpeed(mapped);
    }
  }, [onSelectFanSpeed, onToggleAutoMode]);

  const handlePresetPress = useCallback((preset: (typeof PRESETS)[number]) => {
    setActivePresetId(preset.id);
    onToggleAutoMode(preset.auto);
    onToggleUvc(preset.uvc);
    onSelectFanSpeed(preset.speed);
  }, [onSelectFanSpeed, onToggleAutoMode, onToggleUvc]);

  const fanSpeedText = !isPoweredOn || effectiveFanSpeed === 'off'
    ? 'Off'
    : isAutoMode
    ? 'Auto'

    : fanSpeed === '3'
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

      {/* ── Operating Modes ──────────────────────────────────── */}
      <View style={[styles.section, styles.controlCard]}>
        <Text style={styles.sectionTitle}>Mode</Text>
        <View style={styles.modesRow}>
          <ModeCard
            iconName="auto-fix"
            label="Auto"
            value={isAutoMode && isPoweredOn}
            disabled={!isPoweredOn}
            onToggle={() => onToggleAutoMode(true)}
          />
          <ModeCard
            iconName="gesture-tap-button"
            label="Manual"
            value={!isAutoMode && !isSleepMode && isPoweredOn}
            disabled={!isPoweredOn}
            onToggle={() => {
              setActivePresetId(null);
              onToggleAutoMode(false);
              if (isSleepMode) onToggleSleepMode(false);
            }}
          />
          <ModeCard
            iconName="weather-night"
            label="Sleep"
            value={isSleepMode && isPoweredOn}
            disabled={!isPoweredOn}
            onToggle={() => {
              setActivePresetId(null);
              onToggleAutoMode(false);
              onToggleSleepMode(!isSleepMode);
            }}
          />
        </View>
      </View>

      {/* ── Focus Presets & UV-C ───────────────────────────────── */}
      <View style={[styles.section, styles.controlCard]}>
        <Text style={styles.sectionTitle}>Presets</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map(preset => {
            const isActive = preset.id === activePresetId;
            return (
              <TouchableOpacity
                key={preset.id}
                activeOpacity={0.8}
                disabled={presetControlsDisabled}
                onPress={() => handlePresetPress(preset)}
                style={[styles.presetCard, presetControlsDisabled && styles.controlDisabled, isActive && styles.presetCardActive]}
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
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={manualControlsDisabled}
            onPress={() => onToggleUvc(!isUvc)}
            style={[
              styles.presetCard,
              manualControlsDisabled && styles.controlDisabled,
              isUvc && isPoweredOn && styles.presetCardActive,
            ]}
          >
            <MaterialCommunityIcons
              name="shield-sun-outline"
              size={24}
              color={isUvc && isPoweredOn ? '#FFFFFF' : dashboardTheme.colors.primary}
            />
            <Text style={[styles.presetLabel, isUvc && isPoweredOn && styles.presetLabelActive]} numberOfLines={1}>
              UV-C
            </Text>
            <Text style={[styles.presetHintText, isUvc && isPoweredOn && styles.presetHintTextActive]} numberOfLines={1}>
              {isUvc && isPoweredOn ? 'Active' : 'Off'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Fan Speed & Power Section ───────────────────────────── */}
      <View style={[styles.section, styles.fanCard]}>
        <View style={styles.fanHeader}>
          <View style={styles.fanIconWrapper}>
            <Animated.View style={fanStyle}>
              <MaterialCommunityIcons
                name="fan"
                size={22}
                color={isPoweredOn && effectiveFanSpeed !== 'off' ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
              />
            </Animated.View>
          </View>
          <View style={styles.fanHeaderCopy}>
            <Text style={styles.fanTitle}>Fan Control</Text>
            <Text style={styles.fanLabel}>{fanSpeedText}</Text>
          </View>
          <View style={[styles.fanStatePill, isPoweredOn && styles.fanStatePillActive]}>
            <View style={[styles.fanStateDot, isPoweredOn && styles.fanStateDotActive]} />
            <Text style={[styles.fanStateText, isPoweredOn && styles.fanStateTextActive]}>
              {isAutoMode ? 'AUTO' : fanSpeedText.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.speedRow}>
          {SPEED_LABELS.map(label => {
            const isActive = label === activeSpeedLabel && isPoweredOn;
            return (
              <TouchableOpacity
                key={label}
                activeOpacity={0.75}
                disabled={manualControlsDisabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: manualControlsDisabled, selected: isActive }}
                onPress={() => handleSpeedPress(label)}
                style={[
                  styles.speedBtn,
                  manualControlsDisabled && styles.speedBtnDisabled,
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
  disabled?: boolean;
  onToggle: () => void;
};

function ModeCard({ iconName, label, value, disabled = false, onToggle }: ModeCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: value }}
      onPress={onToggle}
      style={[modeStyles.card, disabled && modeStyles.cardDisabled, value && modeStyles.cardActive]}
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
  fanCard: {
    marginHorizontal: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.lg,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.medium,
  },
  controlCard: {
    marginHorizontal: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.lg,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.medium,
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
  controlDisabled: { opacity: 0.45 },
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
  fanHeaderCopy: {
    flex: 1,
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
  fanStatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fanStatePillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  fanStateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  fanStateDotActive: {
    backgroundColor: dashboardTheme.colors.primary,
  },
  fanStateText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  fanStateTextActive: {
    color: dashboardTheme.colors.primaryDark,
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
    backgroundColor: '#F0FDF4',
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
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  cardActive: {
    borderColor: dashboardTheme.colors.primary,
    backgroundColor: dashboardTheme.colors.primarySoft,
  },
  cardDisabled: { opacity: 0.45 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    textAlign: 'center',
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
