import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { dashboardTheme } from '../../dashboard/dashboardTheme';

export function SettingsRow({ icon, title, subtitle, onPress, last = false }: any) {
  return (
    <TouchableOpacity style={[styles.settingsRow, last && styles.settingsRowLast]} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.settingsIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={dashboardTheme.colors.primaryDark} />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsTitle}>{title}</Text>
        <Text style={styles.settingsSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={dashboardTheme.colors.textMuted} />
    </TouchableOpacity>
  );
}

export function SettingsCategoryRow({ icon, title, subtitle, onPress, last = false }: any) {
  return (
    <TouchableOpacity style={[styles.settingsCategoryRow, last && styles.settingsRowLast]} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.settingsCategoryIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={dashboardTheme.colors.primaryDark} />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsCategoryTitle}>{title}</Text>
        <Text style={styles.settingsSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={dashboardTheme.colors.textMuted} />
    </TouchableOpacity>
  );
}

export function ToggleRow({ label, sub, value, onChange, last = false }: any) {
  return (
    <View style={[styles.settingsToggleRow, last && styles.settingsToggleRowLast]}>
      <View style={styles.toggleTextWrap}>
        <Text style={styles.settingsToggleLabel}>{label}</Text>
        <Text style={styles.settingsToggleSublabel}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#D1D5DB', true: 'rgba(34, 197, 94, 0.35)' }}
        thumbColor={value ? '#22C55E' : '#F4F4F4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: dashboardTheme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCopy: { flex: 1 },
  settingsTitle: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  settingsSubtitle: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  settingsCategoryRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  settingsCategoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: dashboardTheme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCategoryTitle: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  settingsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },
  settingsToggleRowLast: { borderBottomWidth: 0 },
  toggleTextWrap: { flex: 1, marginRight: 12 },
  settingsToggleLabel: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  settingsToggleSublabel: {
    color: dashboardTheme.colors.textMuted,
    fontSize: 12,
  },
});
