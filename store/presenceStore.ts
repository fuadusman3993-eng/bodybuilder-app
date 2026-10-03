import { create } from 'zustand';

interface PresenceStore {
  onlineUsers: Record<string, boolean>;
  setAllOnline: (presenceState: any) => void;
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  onlineUsers: {},
  setAllOnline: (presenceState) => {
    const online: Record<string, boolean> = {};
    for (const key in presenceState) {
      if (presenceState[key] && presenceState[key].length > 0) {
        online[key] = true;
      }
    }
    set({ onlineUsers: online });
  },
}));
