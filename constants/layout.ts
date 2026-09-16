/**
 * Responsive layout constants for BodyBuilder app.
 * Follows Instagram-style mobile proportions.
 * Never use fixed widths — always use these values.
 */
import { useWindowDimensions } from 'react-native';

// Design base width (iPhone 14 Pro = 393px)
const BASE_WIDTH = 393;

/**
 * Hook: returns responsive scale factor and helpers.
 * Use inside components so it re-calculates on rotation/resize.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const scale = width / BASE_WIDTH;

  // Responsive font size
  const fs = (size: number) => Math.round(size * Math.min(scale, 1.3));
  // Responsive spacing
  const sp = (size: number) => Math.round(size * Math.min(scale, 1.25));

  return {
    width,
    height,
    scale,
    fs,
    sp,
    isSmall: width < 360,
    isMedium: width >= 360 && width < 414,
    isLarge: width >= 414,
  };
}

// Static values — safe to use outside components
export const Layout = {
  // Spacing
  pagePadding: '5%' as const,
  contentPadding: 16,

  // Typography (Instagram-style)
  fontXS: 11,
  fontSM: 12,
  fontMD: 14,
  fontLG: 16,
  fontXL: 18,
  font2XL: 20,
  font3XL: 24,
  fontHero: 28,

  // Component heights
  headerHeight: 52,
  tabBarHeight: 60,
  storyAvatarSize: 60,
  storyAvatarOuter: 66,
  iconSize: 24,
  iconSizeSM: 20,
  iconSizeLG: 28,

  // Border radius
  radiusSM: 8,
  radiusMD: 12,
  radiusLG: 16,
  radiusXL: 24,
  radiusFull: 9999,

  // Image aspect ratios
  aspectSquare: 1,
  aspectPortrait: 4 / 5,
  aspectHero: 16 / 10,
};
