import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { useChatStore } from '../store/chatStore';

export default function GlobalChatListener() {
  const { user } = useUserStore();
  const refreshUnreadCount = useChatStore((s) => s.refreshUnreadCount);
  const userUidRef = useRef(user?.uid);

  useEffect(() => {
    userUidRef.current = user?.uid;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    // Initial fetch of unread count
    refreshUnreadCount(user.uid);

    // Subscribe to all changes on the messages table in real-time
    const channel = supabase
      .channel(`global_messages_listener_${user.uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // If the message is from someone else, refresh the unread badge
          if (payload.new && payload.new.sender_uid !== userUidRef.current) {
            if (userUidRef.current) {
              refreshUnreadCount(userUidRef.current);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          // When a message is marked as read or updated, refresh
          if (userUidRef.current) {
            refreshUnreadCount(userUidRef.current);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        () => {
          if (userUidRef.current) {
            refreshUnreadCount(userUidRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.uid]);

  return null;
}
