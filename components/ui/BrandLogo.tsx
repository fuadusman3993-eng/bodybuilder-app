import React from 'react';
import { Image, ImageStyle } from 'react-native';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ImageStyle;
}

const widths = {
  small: 90,
  medium: 130,
  large: 190,
};

// The PNG already contains the stylized 'F' icon + FitPulse text
export default function BrandLogo({ size = 'medium', style }: BrandLogoProps) {
  const w = widths[size];
  const h = w * 0.48; // logo aspect ratio

  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[{ width: w, height: h }, style]}
      resizeMode="contain"
    />
  );
}
