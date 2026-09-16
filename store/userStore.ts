import { create } from 'zustand';

export enum UserTier {
  GUEST = 'guest',
  FREE = 'free',
  PREMIUM = 'premium',
}

export interface UserModel {
  id?: string;
  name?: string;
  tier: UserTier;
}

interface UserState {
  user: UserModel;
  setUser: (user: UserModel) => void;
  isGuest: () => boolean;
  isFree: () => boolean;
  isPremium: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Default to FREE for testing the modal logic. (In real app, starts as GUEST until logged in)
  user: { tier: UserTier.FREE, name: 'Abebe' }, 
  setUser: (user) => set({ user }),
  isGuest: () => get().user.tier === UserTier.GUEST,
  isFree: () => get().user.tier === UserTier.FREE,
  isPremium: () => get().user.tier === UserTier.PREMIUM,
}));
