import React, { memo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  deviceName?: string;
  showDeviceInfo?: boolean;
  onProfilePress: () => void;
  onRefreshPress: () => void;
  onNotificationPress: () => void;
  onMenuPress: () => void;
};

function DashboardHeaderComponent({
  title,
  subtitle,
  deviceName = '',
  showDeviceInfo = true,
  onProfilePress,
  onRefreshPress,
  onNotificationPress,
  onMenuPress,
}: DashboardHeaderProps) {
  const normalizedDeviceName = deviceName.trim().toLowerCase();
  const deviceImage = normalizedDeviceName === 'airbuddi max'
    ? require('../../../assets/Max_l2.png')
    : normalizedDeviceName === 'airbuddi mini'
      ? require('../../../assets/Mini.png')
      : undefined;

  return (
    <View style={styles.wrapper}>

      {/* ============================================================
          TOP BRAND ROW
      ============================================================ */}

      <View style={styles.topActionRow}>

        <View style={styles.brandRow}>

          <TouchableOpacity
            accessibilityLabel="Open profile"
            onPress={onProfilePress}
            activeOpacity={0.75}
            style={styles.brandMark}
          >
            <Image
              source={require('../../../assets/airbuddi-favicon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.brandText}>
            GREENVERSE
          </Text>

        </View>

        <View style={styles.actionsContainer}>

          <TouchableOpacity
            accessibilityLabel="View notifications"
            onPress={onNotificationPress}
            activeOpacity={0.75}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={22}
              color={dashboardTheme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="More options"
            onPress={onMenuPress}
            activeOpacity={0.75}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={23}
              color={dashboardTheme.colors.textSecondary}
            />
          </TouchableOpacity>

        </View>

      </View>


      {/* ============================================================
          COMBINED HEADER + HERO
      ============================================================ */}

      {showDeviceInfo && (
        <View style={styles.heroSection}>

          {/* -------------------------
              Your Space
          ------------------------- */}

          <View style={styles.heroTopRow}>

            <View style={styles.spaceIcon}>
              <MaterialCommunityIcons
                name="leaf"
                size={20}
                color={dashboardTheme.colors.primaryDark}
              />
            </View>

            <Text style={styles.welcomeText}>
              Your Space
            </Text>

          </View>


          {/* -------------------------
              Main Hero Content
          ------------------------- */}

          <View style={styles.heroMain}>

            {/* LEFT: Text */}

            <View style={styles.heroTextContent}>

              <View style={styles.titleRow}>

                <Text
                  style={styles.title}
                  numberOfLines={2}
                >
                  {title}
                </Text>

                <View style={styles.statusDot} />

              </View>

              <Text
                style={styles.subtitle}
                numberOfLines={2}
              >
                {subtitle}
              </Text>

            </View>


            {/* RIGHT: AirBuddi visual */}

            <View style={styles.heroDecoration}>
              {/* AirBuddi device */}
              {deviceImage && (
                <View style={styles.airDevice}>
                  <Image
                    source={deviceImage}
                    style={styles.heroPurifier}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>

          </View>

        </View>
      )}

    </View>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);


/* ================================================================
   STYLES
================================================================ */

const styles = StyleSheet.create({

  /* --------------------------------------------------------------
     HEADER WRAPPER
  -------------------------------------------------------------- */

  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },


  /* --------------------------------------------------------------
     TOP BRAND
  -------------------------------------------------------------- */

  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  logoImage: {
    width: 27,
    height: 27,
  },

  brandText: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.7,
  },

  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: dashboardTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.soft,
  },


  /* --------------------------------------------------------------
     COMBINED HEADER / HERO
  -------------------------------------------------------------- */

  heroSection: {
  height: 180,
  borderRadius: 26,
  backgroundColor: '#F3FAF4',
  borderWidth: 1,
  borderColor: 'rgba(22, 163, 74, 0.18)',
  overflow: 'hidden',
  position: 'relative',
  paddingHorizontal: 20,
  paddingTop: 18,
  paddingBottom: 16,},

  /* --------------------------------------------------------------
     YOUR SPACE
  -------------------------------------------------------------- */

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  spaceIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor: '#E4F5E7',

    alignItems: 'center',
    justifyContent: 'center',
  },

  welcomeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#47735A',
    letterSpacing: 0.2,
  },


  /* --------------------------------------------------------------
     HERO MAIN
  -------------------------------------------------------------- */

  heroMain: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',
  },

  heroTextContent: {
    flex: 1,
    width: '65%',
    paddingRight: 8,
    zIndex: 2,
  },

  /* --------------------------------------------------------------
     HERO TEXT
  -------------------------------------------------------------- */

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 8,
  },

  title: {
    flexShrink: 1,

    fontSize: 24,
    lineHeight: 29,

    fontWeight: '800',

    color: dashboardTheme.colors.textPrimary,

    letterSpacing: -0.6,
  },

  statusDot: {
    width: 9,
    height: 9,

    borderRadius: 5,

    backgroundColor: dashboardTheme.colors.textMuted,

    marginLeft: 8,
    marginTop: 5,
  },

  subtitle: {
    marginTop: 7,

    fontSize: 13,
    lineHeight: 19,

    fontWeight: '500',

    color: dashboardTheme.colors.textSecondary,
  },


  /* --------------------------------------------------------------
     AIRBUDDI VISUAL
  -------------------------------------------------------------- */

  heroDecoration: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  airDevice: {
    width: '100%',
    height: '100%',
  },

  heroPurifier: {
  position: 'absolute',
  width: 175,
  height: 175,
  right: -25,
  bottom: -70,
  zIndex: 1,
},
});