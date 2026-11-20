import { supabase } from './supabase';

export const FITPULSE_OFFICIAL_UID = 'fitpulse_official';

/**
 * Sends an official direct message from the verified FitPulse Safety Board / CEO account
 * directly into the user's 1-on-1 Chat inbox.
 */
export async function sendOfficialFitPulseMessage(
  recipientUid: string,
  messageText: string,
  title: string = 'FitPulse Safety Board 🛡️'
): Promise<{ success: boolean; messageId?: string }> {
  if (!recipientUid || recipientUid === FITPULSE_OFFICIAL_UID) {
    return { success: false };
  }

  try {
    // 1. Ensure official FitPulse profile exists in profiles table
    try {
      await supabase.from('profiles').upsert(
        {
          uid: FITPULSE_OFFICIAL_UID,
          name: 'FitPulse Safety Board 🛡️',
          username: 'fitpulse_board',
          avatar_url: 'https://ui-avatars.com/api/?name=FitPulse+Board&background=00E676&color=000&size=200&bold=true',
          role: 'admin',
          is_verified: true,
          bio: 'Official FitPulse Sports & Athlete Safety Verification Board',
        },
        { onConflict: 'uid' }
      );
    } catch (_) {}

    // 2. Determine ordered conversation participant keys
    const u1 = FITPULSE_OFFICIAL_UID < recipientUid ? FITPULSE_OFFICIAL_UID : recipientUid;
    const u2 = FITPULSE_OFFICIAL_UID < recipientUid ? recipientUid : FITPULSE_OFFICIAL_UID;

    // 3. Find or create conversation
    let convId: string | null = null;
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_uid', u1)
      .eq('user2_uid', u2)
      .maybeSingle();

    if (existingConv?.id) {
      convId = existingConv.id;
    } else {
      const { data: createdConv, error: createErr } = await supabase
        .from('conversations')
        .insert({
          user1_uid: u1,
          user2_uid: u2,
          last_message: messageText,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!createErr && createdConv?.id) {
        convId = createdConv.id;
      }
    }

    // 4. Insert message into messages table
    if (convId) {
      const { data: msgData } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_uid: FITPULSE_OFFICIAL_UID,
          text: messageText,
          is_read: false,
          type: 'text',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      // Update conversation timestamp & last message snippet
      await supabase
        .from('conversations')
        .update({
          last_message: messageText.length > 80 ? messageText.slice(0, 80) + '...' : messageText,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', convId);

      // 5. Also push an in-app notification so the user gets an instant notification indicator
      try {
        await supabase.from('notifications').insert({
          user_id: recipientUid,
          user_uid: recipientUid,
          sender_uid: FITPULSE_OFFICIAL_UID,
          type: 'request',
          title,
          message: messageText.length > 120 ? messageText.slice(0, 120) + '...' : messageText,
          created_at: new Date().toISOString(),
        });
      } catch (_) {}

      return { success: true, messageId: msgData?.id };
    }

    return { success: false };
  } catch (err) {
    console.warn('Failed to send official FitPulse message:', err);
    return { success: false };
  }
}
