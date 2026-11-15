export const Colors = {
  // Background
  background: '#0a0a0a',
  surface: '#121212',
  surfaceLight: '#181818',
  
  // Primary / Accent
  primary: '#00E676',
  primaryDark: '#00B359',
  primaryLight: '#33EB91',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textMuted: '#A0A0A0',
  
  // Status
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Borders
  border: '#1e1e1e',
  borderLight: '#282828',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.65)',
  
  // Tab bar
  tabBar: '#0a0a0a',
  tabBarBorder: '#1a1a1a',
  
  // Stories
  storyBorder: '#00E676',
  storyBorderInactive: '#282828',
};

// ── Synchronous Pre-Hydration from localStorage on Web ──
// Immediately updates Colors when the JS bundle evaluates, preventing any module from reading Classic values
const PRESET_PALETTES: Record<string, Partial<typeof Colors>> = {
  classic: {
    background: '#0a0a0a',
    surface: '#121212',
    surfaceLight: '#181818',
    primary: '#00E676',
    primaryDark: '#00B359',
    primaryLight: '#33EB91',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textMuted: '#A0A0A0',
    border: '#1e1e1e',
    borderLight: '#282828',
    tabBar: '#0a0a0a',
    tabBarBorder: '#1a1a1a',
    storyBorder: '#00E676',
  },
  day: {
    background: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceLight: '#F8FAFC',
    primary: '#2AABEE',
    primaryDark: '#229ED9',
    primaryLight: '#54C7EC',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    border: '#CBD5E1',
    borderLight: '#E2E8F0',
    tabBar: '#FFFFFF',
    tabBarBorder: '#CBD5E1',
    storyBorder: '#2AABEE',
  },
  tinted: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#28364C',
    primary: '#38BDF8',
    primaryDark: '#0284C7',
    primaryLight: '#7DD3FC',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#334155',
    borderLight: '#475569',
    tabBar: '#0F172A',
    tabBarBorder: '#1E293B',
    storyBorder: '#38BDF8',
  },
  night: {
    background: '#000000',
    surface: '#0A0A0A',
    surfaceLight: '#141414',
    primary: '#FDBF2D',
    primaryDark: '#D49E1F',
    primaryLight: '#FED36A',
    textPrimary: '#FFFFFF',
    textSecondary: '#E4E4E7',
    textMuted: '#71717A',
    border: '#18181B',
    borderLight: '#27272A',
    tabBar: '#000000',
    tabBarBorder: '#18181B',
    storyBorder: '#FDBF2D',
  },
  azure: {
    background: '#001C30',
    surface: '#176B87',
    surfaceLight: '#1D7D9E',
    primary: '#ADDFF1',
    primaryDark: '#64B5F6',
    primaryLight: '#E0F7FA',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0F2FE',
    textMuted: '#93C5FD',
    border: '#1B4965',
    borderLight: '#245E80',
    tabBar: '#001424',
    tabBarBorder: '#1B4965',
    storyBorder: '#ADDFF1',
  },
  cyber_gold: {
    background: '#0B0900',
    surface: '#1E1B0E',
    surfaceLight: '#2D2815',
    primary: '#E5A93C',
    primaryDark: '#C48A25',
    primaryLight: '#F3C46C',
    textPrimary: '#FFFFFF',
    textSecondary: '#F5F5DC',
    textMuted: '#A89F81',
    border: '#3D3418',
    borderLight: '#4D4222',
    tabBar: '#080600',
    tabBarBorder: '#3D3418',
    storyBorder: '#E5A93C',
  },
  royal_navy: {
    background: '#000033',
    surface: '#000066',
    surfaceLight: '#0A0A7A',
    primary: '#FFFF99',
    primaryDark: '#D4D468',
    primaryLight: '#FFFFBE',
    textPrimary: '#FFFFFF',
    textSecondary: '#F5F5DC',
    textMuted: '#8F8FA8',
    border: '#0C0C80',
    borderLight: '#15159C',
    tabBar: '#000026',
    tabBarBorder: '#0A0A70',
    storyBorder: '#00E676',
  },
};

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const raw = window.localStorage.getItem('fitpulse-theme-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      const activeId = parsed?.state?.activeThemeId;
      if (activeId && PRESET_PALETTES[activeId]) {
        Object.assign(Colors, PRESET_PALETTES[activeId]);
      }
      if (parsed?.state?.customAccentColor) {
        Colors.primary = parsed.state.customAccentColor;
        Colors.storyBorder = parsed.state.customAccentColor;
      }
    }
  } catch {}
}
