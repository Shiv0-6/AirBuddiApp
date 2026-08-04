export const dashboardTheme = {
  colors: {
    // Backgrounds
    background: '#F0F7F2',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#E8F5ED',
    surfaceTint: '#F4FBF6',

    // Text
    textPrimary: '#0D2818',
    textSecondary: '#3D6B50',
    textMuted: '#7A9E87',

    // Borders
    border: 'rgba(34, 120, 70, 0.12)',
    shadow: 'rgba(10, 50, 25, 0.12)',

    // Brand greens
    primary: '#22C55E',
    primaryDark: '#16A34A',
    primarySoft: 'rgba(34, 197, 94, 0.14)',
    primaryGradientStart: '#22C55E',
    primaryGradientEnd: '#16A34A',

    // Accent (kept subtle)
    accent: '#4ADE80',

    // Status
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#22C55E',

    dark: '#0D2818',
    lightText: '#FFFFFF',
  },
  radii: {
    xl: 32,
    lg: 24,
    md: 16,
    sm: 12,
    xs: 8,
  },
  shadows: {
    soft: {
      shadowColor: '#0D2818',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#0D2818',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.09,
      shadowRadius: 12,
      elevation: 4,
    },
    strong: {
      shadowColor: '#0D2818',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 8,
    },
  },
} as const;
