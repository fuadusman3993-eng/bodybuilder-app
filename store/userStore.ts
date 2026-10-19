import { create } from 'zustand';

export enum UserTier {
  GUEST = 'guest',
  FREE = 'free',
  PREMIUM = 'premium',
}

export type UserRole = 'user' | 'coach';

export interface UserModel {
  id?: string;
  uid?: string;
  name?: string;
  email?: string;
  tier: UserTier;
  role?: UserRole;
  avatar?: string;
  city?: string;
  country?: string;
}

interface UserState {
  user: UserModel;
  authInitialized: boolean;
  setUser: (user: UserModel) => void;
  setAuthInitialized: (val: boolean) => void;
  isGuest: () => boolean;
  isFree: () => boolean;
  isPremium: () => boolean;
}

// Synchronously restore cached session on web to prevent auth flashing on page reload
let initialUser: UserModel = { tier: UserTier.GUEST, name: '' };
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = window.localStorage.getItem('user_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.uid) {
        initialUser = parsed;
      }
    }
  } catch (_) {}
}

export const useUserStore = create<UserState>((set, get) => ({
  user: initialUser,
  authInitialized: !!initialUser.uid,

  setUser: (user) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (user.uid && user.tier !== UserTier.GUEST) {
          window.localStorage.setItem('user_session', JSON.stringify(user));
        } else {
          window.localStorage.removeItem('user_session');
        }
      } catch (_) {}
    }
    set({ user });
  },
  setAuthInitialized: (val: boolean) => set({ authInitialized: val }),
  isGuest: () => get().user.tier === UserTier.GUEST,
  isFree: () => get().user.tier === UserTier.FREE,
  isPremium: () => get().user.tier === UserTier.PREMIUM,
}));
