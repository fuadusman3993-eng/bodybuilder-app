import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import storage from './storage';
import { THEMES, getTheme, applyThemeToColors, ThemeDefinition, ThemeColors } from '../constants/themes';
import { useUserStore, UserTier } from './userStore';

export type AutoNightMode = 'off' | 'scheduled' | 'system';
export type AppFontFamily = 'Default' | 'Modern' | 'Monospace' | 'Rounded';

interface ThemeState {
  activeThemeId: string;
  customAccentColor: string | null;
  useSystemAccent: boolean;
  nameColor: string;
  autoNightMode: AutoNightMode;
  fontFamily: AppFontFamily;
  unlockedThemeIds: string[];
  themeVersion: number;

  // Actions
  setTheme: (themeId: string) => boolean;
  setCustomAccentColor: (color: string | null) => void;
  setUseSystemAccent: (val: boolean) => void;
  setNameColor: (color: string) => void;
  setAutoNightMode: (mode: AutoNightMode) => void;
  setFontFamily: (font: AppFontFamily) => void;
  isThemeUnlocked: (themeId: string) => boolean;
  getActiveTheme: () => ThemeDefinition;
}

// Early synchronous load for Web to avoid theme flashing
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const raw = window.localStorage.getItem('fitpulse-theme-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedThemeId = parsed?.state?.activeThemeId;
      const customAccent = parsed?.state?.customAccentColor;
      if (savedThemeId && THEMES[savedThemeId]) {
        applyThemeToColors(savedThemeId, customAccent);
      }
    }
  } catch {}
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: 'classic',
      customAccentColor: null,
      useSystemAccent: false,
      nameColor: '#EC4899', // Telegram-style default pinkish name color
      autoNightMode: 'off',
      fontFamily: 'Default',
      unlockedThemeIds: ['classic', 'day', 'tinted', 'night', 'azure', 'cyber_gold'],
      themeVersion: 1,

      isThemeUnlocked: (themeId: string) => {
        const theme = getTheme(themeId);
        if (theme.isFree) return true;
        const { user } = useUserStore.getState();
        // Pro / Premium tier users unlock all themes automatically
        if (user.tier === UserTier.PREMIUM) return true;
        return get().unlockedThemeIds.includes(themeId);
      },

      getActiveTheme: () => {
        return getTheme(get().activeThemeId);
      },

      setTheme: (themeId: string) => {
        const theme = getTheme(themeId);
        if (!get().isThemeUnlocked(themeId)) {
          return false;
        }

        applyThemeToColors(theme.id, get().customAccentColor);
        set((state) => ({
          activeThemeId: theme.id,
          themeVersion: state.themeVersion + 1,
        }));
        return true;
      },

      setCustomAccentColor: (color: string | null) => {
        applyThemeToColors(get().activeThemeId, color);
        set((state) => ({
          customAccentColor: color,
          themeVersion: state.themeVersion + 1,
        }));
      },

      setUseSystemAccent: (val: boolean) => {
        set((state) => ({
          useSystemAccent: val,
          themeVersion: state.themeVersion + 1,
        }));
      },

      setNameColor: (color: string) => {
        set((state) => ({
          nameColor: color,
          themeVersion: state.themeVersion + 1,
        }));
      },

      setAutoNightMode: (mode: AutoNightMode) => {
        set((state) => ({
          autoNightMode: mode,
          themeVersion: state.themeVersion + 1,
        }));
      },

      setFontFamily: (font: AppFontFamily) => {
        set((state) => ({
          fontFamily: font,
          themeVersion: state.themeVersion + 1,
        }));
      },
    }),
    {
      name: 'fitpulse-theme-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        if (state?.activeThemeId) {
          applyThemeToColors(state.activeThemeId, state.customAccentColor);
        }
      },
    }
  )
);

/**
 * Convenience hook: returns active theme colors + themeId.
 * Any component that calls this will re-render instantly on theme change.
 */
export function useTheme() {
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const customAccentColor = useThemeStore((s) => s.customAccentColor);
  const themeVersion = useThemeStore((s) => s.themeVersion);
  const nameColor = useThemeStore((s) => s.nameColor);
  const theme = getTheme(activeThemeId);

  const colors = {
    ...theme.colors,
    ...(customAccentColor ? { primary: customAccentColor, storyBorder: customAccentColor } : {}),
  };

  return { theme, colors, themeId: activeThemeId, themeVersion, nameColor };
}
