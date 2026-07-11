import React, { memo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type SectionCardProps = {
  children: ReactNode;
  padding?: number;
  tone?: 'default' | 'tinted';
};

function SectionCardComponent({ children, padding = 20, tone = 'default' }: SectionCardProps) {
  return (
    <View style={[
      styles.card,
      tone === 'tinted' && styles.tinted,
      { padding }
    ]}>
      {children}
    </View>
  );
}

export const SectionCard = memo(SectionCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.radii.lg,
    borderWidth: 1,
    borderColor: dashboardTheme.colors.border,
    overflow: 'hidden',
    ...dashboardTheme.shadows.medium,
  },
  tinted: {
    backgroundColor: dashboardTheme.colors.surfaceElevated,
  },
});