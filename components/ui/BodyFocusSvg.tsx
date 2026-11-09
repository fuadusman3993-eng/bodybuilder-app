import React from 'react';
import Svg, { Path, G, Rect, Circle } from 'react-native-svg';

interface BodyFocusSvgProps {
  size?: number;
  color?: string;
}

/**
 * 1. Chest Pectoral Muscular Silhouette SVG
 */
export function ChestSvg({ size = 48, color = '#FFFFFF' }: BodyFocusSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Outer Contours of Upper Torso & Shoulders */}
      <Path
        d="M10 22 C14 18 22 16 32 18 C42 16 50 18 54 22 C58 26 56 34 50 36 C42 38 36 34 32 30 C28 34 22 38 14 36 C8 34 6 26 10 22 Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color + '15'}
      />
      {/* Left Pectoral Plate */}
      <Path
        d="M16 26 C22 25 28 27 30 31 C28 36 22 38 16 34 C13 32 13 28 16 26 Z"
        fill={color}
        opacity={0.9}
      />
      {/* Right Pectoral Plate */}
      <Path
        d="M48 26 C42 25 36 27 34 31 C36 36 42 38 48 34 C51 32 51 28 48 26 Z"
        fill={color}
        opacity={0.9}
      />
      {/* Sternum Center Line */}
      <Path
        d="M32 20 L32 36"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* Lower Rib Contours */}
      <Path
        d="M22 39 C26 42 38 42 42 39"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
    </Svg>
  );
}

/**
 * 2. Arm & Shoulder (Bicep / Deltoid) Muscular Silhouette SVG
 */
export function ArmShoulderSvg({ size = 48, color = '#FFFFFF' }: BodyFocusSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Flexed Arm Silhouette (Deltoid, Bicep Peak, Forearm, Fist) */}
      <Path
        d="M16 46 C16 46 14 38 16 30 C18 22 24 16 32 16 C38 16 44 20 44 26 C44 28 48 28 52 30 C56 32 56 38 52 40 C48 42 44 40 40 38 C38 46 32 48 24 48 C18 48 16 46 16 46 Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color + '15'}
      />
      {/* Deltoid Head */}
      <Path
        d="M20 28 C22 20 28 18 34 20 C32 26 26 30 20 28 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Bicep Muscle Peak */}
      <Path
        d="M32 22 C38 20 42 24 40 30 C36 32 32 28 32 22 Z"
        fill={color}
        opacity={0.95}
      />
      {/* Forearm & Fist Definition */}
      <Path
        d="M40 34 C44 32 50 33 51 36 C50 39 46 40 42 38 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Tricep Line */}
      <Path
        d="M24 34 C26 40 28 44 32 46"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.7}
      />
    </Svg>
  );
}

/**
 * 3. Butt & Leg (Glutes, Quads, Calves) Athletic Silhouette SVG
 */
export function ButtLegSvg({ size = 48, color = '#FFFFFF' }: BodyFocusSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Athletic Legs & Glutes Contour */}
      <Path
        d="M26 12 C30 12 36 14 38 18 C42 24 40 32 36 38 C34 42 32 48 34 54 C35 56 33 58 30 58 C28 58 27 54 28 50 C29 44 26 38 24 32 C22 26 22 18 26 12 Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color + '15'}
      />
      {/* Front Quad Curve */}
      <Path
        d="M32 18 C36 20 38 26 36 32 C34 28 32 22 32 18 Z"
        fill={color}
        opacity={0.9}
      />
      {/* Glute Curvature */}
      <Path
        d="M26 16 C23 20 22 26 24 30 C25 24 26 18 26 16 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Hamstring / Knee Definition */}
      <Path
        d="M28 34 C30 36 34 38 35 42"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Calf Muscle Curve */}
      <Path
        d="M29 44 C33 46 34 50 33 54 C31 52 30 48 29 44 Z"
        fill={color}
        opacity={0.9}
      />
    </Svg>
  );
}

/**
 * 4. Six Pack (Abdominal Muscles) Silhouette SVG
 */
export function SixPackSvg({ size = 48, color = '#FFFFFF' }: BodyFocusSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Ribcage / Oblique Boundary Frame */}
      <Path
        d="M16 16 C22 14 42 14 48 16 C46 26 44 38 46 50 C40 52 24 52 18 50 C20 38 18 26 16 16 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill={color + '10'}
        opacity={0.6}
      />
      {/* Linea Alba (Vertical Center Divider) */}
      <Path
        d="M32 16 L32 48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* Top 2 Abs */}
      <Rect x="23" y="18" width="7" height="6.5" rx="2" fill={color} opacity={0.9} />
      <Rect x="34" y="18" width="7" height="6.5" rx="2" fill={color} opacity={0.9} />
      {/* Middle 2 Abs */}
      <Rect x="23" y="27" width="7" height="6.5" rx="2" fill={color} opacity={0.9} />
      <Rect x="34" y="27" width="7" height="6.5" rx="2" fill={color} opacity={0.9} />
      {/* Lower 2 Abs */}
      <Rect x="24" y="36" width="6.5" height="7" rx="2" fill={color} opacity={0.9} />
      <Rect x="33.5" y="36" width="6.5" height="7" rx="2" fill={color} opacity={0.9} />
      {/* Obliques Flanking Accents */}
      <Path
        d="M18 28 C20 32 20 38 19 44"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={0.65}
      />
      <Path
        d="M46 28 C44 32 44 38 45 44"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={0.65}
      />
    </Svg>
  );
}
