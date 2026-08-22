import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type LightZone = {
  id: string;
  label: string;
  icon: string;
  isOn: boolean;
};

type LightControlPanelProps = {
  lights: LightZone[];
  onToggleLight: (lightId: string) => void;
  disabled?: boolean;
};

// ─── Single zone tile with animation ────────────────────────────────────────

function ZoneTile({
  light,
  index,
  onToggleLight,
  disabled,
}: {
  light: LightZone;
  index: number;
  onToggleLight: (id: string) => void;
  disabled: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) { return; }
    // Brief press scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggleLight(light.id);
  };

  return (
    <Animated.View style={[styles.tileWrap, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        onPress={handlePress}
        style={[styles.tile, disabled && styles.tileDisabled, light.isOn && styles.tileOn]}
        accessibilityLabel={`Toggle ${light.label} light zone ${index + 1}`}
      >
        {/* Top row: light icon */}
        <View style={styles.tileTopRow}>
          <View style={[styles.iconCircle, light.isOn && styles.iconCircleOn]}>
            <MaterialCommunityIcons
              name={light.isOn ? 'lightbulb-on' : 'lightbulb-outline'}
              size={22}
              color={light.isOn ? dashboardTheme.colors.primaryDark : dashboardTheme.colors.textMuted}
            />
          </View>
        </View>

        {/* Zone label */}
        <Text style={[styles.tileLabel, light.isOn && styles.tileLabelOn]}>
          {light.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function LightControlPanel({ lights, onToggleLight, disabled = false }: LightControlPanelProps) {
  const anyOn = lights.some(l => l.isOn);
  const onCount = lights.filter(l => l.isOn).length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.headerIconWrap, anyOn && styles.headerIconWrapOn]}>
          <MaterialCommunityIcons
            name={anyOn ? 'lightbulb-on' : 'lightbulb-outline'}
            size={26}
            color={anyOn ? '#fff' : dashboardTheme.colors.textMuted}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Light Control</Text>
          <Text style={styles.subtitle}>
            {disabled
              ? 'Turn on the purifier to control lights'
              : anyOn
              ? `${onCount} zone${onCount > 1 ? 's' : ''} active`
              : 'All zones off · tap a tile to toggle'}
          </Text>
        </View>
        {/* Master status pill */}
        <View style={[styles.masterPill, anyOn && styles.masterPillOn]}>
          <Text style={[styles.masterPillText, anyOn && styles.masterPillTextOn]}>
            {anyOn ? 'LIVE' : 'IDLE'}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Zone tiles */}
      <View style={styles.grid}>
        {lights.map((light, index) => (
          <ZoneTile
            key={light.id}
            light={light}
            index={index}
            onToggleLight={onToggleLight}
            disabled={disabled}
          />
        ))}
      </View>


    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    marginTop: 16,
    ...dashboardTheme.shadows.medium,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    marginRight: 12,
  },
  headerIconWrapOn: {
    backgroundColor: dashboardTheme.colors.primary,
  },
  headerText: { flex: 1 },
  title: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  masterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  masterPillOn: {
    backgroundColor: dashboardTheme.colors.primarySoft,
    borderColor: dashboardTheme.colors.primary,
  },
  masterPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: dashboardTheme.colors.textMuted,
  },
  masterPillTextOn: {
    color: dashboardTheme.colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: dashboardTheme.colors.border,
    marginBottom: 14,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    gap: 10,
  },

  // Zone tile
  tileWrap: {
    flex: 1,
    position: 'relative',
  },
  tile: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: dashboardTheme.colors.border,
  },
  tileOn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  tileDisabled: { opacity: 0.45 },

  // Top row inside tile
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  iconCircleOn: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },

  // Labels
  tileLabel: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  tileLabelOn: {
    color: dashboardTheme.colors.textPrimary,
  },
});
