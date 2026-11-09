import { Platform } from 'react-native';
import { Colors } from './colors';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
  warning: string;
  info: string;
  border: string;
  borderLight: string;
  overlay: string;
  tabBar: string;
  tabBarBorder: string;
  storyBorder: string;
  storyBorderInactive: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  label: string;
  description: string;
  isFree: boolean;
  unlockCostCoins: number;
  preview: {
    accentColor: string;
    bgColor: string;
    surfaceColor: string;
    bubbleColor: string;
    badgeText?: string;
  };
  colors: ThemeColors;
}

export const THEMES: Record<string, ThemeDefinition> = {
  classic: {
    id: 'classic',
    name: 'FitPulse Classic',
    label: 'Classic',
    description: 'Signature FitPulse dark obsidian with neon emerald accents',
    isFree: true,
    unlockCostCoins: 0,
    preview: {
      accentColor: '#00E676',
      bgColor: '#0A0A0A',
      surfaceColor: '#121212',
      bubbleColor: '#16281E',
    },
    colors: {
      background: '#0A0A0A',
      surface: '#121212',
      surfaceLight: '#181818',
      primary: '#00E676',
      primaryDark: '#00B359',
      primaryLight: '#33EB91',
      textPrimary: '#FFFFFF',
      textSecondary: '#E0E0E0',
      textMuted: '#A0A0A0',
      danger: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
      border: '#1E1E1E',
      borderLight: '#282828',
      overlay: 'rgba(0, 0, 0, 0.7)',
      tabBar: '#0A0A0A',
      tabBarBorder: '#1A1A1A',
      storyBorder: '#00E676',
      storyBorderInactive: '#282828',
    },
  },

  azure: {
    id: 'azure',
    name: 'Dark Azure',
    label: 'Azure Blue',
    description: 'Deep ocean dark azure (#003152) with soft blue (#ADDFF1) accents',
    isFree: true,
    unlockCostCoins: 0,
    preview: {
      accentColor: '#ADDFF1',
      bgColor: '#001C30',
      surfaceColor: '#003152',
      bubbleColor: '#05446E',
    },
    colors: {
      background: '#001C30',
      surface: '#003152',
      surfaceLight: '#06416B',
      primary: '#ADDFF1',
      primaryDark: '#7EBFD8',
      primaryLight: '#D2F1FD',
      textPrimary: '#FFFFFF',
      textSecondary: '#DDF0F7',
      textMuted: '#8EB4C7',
      danger: '#FF5C5C',
      warning: '#FBBF24',
      info: '#60A5FA',
      border: '#09456E',
      borderLight: '#0E5788',
      overlay: 'rgba(0, 15, 28, 0.75)',
      tabBar: '#001626',
      tabBarBorder: '#083756',
      storyBorder: '#00E676',
      storyBorderInactive: '#09456E',
    },
  },

  cyber_gold: {
    id: 'cyber_gold',
    name: 'Cyber Gold',
    label: 'Midnight Gold',
    description: 'Pitch OLED black (#000000) with glowing orange yellow (#FDBF2D)',
    isFree: true,
    unlockCostCoins: 0,
    preview: {
      accentColor: '#FDBF2D',
      bgColor: '#000000',
      surfaceColor: '#121212',
      bubbleColor: '#2B230C',
    },
    colors: {
      background: '#000000',
      surface: '#121212',
      surfaceLight: '#1C1C1C',
      primary: '#FDBF2D',
      primaryDark: '#D99F18',
      primaryLight: '#FED366',
      textPrimary: '#FFFFFF',
      textSecondary: '#EAEAEA',
      textMuted: '#9E9E9E',
      danger: '#EF4444',
      warning: '#FDBF2D',
      info: '#3B82F6',
      border: '#2B2310',
      borderLight: '#3D3215',
      overlay: 'rgba(0, 0, 0, 0.8)',
      tabBar: '#050505',
      tabBarBorder: '#231B09',
      storyBorder: '#00E676',
      storyBorderInactive: '#2B2310',
    },
  },

  royal_navy: {
    id: 'royal_navy',
    name: 'Royal Navy & Chalk',
    label: 'Deep Navy',
    description: 'Executive deep navy blue (#000066) with chalk yellow (#FFFF99)',
    isFree: false,
    unlockCostCoins: 250,
    preview: {
      accentColor: '#FFFF99',
      bgColor: '#000033',
      surfaceColor: '#000066',
      bubbleColor: '#0E0E7D',
      badgeText: 'PRO',
    },
    colors: {
      background: '#000033',
      surface: '#000066',
      surfaceLight: '#0A0A7A',
      primary: '#FFFF99',
      primaryDark: '#D4D468',
      primaryLight: '#FFFFBE',
      textPrimary: '#FFFFFF',
      textSecondary: '#F5F5DC',
      textMuted: '#8F8FA8',
      danger: '#FF5555',
      warning: '#FFFF99',
      info: '#6897FF',
      border: '#0C0C80',
      borderLight: '#15159C',
      overlay: 'rgba(0, 0, 40, 0.8)',
      tabBar: '#000026',
      tabBarBorder: '#0A0A70',
      storyBorder: '#00E676',
      storyBorderInactive: '#0C0C80',
    },
  },
};

export const THEME_LIST = Object.values(THEMES);

export function getTheme(themeId: string): ThemeDefinition {
  return THEMES[themeId] || THEMES.classic;
}

/**
 * Mutates the global Colors object in-place and sets Web body styles so
 * any code referencing Colors directly gets the active theme immediately.
 */
export function applyThemeToColors(themeId: string): void {
  const theme = getTheme(themeId);
  Object.assign(Colors, theme.colors);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.body.style.backgroundColor = theme.colors.background;
    document.documentElement.style.backgroundColor = theme.colors.background;
    try {
      document.documentElement.style.setProperty('--bg-color', theme.colors.background);
      document.documentElement.style.setProperty('--surface-color', theme.colors.surface);
      document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
      document.documentElement.style.setProperty('--text-primary', theme.colors.textPrimary);
    } catch {}
  }
}
