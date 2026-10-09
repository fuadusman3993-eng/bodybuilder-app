import React from 'react';
import BrandLogo from '../ui/BrandLogo';

interface LogoProps {
  size?: 'large' | 'small';
}

export default function Logo({ size = 'large' }: LogoProps) {
  return <BrandLogo size={size === 'large' ? 'large' : 'small'} showText={true} layout="column" />;
}
