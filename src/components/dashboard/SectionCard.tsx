import React, { memo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type SectionCardProps = {
  children: ReactNode;
  padding?: number;
  tone?: 'default' | 'tinted';
};

function SectionCardComponent({ children, padding = 18, tone = 'default' }: SectionCardProps) {
  return (
    <View style={[styles.card, tone === 'tinted' && styles.tinted, { padding }]}>
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
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
    overflow: 'hidden',
  },
  tinted: {
    backgroundColor: dashboardTheme.colors.surfaceTint,
  },
});