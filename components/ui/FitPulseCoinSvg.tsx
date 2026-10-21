import React from 'react';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
  Circle,
  G,
} from 'react-native-svg';

interface FitPulseCoinSvgProps {
  size?: number;
}

export default function FitPulseCoinSvg({ size = 48 }: FitPulseCoinSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        {/* Outer Metallic Gold Gradient */}
        <LinearGradient id="goldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FDE68A" />
          <Stop offset="25%" stopColor="#F59E0B" />
          <Stop offset="50%" stopColor="#D97706" />
          <Stop offset="75%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor="#92400E" />
        </LinearGradient>

        {/* Inner Gold Rim Gradient */}
        <LinearGradient id="goldInner" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#B45309" />
          <Stop offset="40%" stopColor="#F59E0B" />
          <Stop offset="70%" stopColor="#FEF08A" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>

        {/* Coin Core Dark Radial Fill */}
        <RadialGradient id="coreRadial" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#1E293B" stopOpacity="0.95" />
          <Stop offset="65%" stopColor="#0F172A" stopOpacity="0.98" />
          <Stop offset="100%" stopColor="#0B131F" stopOpacity="1" />
        </RadialGradient>

        {/* Neon Green Glow for Heartbeat */}
        <LinearGradient id="pulseGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#00E676" />
          <Stop offset="50%" stopColor="#69F0AE" />
          <Stop offset="100%" stopColor="#00E676" />
        </LinearGradient>
      </Defs>

      {/* ── Outer 3D Gold Hexagon ── */}
      <Polygon
        points="50,4 90,27 90,73 50,96 10,73 10,27"
        fill="url(#goldOuter)"
      />

      {/* ── Outer Rim Bevel Highlight ── */}
      <Polygon
        points="50,8 86,29 86,71 50,92 14,71 14,29"
        fill="url(#goldInner)"
      />

      {/* ── Coin Face Inset Hexagon (Dark Metallic Core) ── */}
      <Polygon
        points="50,13 81,31 81,69 50,87 19,69 19,31"
        fill="url(#coreRadial)"
      />

      {/* ── Embossed Inner Gold Ring ── */}
      <Circle
        cx="50"
        cy="50"
        r="28"
        stroke="url(#goldOuter)"
        strokeWidth="2.5"
        strokeDasharray="3 3"
        fill="none"
        opacity={0.65}
      />

      {/* ── Glowing FitPulse Heartbeat ECG Pulse Waveform ── */}
      <G>
        {/* Subtle Ambient Pulse Glow */}
        <Path
          d="M 22 50 L 36 50 L 43 32 L 50 68 L 57 39 L 64 50 L 78 50"
          stroke="#00E676"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
        />
        {/* Sharp Foreground Neon Heartbeat Line */}
        <Path
          d="M 22 50 L 36 50 L 43 32 L 50 68 L 57 39 L 64 50 L 78 50"
          stroke="url(#pulseGlow)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}
