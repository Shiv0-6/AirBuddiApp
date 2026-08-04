import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';
import { getConnectionTone } from '../../features/dashboard/dashboardUtils';

type ConnectionPillProps = {
  label: string;
  status: 'connected' | 'connecting' | 'offline';
};

function ConnectionPillComponent({ label, status }: ConnectionPillProps) {
  const tone = getConnectionTone(status);

  return (
    <View style={[styles.container, { borderColor: tone + '30' }]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <MaterialCommunityIcons
        name={status === 'connected' ? 'wifi' : status === 'connecting' ? 'wifi-sync' : 'wifi-off'}
        size={14}
        color={tone}
      />
      <Text style={[styles.label, { color: tone }]}>{label}</Text>
    </View>
  );
}

export const ConnectionPill = memo(ConnectionPillComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: dashboardTheme.colors.surface,
    borderWidth: 1.5,
    gap: 7,
    ...dashboardTheme.shadows.soft,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});