/**
 * FitPulse Unified Profile Service (Supabase SSOT)
 * ---------------------------------------------------------------------------
 * Makes Supabase the single source of truth for user identity across
 * Chat, Profile, Wallet, and Community.
 * ---------------------------------------------------------------------------
 */

import { supabase } from './supabase';

export interface UserProfile {
  uid: string;
  name: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: 'user' | 'coach';
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

// In-memory cache to guarantee instant response time across screen transitions
const profileCache: Record<string, { profile: UserProfile; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const GENERIC_NAMES = new Set(['trainee', 'user', 'athlete', 'a user']);

export function isGenericName(name?: string | null): boolean {
  if (!name || !name.trim()) return true;
  return GENERIC_NAMES.has(name.trim().toLowerCase());
}

/**
 * Autonomously resolves the real identity of a user from notifications,
 * requests, posts, stories, or email prefix if their name is generic/missing.
 * Repositories the healed identity in Supabase so subsequent reads are instant.
 */
export async function autoHealProfileIdentity(uid: string, fallbackProf?: UserProfile | null): Promise<UserProfile | null> {
  if (!uid) return null;

  try {
    // 1. Check notifications table for actual name: "X wants you to be their coach"
    const { data: nData } = await supabase
      .from('notifications')
      .select('message')
      .eq('sender_uid', uid)
      .ilike('message', '%wants you to be their coach%')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    let recoveredName: string | null = null;
    if (nData?.message) {
      const match = nData.message.replace(/\s+wants you to be their coach.*/i, '').trim();
      if (match && !isGenericName(match)) {
        recoveredName = match;
      }
    }

    // 2. Fallback to posts
    if (!recoveredName) {
      const { data: pData } = await supabase
        .from('posts')
        .select('username')
        .eq('uid', uid)
        .not('username', 'is', null)
        .limit(1)
        .maybeSingle();
      if (pData?.username && !isGenericName(pData.username)) {
        recoveredName = pData.username;
      }
    }

    // 3. Fallback to stories
    if (!recoveredName) {
      const { data: sData } = await supabase
        .from('stories')
        .select('username')
        .eq('uid', uid)
        .not('username', 'is', null)
        .limit(1)
        .maybeSingle();
      if (sData?.username && !isGenericName(sData.username)) {
        recoveredName = sData.username;
      }
    }

    // 4. Fallback to email prefix if available
    if (!recoveredName && fallbackProf?.email) {
      const prefix = fallbackProf.email.split('@')[0];
      if (prefix && !isGenericName(prefix)) {
        recoveredName = prefix;
      }
    }

    if (recoveredName) {
      const uname = fallbackProf?.username || recoveredName.toLowerCase().replace(/\s+/g, '_');
      const updated: UserProfile = {
        ...(fallbackProf || { uid }),
        uid,
        name: recoveredName,
        username: uname,
      };

      profileCache[uid] = { profile: updated, timestamp: Date.now() };

      // Asynchronously heal in database
      try {
        await supabase
          .from('profiles')
          .update({ name: recoveredName, username: uname, updated_at: new Date().toISOString() })
          .eq('uid', uid);

        await supabase
          .from('coach_requests')
          .update({ trainee_name: recoveredName })
          .eq('trainee_uid', uid);
      } catch (_) {}

      return updated;
    }
  } catch (err) {
    console.warn('[profileService] autoHealProfileIdentity error:', err);
  }

  return fallbackProf || null;
}

/**
 * Fetch a single user profile from Supabase
 */
export async function getProfile(uid: string, forceFresh = false): Promise<UserProfile | null> {
  if (!uid) return null;

  const cached = profileCache[uid];
  if (!forceFresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.profile;
  }

  try {
    // 1. Try public.profiles first
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (!error && data && data.name) {
      let prof: UserProfile = data as UserProfile;
      if (isGenericName(prof.name)) {
        const healed = await autoHealProfileIdentity(uid, prof);
        if (healed) prof = healed;
      }
      profileCache[uid] = { profile: prof, timestamp: Date.now() };
      return prof;
    }

    // 2. Fallback to coach_profiles
    const { data: cData } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (cData && cData.name) {
      const prof: UserProfile = {
        uid: cData.uid,
        name: cData.name,
        avatar_url: cData.avatar_url,
        role: 'coach',
        bio: cData.bio,
      };
      profileCache[uid] = { profile: prof, timestamp: Date.now() };
      return prof;
    }

    // 3. Fallback to posts table
    const { data: pData } = await supabase
      .from('posts')
      .select('uid, username, avatar_url')
      .eq('uid', uid)
      .limit(1)
      .maybeSingle();

    if (pData && pData.username) {
      const prof: UserProfile = {
        uid,
        name: pData.username,
        username: pData.username,
        avatar_url: pData.avatar_url,
        role: 'user',
      };
      profileCache[uid] = { profile: prof, timestamp: Date.now() };
      return prof;
    }

    // 4. Fallback to coach_requests table (for trainees who hired a coach)
    const { data: rData } = await supabase
      .from('coach_requests')
      .select('trainee_uid, trainee_name, trainee_avatar')
      .eq('trainee_uid', uid)
      .not('trainee_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rData && rData.trainee_name) {
      const prof: UserProfile = {
        uid,
        name: rData.trainee_name,
        avatar_url: rData.trainee_avatar,
        role: 'user',
      };
      profileCache[uid] = { profile: prof, timestamp: Date.now() };
      return prof;
    }
  } catch (e) {
    console.warn('[profileService] getProfile error for', uid, e);
  }

  return null;
}

/**
 * Batch-fetch profiles for multiple UIDs in a single Supabase query.
 * Perfect for Chat list, Feed, Comments, etc.
 */
export async function getProfilesBatch(uids: string[]): Promise<Record<string, UserProfile>> {
  const result: Record<string, UserProfile> = {};
  if (!uids || uids.length === 0) return result;

  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  const toFetch: string[] = [];

  // Check cache first
  for (const uid of uniqueUids) {
    const cached = profileCache[uid];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      result[uid] = cached.profile;
    } else {
      toFetch.push(uid);
    }
  }

  if (toFetch.length === 0) return result;

  try {
    // 1. Fetch from public.profiles in ONE single query
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('uid', toFetch);

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row.uid) {
          const prof = row as UserProfile;
          if (isGenericName(prof.name)) {
            autoHealProfileIdentity(row.uid, prof).then((healed) => {
              if (healed) {
                result[row.uid] = healed;
                profileCache[row.uid] = { profile: healed, timestamp: Date.now() };
              }
            });
          }
          result[row.uid] = prof;
          profileCache[row.uid] = { profile: prof, timestamp: Date.now() };
        }
      }
    }

    // 2. For any remaining missing UIDs, resolve via individual fallback
    const missing = toFetch.filter((u) => !result[u]);
    if (missing.length > 0) {
      await Promise.all(
        missing.map(async (u) => {
          const p = await getProfile(u, true);
          if (p) result[u] = p;
        })
      );
    }
  } catch (e) {
    console.warn('[profileService] getProfilesBatch error:', e);
  }

  return result;
}

/**
 * Sync user profile to Supabase (calls sync_user_profile RPC or upserts directly)
 */
export async function syncUserProfile(profile: Partial<UserProfile> & { uid: string }): Promise<UserProfile | null> {
  if (!profile.uid) return null;

  const resolvedName = (profile.name && !isGenericName(profile.name))
    ? profile.name.trim()
    : (profile.username && !isGenericName(profile.username))
      ? profile.username.trim()
      : profile.email?.split('@')[0] || profile.name || 'Member';

  try {
    // 1. Try sync_user_profile RPC
    const { data: rpcData, error: rpcErr } = await supabase.rpc('sync_user_profile', {
      p_uid: profile.uid,
      p_name: resolvedName,
      p_email: profile.email || null,
      p_avatar_url: profile.avatar_url || null,
      p_role: profile.role || 'user',
      p_city: profile.city || null,
      p_country: profile.country || 'Ethiopia',
    });

    if (!rpcErr && rpcData) {
      const p = rpcData as UserProfile;
      profileCache[profile.uid] = { profile: p, timestamp: Date.now() };
      return p;
    }

    // 2. Direct upsert fallback
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          uid: profile.uid,
          name: resolvedName,
          username: profile.username || resolvedName.toLowerCase().replace(/\s+/g, '_'),
          email: profile.email || undefined,
          avatar_url: profile.avatar_url || undefined,
          role: profile.role || 'user',
          city: profile.city || undefined,
          country: profile.country || 'Ethiopia',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'uid' }
      )
      .select()
      .maybeSingle();

    if (!error && data) {
      const p = data as UserProfile;
      profileCache[profile.uid] = { profile: p, timestamp: Date.now() };
      return p;
    }
  } catch (e) {
    console.warn('[profileService] syncUserProfile error:', e);
  }

  return null;
}

/**
 * Update user profile in Supabase
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<boolean> {
  if (!uid) return false;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('uid', uid);

    if (!error) {
      // Update cache
      if (profileCache[uid]) {
        profileCache[uid].profile = { ...profileCache[uid].profile, ...updates };
        profileCache[uid].timestamp = Date.now();
      }
      return true;
    }
  } catch (e) {
    console.warn('[profileService] updateUserProfile error:', e);
  }

  return false;
}
