import { create } from 'zustand';

export type AppDomain = 'Fitness' | 'Health' | 'Football';

interface DomainState {
  currentDomain: AppDomain;
  setDomain: (domain: AppDomain) => void;
}

export const useDomainStore = create<DomainState>((set) => ({
  currentDomain: 'Fitness',
  setDomain: (domain) => set({ currentDomain: domain }),
}));
