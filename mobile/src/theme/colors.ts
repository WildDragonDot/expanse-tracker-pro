export interface ThemeColors {
  background: string
  surface: string
  surfaceGlass: string
  surfaceGlassBorder: string
  inputBg: string
  inputBorder: string
  text: string
  textSecondary: string
  textMuted: string
  primary: string
  primaryGradient: [string, string]
  secondary: string
  secondaryGradient: [string, string]
  accentRose: string
  accentAmber: string
  accentCyan: string
  card: string
  border: string
}

export const Colors: { dark: ThemeColors; light: ThemeColors } = {
  dark: {
    background: '#0B0F19',
    surface: '#111827',
    surfaceGlass: 'rgba(255, 255, 255, 0.07)',
    surfaceGlassBorder: 'rgba(255, 255, 255, 0.12)',
    inputBg: 'rgba(255, 255, 255, 0.05)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    text: '#F9FAFB',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primary: '#8B5CF6',
    primaryGradient: ['#8B5CF6', '#6366F1'],
    secondary: '#10B981',
    secondaryGradient: ['#10B981', '#06B6D4'],
    accentRose: '#F43F5E',
    accentAmber: '#F59E0B',
    accentCyan: '#06B6D4',
    card: '#131B2E',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.85)',
    surfaceGlassBorder: 'rgba(226, 232, 240, 0.8)',
    inputBg: '#F1F5F9',
    inputBorder: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    primary: '#7C3AED',
    primaryGradient: ['#7C3AED', '#4F46E5'],
    secondary: '#059669',
    secondaryGradient: ['#059669', '#0891B2'],
    accentRose: '#E11D48',
    accentAmber: '#D97706',
    accentCyan: '#0891B2',
    card: '#FFFFFF',
    border: '#E2E8F0',
  },
}
