import { create } from 'zustand';

export enum UserTier {
  GUEST = 'guest',
  FREE = 'free',
  PREMIUM = 'premium',
}

export type UserRole = 'user' | 'coach';

export interface UserModel {
  id?: string;
  name?: string;
  tier: UserTier;
  role?: UserRole;
}

interface UserState {
  user: UserModel;
  setUser: (user: UserModel) => void;
  isGuest: () => boolean;
  isFree: () => boolean;
  isPremium: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Always starts as GUEST — Login page sets the correct tier
  user: { tier: UserTier.GUEST, name: '' },

  setUser: (user) => set({ user }),
  isGuest: () => get().user.tier === UserTier.GUEST,
  isFree: () => get().user.tier === UserTier.FREE,
  isPremium: () => get().user.tier === UserTier.PREMIUM,
}));
