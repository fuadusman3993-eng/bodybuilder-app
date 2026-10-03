import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';

export default function GlobalPresence() {
  const { user } = useUserStore();

  useEffect(() => {
    if (!user?.uid) return;

    // Join the global presence channel
    const presenceChannel = supabase.channel('global_presence', {
      config: {
        presence: {
          key: user.uid,
        },
      },
    });

    presenceChannel.on('presence', { event: 'sync' }, () => {
      // Just connecting
    });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track our online status
        await presenceChannel.track({
          online_at: new Date().toISOString(),
          uid: user.uid,
        });
      }
    });

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.uid]);

  return null; // This component doesn't render anything
}
