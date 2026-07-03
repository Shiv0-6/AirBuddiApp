import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { getConnectionTone } from '../../features/dashboard/dashboardUtils';

type ConnectionPillProps = {
  label: string;
  status: 'connected' | 'connecting' | 'offline';
};

function ConnectionPillComponent({ label, status }: ConnectionPillProps) {
  const tone = getConnectionTone(status);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export const ConnectionPill = memo(ConnectionPillComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: dashboardTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});