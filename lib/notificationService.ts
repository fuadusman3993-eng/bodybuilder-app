import { supabase } from './supabase';

export interface SendNotificationParams {
  user_uid: string;
  sender_uid: string;
  type: 'like_post' | 'like_story' | 'follow' | 'comment_post' | 'request' | 'request_accepted';
  message: string;
}

// In-memory debounce cache to prevent rapid button-mashing spam (30s window)
const recentNotificationTimestamps = new Map<string, number>();
const NOTIFICATION_DEBOUNCE_MS = 30 * 1000;

/**
 * Sends a notification with robust deduplication & spam prevention:
 * 1. Self-action guard: suppresses notification if sender is receiver.
 * 2. In-memory debounce: suppresses rapid button mashing / toggle spam.
 * 3. Database deduplication: for like_post, like_story, and follow, if a notification
 *    already exists between the two users, it refreshes timestamp/unread status
 *    instead of inserting duplicate rows.
 */
export async function sendNotification({
  user_uid,
  sender_uid,
  type,
  message,
}: SendNotificationParams): Promise<void> {
  if (!user_uid || !sender_uid || user_uid === sender_uid) return;

  const key = `${user_uid}_${sender_uid}_${type}`;
  const now = Date.now();
  const lastSent = recentNotificationTimestamps.get(key);

  if (lastSent && now - lastSent < NOTIFICATION_DEBOUNCE_MS) {
    // Within debounce window: avoid spamming database
    return;
  }
  recentNotificationTimestamps.set(key, now);

  try {
    // For like and follow actions, check if an existing notification already exists
    if (['like_post', 'like_story', 'follow'].includes(type)) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_uid', user_uid)
        .eq('sender_uid', sender_uid)
        .eq('type', type)
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        // Refresh existing notification instead of creating a duplicate row
        await supabase
          .from('notifications')
          .update({
            message,
            is_read: false,
            created_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        return;
      }
    }

    // Insert new notification
    await supabase.from('notifications').insert({
      user_uid,
      sender_uid,
      type,
      message,
    });
  } catch (err) {
    console.warn('[notificationService] sendNotification error:', err);
  }
}

/**
 * Removes a notification when the user undoes the action (e.g. unlike post, unlike story, unfollow):
 * Ensures ghost notifications are removed immediately so the recipient isn't notified of unliked content.
 */
export async function removeNotification({
  user_uid,
  sender_uid,
  type,
}: {
  user_uid: string;
  sender_uid: string;
  type: 'like_post' | 'like_story' | 'follow';
}): Promise<void> {
  if (!user_uid || !sender_uid || user_uid === sender_uid) return;

  // Clear debounce timestamp so a subsequent intentional like can register fresh
  const key = `${user_uid}_${sender_uid}_${type}`;
  recentNotificationTimestamps.delete(key);

  try {
    await supabase
      .from('notifications')
      .delete()
      .eq('user_uid', user_uid)
      .eq('sender_uid', sender_uid)
      .eq('type', type);
  } catch (err) {
    console.warn('[notificationService] removeNotification error:', err);
  }
}
