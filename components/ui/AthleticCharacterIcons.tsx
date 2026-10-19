import React from 'react';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  Rect,
} from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface IconProps {
  size?: number;
  selected?: boolean;
}

/**
 * Muscular athletic male torso silhouette with compression tank & emerald neon highlights
 */
export function MaleAthleteGraphic({ size = 52, selected = false }: IconProps) {
  const primaryColor = selected ? Colors.primary : '#34D399';
  const bodyColor = selected ? '#FFFFFF' : '#9CA3AF';
  const gearColor = selected ? 'url(#maleGearGradSelected)' : 'url(#maleGearGrad)';

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="maleGearGrad" x1="0" y1="0" x2="64" y2="64">
          <Stop offset="0%" stopColor="#1E293B" />
          <Stop offset="100%" stopColor="#0F172A" />
        </LinearGradient>
        <LinearGradient id="maleGearGradSelected" x1="0" y1="0" x2="64" y2="64">
          <Stop offset="0%" stopColor="#065F46" />
          <Stop offset="100%" stopColor="#022C22" />
        </LinearGradient>
        <LinearGradient id="emeraldAura" x1="0" y1="0" x2="0" y2="64">
          <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Subtle background aura when selected */}
      {selected && (
        <Circle cx="32" cy="32" r="28" fill="url(#emeraldAura)" />
      )}

      {/* Head */}
      <Circle cx="32" cy="14" r="7" fill={bodyColor} />

      {/* Trapezius / Neck */}
      <Path
        d="M27 18 L37 18 L41 24 L23 24 Z"
        fill={bodyColor}
      />

      {/* Broad Muscular Shoulders & Chest / Compression Shirt */}
      <Path
        d="M14 26 C16 23 23 22 32 22 C41 22 48 23 50 26 C53 30 52 38 48 40 L45 35 L44 54 C44 56 42 58 40 58 L24 58 C22 58 20 56 20 54 L19 35 L16 40 C12 38 11 30 14 26 Z"
        fill={gearColor}
        stroke={primaryColor}
        strokeWidth={selected ? '2' : '1.5'}
      />

      {/* Compression Seam / Muscle Contours */}
      <Path
        d="M32 23 L32 46"
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity={selected ? '1' : '0.6'}
      />
      <Path
        d="M26 31 C28 35 32 37 32 37 C32 37 36 35 38 31"
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity={selected ? '1' : '0.7'}
      />
      <Path
        d="M25 43 C28 45 32 46 32 46 C32 46 36 45 39 43"
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity={selected ? '1' : '0.6'}
      />

      {/* Muscular Biceps */}
      <Circle cx="13" cy="34" r="4.5" fill={bodyColor} opacity={selected ? 1 : 0.8} />
      <Circle cx="51" cy="34" r="4.5" fill={bodyColor} opacity={selected ? 1 : 0.8} />
    </Svg>
  );
}

/**
 * Toned athletic female fitness silhouette with sports bra & athletic waistline
 */
export function FemaleAthleteGraphic({ size = 52, selected = false }: IconProps) {
  const primaryColor = selected ? Colors.primary : '#34D399';
  const bodyColor = selected ? '#FFFFFF' : '#9CA3AF';
  const gearColor = selected ? 'url(#femaleGearGradSelected)' : 'url(#femaleGearGrad)';

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="femaleGearGrad" x1="0" y1="0" x2="64" y2="64">
          <Stop offset="0%" stopColor="#1E293B" />
          <Stop offset="100%" stopColor="#0F172A" />
        </LinearGradient>
        <LinearGradient id="femaleGearGradSelected" x1="0" y1="0" x2="64" y2="64">
          <Stop offset="0%" stopColor="#065F46" />
          <Stop offset="100%" stopColor="#022C22" />
        </LinearGradient>
        <LinearGradient id="emeraldAuraF" x1="0" y1="0" x2="0" y2="64">
          <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Subtle aura when selected */}
      {selected && (
        <Circle cx="32" cy="32" r="28" fill="url(#emeraldAuraF)" />
      )}

      {/* Head with high ponytail */}
      <Circle cx="32" cy="13" r="6" fill={bodyColor} />
      {/* Ponytail flip */}
      <Path
        d="M36 12 C40 10 44 14 43 18 C42 16 39 14 36 14 Z"
        fill={primaryColor}
      />

      {/* Elegant athletic neck & collarbone */}
      <Path
        d="M28 17 L36 17 L38 22 L26 22 Z"
        fill={bodyColor}
      />

      {/* Toned Athletic Shoulders & Sports Top */}
      <Path
        d="M17 25 C20 22 25 21 32 21 C39 21 44 22 47 25 C50 28 49 35 46 37 L43 33 L41 43 C41 44 38 45 36 45 L28 45 C26 45 23 44 23 43 L21 33 L18 37 C15 35 14 28 17 25 Z"
        fill={gearColor}
        stroke={primaryColor}
        strokeWidth={selected ? '2' : '1.5'}
      />

      {/* Crossback / Sports bra accent lines */}
      <Path
        d="M26 22 L32 30 L38 22"
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity={selected ? '1' : '0.8'}
      />
      <Path
        d="M25 36 C28 38 32 39 32 39 C32 39 36 38 39 36"
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Toned athletic waist & core definition */}
      <Path
        d="M26 45 L27 57 C27 58 29 59 32 59 C35 59 37 58 37 57 L38 45"
        fill={selected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
        stroke={primaryColor}
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />

      {/* Toned Arms */}
      <Circle cx="15" cy="33" r="3.5" fill={bodyColor} opacity={selected ? 1 : 0.8} />
      <Circle cx="49" cy="33" r="3.5" fill={bodyColor} opacity={selected ? 1 : 0.8} />
    </Svg>
  );
}

/**
 * Rich visual badges for Step 2: Fitness Goals
 */
export function GoalBadgeGraphic({ type, size = 42, selected = false }: { type: string; size?: number; selected?: boolean }) {
  const p = selected ? Colors.primary : '#34D399';

  if (type === 'muscle') {
    // 3D Hex Barbell / Dumbbell
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="ironGrad" x1="0" y1="0" x2="48" y2="48">
            <Stop offset="0%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#10B981" />
          </LinearGradient>
        </Defs>
        <Rect x="16" y="22" width="16" height="4" rx="2" fill="#E2E8F0" />
        <Rect x="8" y="14" width="8" height="20" rx="3" fill="url(#ironGrad)" stroke={p} strokeWidth="1.5" />
        <Rect x="32" y="14" width="8" height="20" rx="3" fill="url(#ironGrad)" stroke={p} strokeWidth="1.5" />
        <Rect x="5" y="17" width="4" height="14" rx="2" fill="#0F172A" stroke={p} strokeWidth="1" />
        <Rect x="39" y="17" width="4" height="14" rx="2" fill="#0F172A" stroke={p} strokeWidth="1" />
      </Svg>
    );
  }

  if (type === 'fatloss') {
    // Multi-layer Glowing Fire Flame
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="fireGrad" x1="0" y1="48" x2="0" y2="0">
            <Stop offset="0%" stopColor="#EF4444" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#10B981" />
          </LinearGradient>
        </Defs>
        <Path
          d="M24 4 C24 4 29 12 29 17 C29 19 28 21 27 23 C31 22 36 27 36 33 C36 40 30.6 44 24 44 C17.4 44 12 40 12 33 C12 25 18 19 19 14 C19 14 19 17 21 18 C23 15 24 4 24 4 Z"
          fill="url(#fireGrad)"
        />
        <Path
          d="M24 24 C24 24 27 28 27 31 C27 34 25.5 37 24 37 C22.5 37 21 34 21 31 C21 27 24 24 24 24 Z"
          fill="#FEF08A"
        />
      </Svg>
    );
  }

  if (type === 'tone') {
    // Kinetic Lightning Energy Pulse
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="voltGrad" x1="0" y1="0" x2="48" y2="48">
            <Stop offset="0%" stopColor="#06B6D4" />
            <Stop offset="100%" stopColor="#10B981" />
          </LinearGradient>
        </Defs>
        <Circle cx="24" cy="24" r="20" stroke={p} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <Path
          d="M26 6 L14 26 L24 26 L22 42 L34 22 L24 22 L26 6 Z"
          fill="url(#voltGrad)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  // health
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="heartGrad" x1="0" y1="0" x2="48" y2="48">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#059669" />
        </LinearGradient>
      </Defs>
      <Path
        d="M24 42 C24 42 7 30 7 18 C7 11 12 7 18 7 C21.5 7 23 9 24 11 C25 9 26.5 7 30 7 C36 7 41 11 41 18 C41 30 24 42 24 42 Z"
        fill="url(#heartGrad)"
        stroke="#A7F3D0"
        strokeWidth="1.5"
      />
      {/* Vitality ECG pulse line */}
      <Path
        d="M13 22 L19 22 L22 16 L26 28 L29 22 L35 22"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Visual badges for Step 3: Experience Levels
 */
export function LevelBadgeGraphic({ level, size = 42, selected = false }: { level: string; size?: number; selected?: boolean }) {
  const p = selected ? Colors.primary : '#34D399';

  if (level === 'beginner') {
    // Sprout / Seedling
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Circle cx="24" cy="24" r="20" fill="rgba(16, 185, 129, 0.15)" stroke={p} strokeWidth="1.5" />
        <Path
          d="M24 36 V22 M24 22 C24 15 15 15 15 15 C15 22 24 22 24 22 Z M24 22 C24 13 33 13 33 13 C33 20 24 22 24 22 Z"
          stroke={p}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(52, 211, 153, 0.3)"
        />
      </Svg>
    );
  }

  if (level === 'intermediate') {
    // Kinetic Double Flash
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Circle cx="24" cy="24" r="20" fill="rgba(59, 130, 246, 0.15)" stroke="#3B82F6" strokeWidth="1.5" />
        <Path
          d="M21 10 L12 24 L20 24 L17 38 L29 24 L21 24 L26 10 Z"
          fill="#3B82F6"
        />
        <Path
          d="M31 14 L24 25 L30 25 L27 36 L37 25 L31 25 L34 14 Z"
          fill={p}
        />
      </Svg>
    );
  }

  // advanced: Golden Championship Trophy
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="20" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" strokeWidth="1.5" />
      <Path
        d="M17 12 H31 V23 C31 27 28 30 24 30 C20 30 17 27 17 23 V12 Z"
        fill="#F59E0B"
        stroke="#FCD34D"
        strokeWidth="1.5"
      />
      <Path
        d="M17 15 H11 C11 20 15 22 17 22"
        stroke="#FCD34D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M31 15 H37 C37 20 33 22 31 22"
        stroke="#FCD34D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M24 30 V36 M18 36 H30"
        stroke="#FCD34D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
