import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import storage from './storage';
import { THEMES, getTheme, applyThemeToColors, ThemeDefinition, ThemeColors } from '../constants/themes';
import { useUserStore, UserTier } from './userStore';
import { supabase } from '../lib/supabase';

interface ThemeState {
  activeThemeId: string;
  unlockedThemeIds: string[];
  themeVersion: number; // Incremented on change to trigger immediate re-render

  // Actions
  setTheme: (themeId: string) => boolean;
  unlockTheme: (themeId: string) => Promise<{ success: boolean; error?: string }>;
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
      if (savedThemeId && THEMES[savedThemeId]) {
        applyThemeToColors(savedThemeId);
      }
    }
  } catch {}
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: 'classic',
      unlockedThemeIds: ['classic', 'azure', 'cyber_gold'],
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

        applyThemeToColors(theme.id);
        set((state) => ({
          activeThemeId: theme.id,
          themeVersion: state.themeVersion + 1,
        }));
        return true;
      },

      unlockTheme: async (themeId: string) => {
        const theme = getTheme(themeId);
        if (get().isThemeUnlocked(themeId)) {
          get().setTheme(themeId);
          return { success: true };
        }

        const cost = theme.unlockCostCoins || 250;
        const { user, updateCoins } = useUserStore.getState();
        const currentCoins = user.coinsBalance ?? 0;

        if (currentCoins < cost) {
          return {
            success: false,
            error: `Insufficient coins. You have 🪙 ${currentCoins}, but this theme requires 🪙 ${cost}.`,
          };
        }

        // Deduct coins locally
        const newBalance = currentCoins - cost;
        updateCoins(newBalance);

        // Deduct from Supabase wallet in background
        if (user.uid) {
          supabase
            .from('wallets')
            .update({ balance_coins: newBalance })
            .eq('user_id', user.uid)
            .then();

          supabase
            .from('coin_transactions')
            .insert({
              user_id: user.uid,
              type: 'spend_subscription',
              amount_coins: cost,
              amount_etb: cost,
              status: 'completed',
              description: `Unlocked Pro Theme: ${theme.name}`,
            })
            .then();
        }

        // Add to unlocked list and activate immediately
        applyThemeToColors(theme.id);
        set((state) => ({
          unlockedThemeIds: Array.from(new Set([...state.unlockedThemeIds, themeId])),
          activeThemeId: theme.id,
          themeVersion: state.themeVersion + 1,
        }));

        return { success: true };
      },
    }),
    {
      name: 'fitpulse-theme-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        if (state?.activeThemeId) {
          applyThemeToColors(state.activeThemeId);
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
  const themeVersion = useThemeStore((s) => s.themeVersion);
  const theme = getTheme(activeThemeId);
  return { theme, colors: theme.colors, themeId: activeThemeId, themeVersion };
}
