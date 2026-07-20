import React, { useEffect, useRef } from 'react';
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
};

<<<<<<< HEAD
// ─── Single zone tile with animation ────────────────────────────────────────

function ZoneTile({
  light,
  index,
  onToggleLight,
}: {
  light: LightZone;
  index: number;
  onToggleLight: (id: string) => void;
}) {
  // Glow pulse animation when ON
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (light.isOn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      glowAnim.stopAnimation();
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [light.isOn, glowAnim]);

  const handlePress = () => {
    // Brief press scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggleLight(light.id);
  };

  return (
    <Animated.View style={[styles.tileWrap, { transform: [{ scale: scaleAnim }] }]}>
      {/* Glow halo behind card when ON */}
      {light.isOn && (
        <Animated.View
          style={[
            styles.glowHalo,
            { opacity: glowAnim },
          ]}
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.tile, light.isOn && styles.tileOn]}
        accessibilityLabel={`Toggle ${light.label} light zone ${index + 1}`}
      >
        {/* Top row: icon + ON/OFF badge */}
        <View style={styles.tileTopRow}>
          <View style={[styles.iconCircle, light.isOn && styles.iconCircleOn]}>
            <MaterialCommunityIcons
              name={light.isOn ? 'lightbulb-on' : 'lightbulb-outline'}
              size={22}
              color={light.isOn ? '#fff' : dashboardTheme.colors.textMuted}
            />
          </View>
          <View style={[styles.badge, light.isOn ? styles.badgeOn : styles.badgeOff]}>
            <View style={[styles.badgeDot, light.isOn ? styles.badgeDotOn : styles.badgeDotOff]} />
            <Text style={[styles.badgeText, light.isOn ? styles.badgeTextOn : styles.badgeTextOff]}>
              {light.isOn ? 'ON' : 'OFF'}
            </Text>
          </View>
        </View>

        {/* Zone label */}
        <Text style={[styles.tileLabel, light.isOn && styles.tileLabelOn]}>
          {light.label}
        </Text>
        <Text style={styles.tileZone}>Zone {index + 1}</Text>

        {/* Big power button at bottom */}
        <View style={[styles.powerBtn, light.isOn && styles.powerBtnOn]}>
          <MaterialCommunityIcons
            name="power"
            size={18}
            color={light.isOn ? '#fff' : dashboardTheme.colors.textMuted}
          />
          <Text style={[styles.powerBtnText, light.isOn && styles.powerBtnTextOn]}>
            {light.isOn ? 'Tap to Stop' : 'Tap to Start'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function LightControlPanel({ lights, onToggleLight }: LightControlPanelProps) {
  const anyOn = lights.some(l => l.isOn);
  const onCount = lights.filter(l => l.isOn).length;

=======
export function LightControlPanel({ lights, onToggleLight }: LightControlPanelProps) {
>>>>>>> dce543d3977b55143118d5a7aa6db9d218862f4a
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.headerIconWrap, anyOn && styles.headerIconWrapOn]}>
          <MaterialCommunityIcons
<<<<<<< HEAD
            name={anyOn ? 'lightbulb-on' : 'lightbulb-outline'}
            size={26}
            color={anyOn ? '#fff' : dashboardTheme.colors.textMuted}
=======
            name="lightbulb-on"
            size={28}
            color={dashboardTheme.colors.accent}
>>>>>>> dce543d3977b55143118d5a7aa6db9d218862f4a
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Light Control</Text>
<<<<<<< HEAD
          <Text style={styles.subtitle}>
            {anyOn
              ? `${onCount} zone${onCount > 1 ? 's' : ''} active — ESP32 receiving commands`
              : 'All zones off — tap a tile to send start command'}
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
          />
        ))}
      </View>

      {/* Footer hint */}
      <View style={styles.footerHint}>
        <MaterialCommunityIcons
          name="information-outline"
          size={13}
          color={dashboardTheme.colors.textMuted}
        />
        <Text style={styles.footerHintText}>
          Sends <Text style={styles.codeText}>start</Text> / <Text style={styles.codeText}>stop</Text> to your API Gateway → ESP32
        </Text>
=======
          <Text style={styles.subtitle}>Test lamp zones with professional lighting controls.</Text>
        </View>
      </View>

      <View style={styles.lightGrid}>
        {lights.map((light, index) => (
          <TouchableOpacity
            key={light.id}
            accessibilityLabel={`Toggle ${light.label}`}
            activeOpacity={0.88}
            onPress={() => onToggleLight(light.id)}
            style={[styles.lightCard, light.isOn && styles.lightCardActive]}
          >
            <View style={[styles.lightBadge, light.isOn && styles.lightBadgeActive]}>
              <MaterialCommunityIcons
                name={light.icon}
                size={20}
                color={light.isOn ? '#fff' : dashboardTheme.colors.textPrimary}
              />
            </View>
            <Text style={[styles.lightLabel, light.isOn && styles.lightLabelActive]}>{light.label}</Text>
            <Text style={styles.zoneLabel}>{`Zone ${index + 1}`}</Text>
            <Text style={[styles.statusPill, light.isOn && styles.statusPillActive]}>
              {light.isOn ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
        ))}
>>>>>>> dce543d3977b55143118d5a7aa6db9d218862f4a
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
<<<<<<< HEAD
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
  glowHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: dashboardTheme.colors.primary,
    // spread glow outside the card boundaries
    margin: -6,
    borderWidth: 0,
    shadowColor: dashboardTheme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  tile: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.border,
  },
  tileOn: {
    backgroundColor: '#ECFDF5',        // very light green tint
    borderColor: dashboardTheme.colors.primary,
  },

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
    backgroundColor: dashboardTheme.colors.primary,
    borderColor: dashboardTheme.colors.primary,
  },

  // ON/OFF badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOn: {
    backgroundColor: dashboardTheme.colors.primarySoft,
    borderColor: dashboardTheme.colors.primary,
  },
  badgeOff: {
    backgroundColor: dashboardTheme.colors.surface,
    borderColor: dashboardTheme.colors.border,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeDotOn: { backgroundColor: dashboardTheme.colors.primary },
  badgeDotOff: { backgroundColor: dashboardTheme.colors.textMuted },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  badgeTextOn: { color: dashboardTheme.colors.primary },
  badgeTextOff: { color: dashboardTheme.colors.textMuted },

  // Labels
  tileLabel: {
    color: dashboardTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  tileLabelOn: {
    color: dashboardTheme.colors.textPrimary,
  },
  tileZone: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 10,
    marginBottom: 12,
  },

  // Power button row
  powerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
  },
  powerBtnOn: {
=======
  lightGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  lightCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: dashboardTheme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    alignItems: 'flex-start',
  },
  lightCardActive: {
    backgroundColor: dashboardTheme.colors.primarySoft,
    borderColor: dashboardTheme.colors.primary,
  },
  lightBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.surface,
    marginBottom: 10,
  },
  lightBadgeActive: {
>>>>>>> dce543d3977b55143118d5a7aa6db9d218862f4a
    backgroundColor: dashboardTheme.colors.primary,
    borderColor: dashboardTheme.colors.primary,
  },
<<<<<<< HEAD
  powerBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: dashboardTheme.colors.textMuted,
  },
  powerBtnTextOn: {
    color: '#fff',
  },

  // Footer
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
  },
  footerHintText: {
    fontSize: 11,
    color: dashboardTheme.colors.textMuted,
  },
  codeText: {
    fontWeight: '800',
    color: dashboardTheme.colors.primary,
=======
  lightLabel: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  lightLabelActive: {
    color: dashboardTheme.colors.primary,
  },
  zoneLabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: dashboardTheme.colors.surface,
    color: dashboardTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  statusPillActive: {
    backgroundColor: dashboardTheme.colors.primary,
    color: '#fff',
>>>>>>> dce543d3977b55143118d5a7aa6db9d218862f4a
  },
});
