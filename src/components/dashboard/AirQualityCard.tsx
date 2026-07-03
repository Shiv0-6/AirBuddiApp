import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { clamp, getAqiDescriptor } from '../../features/dashboard/dashboardUtils';
import { SectionCard } from './SectionCard';

type AirQualityCardProps = {
  aqi: number;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 188;
const STROKE_WIDTH = 16;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AirQualityCardComponent({ aqi }: AirQualityCardProps) {
  const descriptor = getAqiDescriptor(aqi);
  const progress = useSharedValue(0);
  const ratio = clamp(aqi / 200, 0, 1);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 900 });
  }, [progress, ratio]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <SectionCard tone="tinted" padding={20}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Air Quality</Text>
          <Text style={styles.subtitle}>Real-time status for the purifier zone</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: descriptor.color + '18' }]}>
          <Text style={[styles.badgeText, { color: descriptor.color }]}>{descriptor.label}</Text>
        </View>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.gaugeWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={dashboardTheme.colors.border}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={descriptor.color}
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

        <View style={styles.copyColumn}>
          <Text style={styles.sectionLabel}>Status</Text>
          <Text style={styles.statusTitle}>{descriptor.label}</Text>
          <Text style={styles.helperText}>
            The purifier is operating within a {descriptor.label.toLowerCase()} air range.
          </Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Target</Text>
              <Text style={styles.metricValue}>&lt; 50</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Trend</Text>
              <Text style={styles.metricValue}>Stable</Text>
            </View>
          </View>
        </View>
      </View>
    </SectionCard>
  );
}

export const AirQualityCard = memo(AirQualityCardComponent);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: dashboardTheme.colors.textSecondary,
    marginTop: 5,
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  contentRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  gaugeWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aqiValue: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1,
  },
  aqiLabel: {
    color: dashboardTheme.colors.textSecondary,
    marginTop: -4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  copyColumn: {
    flex: 1,
    gap: 10,
  },
  sectionLabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  statusTitle: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  helperText: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: dashboardTheme.radii.sm,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    gap: 4,
  },
  metricLabel: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});