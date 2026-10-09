import React from 'react';
import BrandLogo from '../ui/BrandLogo';

interface LogoProps {
  size?: 'large' | 'small';
}

// Auth Logo now delegates to the unified BrandLogo component
export default function Logo({ size = 'large' }: LogoProps) {
  return (
    <BrandLogo 
      size={size === 'large' ? 'large' : 'small'} 
      layout="column" 
    />
  );
}
