import { supabase } from './supabase';

export const FITPULSE_OFFICIAL_UID = 'fitpulse_official';

export function getOfficialUnderReviewText(coachName?: string): string {
  const nameStr = coachName?.trim() ? ` ${coachName.trim()}` : '';
  return `🛡️ FitPulse Notifications: Coach Application Received\n\nHello${nameStr}!\n\nYour coach application and verification credentials have been securely received by the FitPulse Safety Board.\n\nTo safeguard athlete safety and maintain high professional coaching standards, our board manually verifies all submitted certifications and identity documents within 24–48 hours.\n\nYour account will remain in "Under Review" status until verified. If additional documentation or clarification is needed, our board will reach out to you directly through this official verified channel.\n\n— FitPulse Executive Safety Board`;
}

/**
 * Sends an official direct message from the verified FitPulse Safety Board / CEO account
 * directly into the user's 1-on-1 Chat inbox.
 */
export async function sendOfficialFitPulseMessage(
  recipientUid: string,
  messageText: string,
  title: string = 'FitPulse Notifications'
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
          name: 'FitPulse',
          username: 'fitpulse',
          avatar_url: 'https://bodybuilder-app-phi.vercel.app/fitpulse-icon.png',
          role: 'admin',
          is_verified: true,
          bio: 'Official FitPulse Service & Verification Board',
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

/**
 * Idempotently ensures that an applicant in 'pending_review' has the official welcome
 * message in their Chat conversation with FitPulse Official.
 * Automatically migrates legacy Amharic messages to international English.
 */
export async function ensureCoachUnderReviewMessage(
  recipientUid: string,
  coachName?: string
): Promise<void> {
  if (!recipientUid || recipientUid === FITPULSE_OFFICIAL_UID) return;

  const u1 = FITPULSE_OFFICIAL_UID < recipientUid ? FITPULSE_OFFICIAL_UID : recipientUid;
  const u2 = FITPULSE_OFFICIAL_UID < recipientUid ? recipientUid : FITPULSE_OFFICIAL_UID;
  const newMsgText = getOfficialUnderReviewText(coachName);

  try {
    // Check if conversation already exists
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, last_message')
      .eq('user1_uid', u1)
      .eq('user2_uid', u2)
      .maybeSingle();

    if (conv?.id) {
      // Check if message from fitpulse_official already exists in this conversation
      const { data: msg } = await supabase
        .from('messages')
        .select('id, text')
        .eq('conversation_id', conv.id)
        .eq('sender_uid', FITPULSE_OFFICIAL_UID)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (msg?.id) {
        // Auto-migrate legacy Amharic messages to international English standard
        if (msg.text && (msg.text.includes('ሰላም') || msg.text.includes('በግምገማ') || msg.text.includes('ማመልከቻዎ'))) {
          await supabase.from('messages').update({ text: newMsgText }).eq('id', msg.id);
          await supabase.from('conversations').update({
            last_message: newMsgText.length > 80 ? newMsgText.slice(0, 80) + '...' : newMsgText,
            last_message_at: new Date().toISOString(),
          }).eq('id', conv.id);
        }
        return;
      }
    }

    // Message does not exist yet: send clean English message now!
    await sendOfficialFitPulseMessage(
      recipientUid,
      newMsgText,
      '🛡️ Coach Application Received (24–48 Hours)'
    );
  } catch (err) {
    console.warn('Error ensuring coach under review message:', err);
  }
}
