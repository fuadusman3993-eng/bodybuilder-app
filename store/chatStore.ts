import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface ChatStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: (userUid: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  refreshUnreadCount: async (userUid: string) => {
    if (!userUid) {
      set({ unreadCount: 0 });
      return;
    }
    try {
      // Find all conversations where user is a participant
      const { data: convs, error: convErr } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_uid.eq.${userUid},user2_uid.eq.${userUid}`);

      if (convErr || !convs || convs.length === 0) {
        set({ unreadCount: 0 });
        return;
      }

      const convIds = convs.map((c: any) => c.id);

      // Count unread messages across these conversations sent by the other party
      const { count, error: msgErr } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .eq('is_read', false)
        .neq('sender_uid', userUid);

      if (!msgErr && typeof count === 'number') {
        set({ unreadCount: count });
      }
    } catch (e) {
      console.warn('Error refreshing chat unread count:', e);
    }
  },
}));
