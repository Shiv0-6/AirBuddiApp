import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { clamp, getAqiDescriptor } from '../../features/dashboard/dashboardUtils';
import { SectionCard } from './SectionCard';

type AirQualityCardProps = {
  aqi: number | null;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AirQualityCardComponent({ aqi }: AirQualityCardProps) {
  const hasLiveAqi = aqi !== null;
  const safeAqi = aqi ?? 0;
  const descriptor = getAqiDescriptor(safeAqi);
  const progress = useSharedValue(0);
  const ratio = clamp(safeAqi / 200, 0, 1);

  // Pulse animation for the aura behind the text
  const auraScale = useSharedValue(0.9);
  const auraOpacity = useSharedValue(0.1);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 1200 });

    auraScale.value = withRepeat(
      withTiming(1.08, { duration: 2400 }),
      -1,
      true
    );
    auraOpacity.value = withRepeat(
      withTiming(0.2, { duration: 2400 }),
      -1,
      true
    );
  }, [progress, ratio, auraScale, auraOpacity]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOpacity.value,
  }));

  if (!hasLiveAqi) {
    return (
      <SectionCard tone="default" padding={24}>
        <View style={styles.header}>
          <Text style={styles.title}>Air Quality Index</Text>
          <Text style={styles.subtitle}>Purifier Zone Telemetry</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyValue}>--</Text>
          <Text style={styles.emptyLabel}>AQI</Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.badge, styles.badgeNeutral]}>
            <Text style={styles.badgeText}>WAITING FOR DATA</Text>
          </View>
          <Text style={styles.description}>
            Connecting to your AirBuddi device to retrieve real-time air quality metrics.
          </Text>
        </View>
      </SectionCard>
    );
  }

  return (
    <SectionCard tone="default" padding={24}>
      <View style={styles.header}>
        <Text style={styles.title}>Air Quality Index</Text>
        <Text style={styles.subtitle}>Real-time Monitoring</Text>
      </View>

      <View style={styles.gaugeContainer}>
        {/* Breathing aura behind the gauge */}
        <Animated.View
          style={[
            styles.auraCircle,
            auraStyle,
            { backgroundColor: descriptor.color },
          ]}
        />
        
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <LinearGradient id="aqiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={descriptor.color} stopOpacity="1" />
              <Stop offset="100%" stopColor={descriptor.color} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={dashboardTheme.colors.surfaceSecondary}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="url(#aqiGradient)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.centerOverlay}>
          <Text style={[styles.aqiValue, { color: dashboardTheme.colors.textPrimary }]}>{aqi}</Text>
          <Text style={[styles.aqiLabel, { color: descriptor.color }]}>AQI</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.badge, { backgroundColor: descriptor.color + '15', borderColor: descriptor.color + '30' }]}>
          <Text style={[styles.badgeText, { color: descriptor.color }]}>{descriptor.label.toUpperCase()}</Text>
        </View>
        <Text style={styles.description}>
          The indoor air is currently <Text style={[styles.highlightText, { color: descriptor.color }]}>{descriptor.label.toLowerCase()}</Text>. The system is optimizing filtration.
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="trending-up" size={16} color={dashboardTheme.colors.textMuted} />
          <Text style={styles.metricLabel}>TREND</Text>
          <Text style={styles.metricValue}>Stable</Text>
        </View>
        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="target" size={16} color={dashboardTheme.colors.textMuted} />
          <Text style={styles.metricLabel}>TARGET</Text>
          <Text style={styles.metricValue}>&lt; 50</Text>
        </View>
      </View>
    </SectionCard>
  );
}

export const AirQualityCard = memo(AirQualityCardComponent);

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: dashboardTheme.colors.textMuted,
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    height: SIZE + 20,
  },
  auraCircle: {
    position: 'absolute',
    width: SIZE - STROKE_WIDTH * 2 - 20,
    height: SIZE - STROKE_WIDTH * 2 - 20,
    borderRadius: (SIZE - STROKE_WIDTH * 2 - 20) / 2,
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aqiValue: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -3,
  },
  aqiLabel: {
    marginTop: -8,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeNeutral: {
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    borderColor: dashboardTheme.colors.border,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    height: SIZE,
  },
  emptyValue: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -3,
  },
  emptyLabel: {
    color: dashboardTheme.colors.textMuted,
    marginTop: -8,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  description: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  highlightText: {
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});