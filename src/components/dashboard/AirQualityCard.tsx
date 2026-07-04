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
  aqi: number;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AirQualityCardComponent({ aqi }: AirQualityCardProps) {
  const descriptor = getAqiDescriptor(aqi);
  const progress = useSharedValue(0);
  const ratio = clamp(aqi / 200, 0, 1);

  // Pulse animation for the aura behind the text
  const auraScale = useSharedValue(0.9);
  const auraOpacity = useSharedValue(0.12);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 1100 });
    
    auraScale.value = withRepeat(
      withTiming(1.05, { duration: 2200 }),
      -1,
      true
    );
    auraOpacity.value = withRepeat(
      withTiming(0.24, { duration: 2200 }),
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

  return (
    <SectionCard tone="default" padding={20}>
      <View style={styles.header}>
        <Text style={styles.title}>Air Quality Index</Text>
        <Text style={styles.subtitle}>Purifier Zone Telemetry</Text>
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
              <Stop offset="100%" stopColor={descriptor.color + 'AA'} stopOpacity="0.7" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.06)"
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
          <Text style={[styles.aqiValue, { color: descriptor.color }]}>{aqi}</Text>
          <Text style={styles.aqiLabel}>AQI</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.badge, { backgroundColor: descriptor.color + '15', borderColor: descriptor.color + '30' }]}>
          <Text style={[styles.badgeText, { color: descriptor.color }]}>{descriptor.label.toUpperCase()}</Text>
        </View>
        <Text style={styles.description}>
            The indoor air is currently <Text style={[styles.highlightText, { color: descriptor.color }]}>{descriptor.label.toLowerCase()}</Text>. The purifier is maintaining safe thresholds.
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>STATUS</Text>
          <Text style={styles.metricValue}>{descriptor.label}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TARGET</Text>
          <Text style={styles.metricValue}>&lt; 50 AQI</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TREND</Text>
          <Text style={styles.metricValue}>Stable</Text>
        </View>
      </View>
    </SectionCard>
  );
}

export const AirQualityCard = memo(AirQualityCardComponent);

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
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
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    height: SIZE + 20,
  },
  auraCircle: {
    position: 'absolute',
    width: SIZE - STROKE_WIDTH * 2 - 12,
    height: SIZE - STROKE_WIDTH * 2 - 12,
    borderRadius: (SIZE - STROKE_WIDTH * 2 - 12) / 2,
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aqiValue: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -2,
  },
  aqiLabel: {
    color: dashboardTheme.colors.textSecondary,
    marginTop: -6,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  description: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  highlightText: {
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: dashboardTheme.radii.sm,
    backgroundColor: dashboardTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
});