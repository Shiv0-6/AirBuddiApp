import React, { memo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Switch,
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

// Maps 5 UI speed buttons to the 4 actual speed values
const SPEED_LABELS = ['1', '2', '3', '4', '5'] as const;
const SPEED_MAP: Record<string, '1' | '2' | '3' | 'turbo'> = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4': 'turbo',
  '5': 'turbo',
};
const SPEED_REVERSE_MAP: Record<string, string> = {
  '1': '1',
  '2': '2',
  '3': '3',
  turbo: '4',
};

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
  const ringOpacity = useSharedValue(0.25);

  // Fan rotation
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPoweredOn) {
      ringScale.value = withRepeat(withTiming(1.12, { duration: 1800 }), -1, true);
      ringOpacity.value = withRepeat(withTiming(0.5, { duration: 1800 }), -1, true);

      const duration = FAN_DURATIONS[fanSpeed] ?? 1400;
      rotation.value = withRepeat(
        withTiming(360, { duration, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      ringScale.value = withTiming(1, { duration: 500 });
      ringOpacity.value = withTiming(0.25, { duration: 500 });
      rotation.value = withTiming(0, { duration: 600 });
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

  // Fan speed label text
  const fanSpeedText = isAutoMode
    ? 'Auto mode'
    : fanSpeed === 'turbo'
    ? 'Turbo'
    : `Level ${fanSpeed}`;

  return (
    <View style={styles.container}>

      {/* ── Power Ring Button ─────────────────────────────── */}
      <View style={styles.powerSection}>
        {/* Outermost faint ring (animated pulse) */}
        <Animated.View style={[styles.ringOuter, outerRingStyle]} />
        {/* Mid decorative ring */}
        <View style={styles.ringMid} />
        {/* Inner solid button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onTogglePower}
          style={[styles.powerBtn, isPoweredOn && styles.powerBtnOn]}
        >
          <MaterialCommunityIcons
            name="power"
            size={34}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* ── Air Purifier Control Cards ────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Air purifier control</Text>

        <View style={styles.modesRow}>
          {/* Auto mode */}
          <ModeCard
            icon={<Text style={styles.modeIconText}>A</Text>}
            label="Auto mode"
            value={isAutoMode}
            onToggle={onToggleAutoMode}
          />
          {/* Sleep mode */}
          <ModeCard
            icon={
              <MaterialCommunityIcons
                name="weather-night"
                size={20}
                color={isSleepMode ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
              />
            }
            label="Sleep mode"
            value={isSleepMode}
            onToggle={onToggleSleepMode}
          />
          {/* UV-C */}
          <ModeCard
            icon={
              <MaterialCommunityIcons
                name="white-balance-sunny"
                size={20}
                color={isUvc ? dashboardTheme.colors.primary : dashboardTheme.colors.textMuted}
              />
            }
            label="UV-C"
            value={isUvc}
            onToggle={onToggleUvc}
          />
        </View>
      </View>

      {/* ── Fan Speed ─────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.fanHeader}>
          <Animated.View style={fanStyle}>
            <MaterialCommunityIcons
              name="fan"
              size={22}
              color={isPoweredOn ? dashboardTheme.colors.textPrimary : dashboardTheme.colors.textMuted}
            />
          </Animated.View>
          <Text style={styles.fanLabel}>Fan speed: {fanSpeedText}</Text>
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
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
};

function ModeCard({ icon, label, value, onToggle }: ModeCardProps) {
  return (
    <View style={modeStyles.card}>
      <View style={modeStyles.iconWrap}>{icon}</View>
      <Text style={modeStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E2E8F0', true: dashboardTheme.colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E2E8F0"
        style={modeStyles.switch}
      />
    </View>
  );
}

export const QuickControls = memo(QuickControlsComponent);

// ─── Styles ───────────────────────────────────────────────────────────────────

const POWER_BTN_SIZE = 80;
const RING_MID_SIZE = 130;
const RING_OUTER_SIZE = 170;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 0,
  },

  // Power
  powerSection: {
    width: RING_OUTER_SIZE + 40,
    height: RING_OUTER_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ringOuter: {
    position: 'absolute',
    width: RING_OUTER_SIZE,
    height: RING_OUTER_SIZE,
    borderRadius: RING_OUTER_SIZE / 2,
    borderWidth: 3,
    borderColor: dashboardTheme.colors.primary,
  },
  ringMid: {
    position: 'absolute',
    width: RING_MID_SIZE,
    height: RING_MID_SIZE,
    borderRadius: RING_MID_SIZE / 2,
    borderWidth: 2.5,
    borderColor: `${dashboardTheme.colors.primary}55`,
  },
  powerBtn: {
    width: POWER_BTN_SIZE,
    height: POWER_BTN_SIZE,
    borderRadius: POWER_BTN_SIZE / 2,
    backgroundColor: '#C8C8C8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  powerBtnOn: {
    backgroundColor: dashboardTheme.colors.primary,
  },

  // Section
  section: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: dashboardTheme.colors.textPrimary,
    marginBottom: 12,
  },

  // Modes row
  modesRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Mode icon text (the "A" letter for Auto)
  modeIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
    width: 26,
    height: 26,
    textAlign: 'center',
    lineHeight: 26,
  },

  // Fan speed
  fanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  fanLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: dashboardTheme.colors.textPrimary,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  speedBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  speedBtnDisabled: {
    opacity: 0.45,
  },
  speedBtnActive: {
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: dashboardTheme.colors.textPrimary,
  },
  speedBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: dashboardTheme.colors.textSecondary,
  },
  speedBtnTextActive: {
    color: dashboardTheme.colors.textPrimary,
    fontWeight: '800',
  },
});

const modeStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.md,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});