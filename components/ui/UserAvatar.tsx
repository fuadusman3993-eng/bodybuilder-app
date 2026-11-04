/**
 * UserAvatar — Universal avatar component for FitPulse
 * -------------------------------------------------------
 * Renders a photo (expo-image) if a valid URL is provided.
 * Falls back to a beautiful deterministic color circle with
 * real initials or a fitness icon — never a generic "US" placeholder.
 */
import React from 'react';
import { View, Text, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Palette & icon catalogue
// ─────────────────────────────────────────────────────────────────────────────

export const FITNESS_AVATAR_COLORS = [
  '#00E676', // FitPulse Emerald
  '#00D2FF', // Electric Cyan
  '#A855F7', // Hypertrophy Purple
  '#F97316', // Sunset Flame
  '#EF4444', // Power Crimson
  '#F59E0B', // Champion Gold
  '#EC4899', // Neon Rose
  '#334155', // Stealth Carbon
] as const;

export type AvatarIconStyle =
  | 'initials'
  | 'flash'
  | 'barbell'
  | 'flame'
  | 'trophy'
  | 'shield-checkmark';

export const FITNESS_AVATAR_ICON_NAMES: Record<AvatarIconStyle, string> = {
  initials: 'Initials',
  flash: 'Flash',
  barbell: 'Barbell',
  flame: 'Flame',
  trophy: 'Trophy',
  'shield-checkmark': 'Shield',
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true when the URL is a real photo (not null/empty/ui-avatars). */
export function isValidPhotoUrl(url?: string | null): boolean {
  if (!url || !url.trim()) return false;
  if (url.includes('ui-avatars.com')) return false;
  return true;
}

/** Deterministically maps uid or name → one of the 8 palette colours. */
export function getAvatarColor(uid?: string, name?: string): string {
  const str = uid || name || 'fitpulse';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // unsigned 32-bit int
  }
  return FITNESS_AVATAR_COLORS[hash % FITNESS_AVATAR_COLORS.length];
}

/** Derives up-to-2-character initials from a name string. Never returns "US". */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

/** Text colour for a given background (dark backgrounds → white). */
function textColorFor(bg: string): string {
  // Parse hex → luminance
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#000000' : '#FFFFFF';
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Component
// ─────────────────────────────────────────────────────────────────────────────

export interface UserAvatarProps {
  uid?: string;
  name?: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  avatarIcon?: AvatarIconStyle;
  size?: number;
  style?: ImageStyle | ViewStyle;
}

export default function UserAvatar({
  uid,
  name,
  avatarUrl,
  avatarColor,
  avatarIcon = 'initials',
  size = 48,
  style,
}: UserAvatarProps) {
  const hasPhoto = isValidPhotoUrl(avatarUrl);
  const bgColor = avatarColor || getAvatarColor(uid, name);
  const fgColor = textColorFor(bgColor);
  const iconSize = size * 0.48;

  if (hasPhoto) {
    return (
      <Image
        source={avatarUrl as string}
        cachePolicy="memory-disk"
        contentFit="cover"
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          } as ImageStyle,
          style as ImageStyle,
        ]}
      />
    );
  }

  // Fallback: coloured circle with initials or fitness icon
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      {avatarIcon === 'initials' ? (
        <Text
          style={{
            color: fgColor,
            fontSize: size * 0.36,
            fontWeight: '800',
            letterSpacing: 0.5,
          }}
          numberOfLines={1}
        >
          {getInitials(name)}
        </Text>
      ) : (
        <Ionicons
          name={avatarIcon as any}
          size={iconSize}
          color={fgColor}
        />
      )}
    </View>
  );
}
