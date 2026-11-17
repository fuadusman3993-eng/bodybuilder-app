import React from 'react';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  G,
} from 'react-native-svg';

interface FitPulseCoinSvgProps {
  size?: number;
  idPrefix?: string;
}

function FitPulseCoinSvgComponent({ size = 48, idPrefix = 'fpCoin' }: FitPulseCoinSvgProps) {
  const outerRimId = `${idPrefix}_outerRim`;
  const innerRimId = `${idPrefix}_innerRim`;
  const coinFaceId = `${idPrefix}_coinFace`;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        {/* Outer Metallic 3D Gold Gradient */}
        <LinearGradient id={outerRimId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF08A" />
          <Stop offset="25%" stopColor="#FBBF24" />
          <Stop offset="55%" stopColor="#F59E0B" />
          <Stop offset="80%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#92400E" />
        </LinearGradient>

        {/* Inner Gold Rim Bevel Gradient */}
        <LinearGradient id={innerRimId} x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#B45309" />
          <Stop offset="35%" stopColor="#F59E0B" />
          <Stop offset="70%" stopColor="#FEF08A" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>

        {/* Coin Face Warm Gold Radial Gradient */}
        <RadialGradient id={coinFaceId} cx="42%" cy="38%" r="62%">
          <Stop offset="0%" stopColor="#FEF9C3" />
          <Stop offset="35%" stopColor="#FDE047" />
          <Stop offset="70%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#D97706" />
        </RadialGradient>
      </Defs>

      {/* ── 1. Outer 3D Gold Coin Circle ── */}
      <Circle cx="50" cy="50" r="48" fill={`url(#${outerRimId})`} />

      {/* ── 2. Subtle Outer Depth Ring ── */}
      <Circle
        cx="50"
        cy="50"
        r="46.5"
        stroke="#92400E"
        strokeWidth="0.8"
        fill="none"
        opacity={0.6}
      />

      {/* ── 3. Inner Bevel Rim ── */}
      <Circle cx="50" cy="50" r="43.5" fill={`url(#${innerRimId})`} />

      {/* ── 4. Coin Face (Smooth Warm Gold Center) ── */}
      <Circle
        cx="50"
        cy="50"
        r="40"
        fill={`url(#${coinFaceId})`}
        stroke="#B45309"
        strokeWidth="1"
      />

      {/* ── 5. Milled Inner Coin Ridge ── */}
      <Circle
        cx="50"
        cy="50"
        r="37.5"
        stroke="#FEF08A"
        strokeWidth="0.8"
        strokeDasharray="3 2"
        fill="none"
        opacity={0.5}
      />

      {/* ── 6. Official FitPulse Brand Logo (Crisp High-Contrast Solid White with Metallic Outline) ── */}
      {/* Deep Embossed Shadow Layer */}
      <G transform="translate(50, 51.5) scale(1.16) translate(-26.25, -20)">
        <Path
          d="M6.5 34 L17 13.5 C19 9 22 6 27 6 L46 6 L42.5 13.5 L27 13.5 C24 13.5 22 15 20.5 18 L12.5 34 Z"
          fill="rgba(120, 53, 15, 0.7)"
        />
        <Path
          d="M20 34 L26 22 C27.5 18.5 30 16 34 16 L44.5 16 L41 23.5 L34 23.5 C31.5 23.5 30 25 28.5 28 L25.5 34 Z"
          fill="rgba(120, 53, 15, 0.7)"
        />
      </G>

      {/* High-Contrast Foreground FitPulse Logo with Crisp Dark Amber Stroke */}
      <G transform="translate(50, 50) scale(1.16) translate(-26.25, -20)">
        <Path
          d="M6.5 34 L17 13.5 C19 9 22 6 27 6 L46 6 L42.5 13.5 L27 13.5 C24 13.5 22 15 20.5 18 L12.5 34 Z"
          fill="#FFFFFF"
          stroke="#92400E"
          strokeWidth="0.8"
        />
        <Path
          d="M20 34 L26 22 C27.5 18.5 30 16 34 16 L44.5 16 L41 23.5 L34 23.5 C31.5 23.5 30 25 28.5 28 L25.5 34 Z"
          fill="#FFFFFF"
          stroke="#92400E"
          strokeWidth="0.8"
        />
      </G>
    </Svg>
  );
}

const FitPulseCoinSvg = React.memo(FitPulseCoinSvgComponent);
export default FitPulseCoinSvg;
