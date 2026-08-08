import React, { memo, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  onProfilePress: () => void;
  onRefreshPress: () => void;
};

function DashboardHeaderComponent({ title, subtitle, onProfilePress, onRefreshPress }: DashboardHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={styles.topActionRow}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Image
              source={require('../../../assets/airbuddi-favicon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandText}>AIRBUDDI</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            accessibilityLabel="Refresh data"
            onPress={onRefreshPress}
            activeOpacity={0.75}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="refresh" size={20} color={dashboardTheme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Anchor Container for the Overlapping Dropdown Menu */}
          <View style={{ position: 'relative', zIndex: 100 }}>
            <TouchableOpacity
              accessibilityLabel="Open profile"
              onPress={() => setMenuVisible(!menuVisible)}
              activeOpacity={0.75}
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={24}
                color={dashboardTheme.colors.textSecondary} 
              />
            </TouchableOpacity>

            {/* Overlapping Dropdown Menu Layer */}
            {menuVisible && (
              <>
                {/* Invisible backdrop layer to close the menu when tapping anywhere else */}
                <TouchableOpacity 
                  style={styles.menuBackdrop} 
                  activeOpacity={1} 
                  onPress={() => setMenuVisible(false)} 
                />
                
                {/* Floating Menu Card Layout */}
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => { setMenuVisible(false); /* Add My Devices navigation action here */ }}
                  >
                    <MaterialCommunityIcons name="cellphone-link" size={18} color="#555" style={{ marginRight: 12 }} />
                    <Text style={styles.menuText}>My Devices</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => { setMenuVisible(false); /* Add History navigation action here */ }}
                  >
                    <MaterialCommunityIcons name="history" size={18} color="#555" style={{ marginRight: 12 }} />
                    <Text style={styles.menuText}>Air Quality History</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => { setMenuVisible(false); /* Add Settings navigation action here */ }}
                  >
                    <MaterialCommunityIcons name="cog" size={18} color="#555" style={{ marginRight: 12 }} />
                    <Text style={styles.menuText}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Hero text */}
      <View style={styles.heroSection}>
        <Text style={styles.welcomeText}>Your Space</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <View style={styles.statusDot} />
        </View>
        <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10, // Gives the header layout priority over lower components
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  brandText: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.soft,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.soft,
  },
  avatarImage: {
    width: 26,
    height: 26,
  },
  heroSection: {
    gap: 4,
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.colors.textMuted,
    letterSpacing: 0.4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.colors.primary,
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: dashboardTheme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: dashboardTheme.colors.textMuted,
  },
  /* Added styles for the Dropdown Popup */
  menuBackdrop: {
    position: 'absolute',
    top: -500,
    right: -500,
    width: 2000, 
    height: 2000,
    zIndex: 99,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 45, 
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    width: 210,
    zIndex: 100, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#333333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 4,
  },
});