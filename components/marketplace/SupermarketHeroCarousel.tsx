/**
 * SupermarketHeroCarousel
 * ─────────────────────────────────────────────────────────────
 * Authentic Image 2 Saudi Grocery Replica:
 * 1. Curated product showcase shelves (Protein, Produce, Supps)
 * 2. FitPulse Fresh Box brand emblem
 * 3. Continuous 60fps shimmer / gleaming light sweep across "Shop Now ▶"
 * 4. 4-second auto-sliding carousel with pagination dots
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MarketplaceCategory } from '../../lib/marketplaceData';

export interface HeroSlideDeal {
  id: string;
  badge: string;
  title: string;
  category: MarketplaceCategory;
  gradientColors: [string, string];
  products: {
    id: string;
    title: string;
    weight: string;
    priceEtb: number;
    originalPriceEtb: number;
    discountPercent: number;
    imageUrl: string;
  }[];
}

const HERO_SLIDES: HeroSlideDeal[] = [
  {
    id: 'slide-protein',
    badge: '📦 FITPULSE FRESH BOX • UP TO 30% OFF',
    title: 'High-Protein Muscle Pantry',
    category: 'poultry_meat',
    gradientColors: ['#0A2518', '#071810'],
    products: [
      {
        id: 'prod-chicken-1',
        title: 'Sadia Chicken Breasts',
        weight: '450g',
        priceEtb: 420,
        originalPriceEtb: 495,
        discountPercent: 15,
        imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
      },
      {
        id: 'prod-eggs-1',
        title: 'Farm Fresh Eggs Crate',
        weight: '30 Eggs',
        priceEtb: 480,
        originalPriceEtb: 580,
        discountPercent: 17,
        imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80',
      },
      {
        id: 'prod-chicken-2',
        title: 'Al Kabeer Tender Strips',
        weight: '270g',
        priceEtb: 310,
        originalPriceEtb: 375,
        discountPercent: 17,
        imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
      },
      {
        id: 'prod-yogurt-1',
        title: 'Greek Yogurt 0% Fat',
        weight: '450g',
        priceEtb: 195,
        originalPriceEtb: 240,
        discountPercent: 18,
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
      },
    ],
  },
  {
    id: 'slide-carbs',
    badge: '📦 FITPULSE FRESH BOX • UP TO 25% OFF',
    title: 'Clean Energy & Fresh Superfoods',
    category: 'fresh_produce',
    gradientColors: ['#0C2333', '#081722'],
    products: [
      {
        id: 'prod-blueberries-1',
        title: 'Imported Blueberries',
        weight: '125g',
        priceEtb: 280,
        originalPriceEtb: 350,
        discountPercent: 20,
        imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&q=80',
      },
      {
        id: 'prod-oats-1',
        title: 'Whole Rolled Oats',
        weight: '1kg',
        priceEtb: 320,
        originalPriceEtb: 400,
        discountPercent: 20,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
      },
      {
        id: 'prod-pb-1',
        title: '100% Pure Peanut Butter',
        weight: '500g',
        priceEtb: 360,
        originalPriceEtb: 450,
        discountPercent: 20,
        imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
      },
      {
        id: 'prod-bananas-1',
        title: 'Hawassa Sweet Bananas',
        weight: '1kg',
        priceEtb: 120,
        originalPriceEtb: 150,
        discountPercent: 20,
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=80',
      },
    ],
  },
  {
    id: 'slide-supps',
    badge: '📦 FITPULSE FRESH BOX • UP TO 20% OFF',
    title: 'Gym Vault & Pro Supplements',
    category: 'supplements',
    gradientColors: ['#1C162A', '#110D1B'],
    products: [
      {
        id: 'prod-1',
        title: 'Gold Standard Whey',
        weight: '2kg',
        priceEtb: 4900,
        originalPriceEtb: 5800,
        discountPercent: 15,
        imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&q=80',
      },
      {
        id: 'prod-2',
        title: 'Creatine Monohydrate',
        weight: '300g',
        priceEtb: 2100,
        originalPriceEtb: 2500,
        discountPercent: 16,
        imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80',
      },
      {
        id: 'prod-3',
        title: 'Pre-Workout Igniter',
        weight: '30 Servings',
        priceEtb: 2400,
        originalPriceEtb: 2900,
        discountPercent: 17,
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
      },
      {
        id: 'prod-belt-1',
        title: 'Leather Lifting Belt',
        weight: 'Pro Gear',
        priceEtb: 1850,
        originalPriceEtb: 2300,
        discountPercent: 20,
        imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
      },
    ],
  },
];

interface Props {
  onShopNow: (category: MarketplaceCategory) => void;
  onProductPress?: (productId: string) => void;
}

export default function SupermarketHeroCarousel({ onShopNow, onProductPress }: Props) {
  const { width } = useWindowDimensions();
  const carouselWidth = Math.min(width - 32, 600); // 16px padding on left/right

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const autoSlideTimer = useRef<any>(null);

  // Shimmer / Gleam animation for "Shop Now" button
  const shimmerAnim = useRef(new Animated.Value(-120)).current;

  // Pulse animation for button glow
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Shimmer sweep animation loop (glides light across the button every 2.6s)
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 200,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
        Animated.timing(shimmerAnim, {
          toValue: -120,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    // 2. Subtle button breathing scale loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.035,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      shimmerLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  // Auto-slide every 4.2 seconds
  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [activeIndex, carouselWidth]);

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideTimer.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % HERO_SLIDES.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * carouselWidth,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4200);
  };

  const stopAutoSlide = () => {
    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = null;
    }
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIdx = Math.round(offsetX / carouselWidth);
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < HERO_SLIDES.length) {
      setActiveIndex(newIdx);
    }
    startAutoSlide();
  };

  const currentSlide = HERO_SLIDES[activeIndex] || HERO_SLIDES[0];

  return (
    <View style={[styles.container, { width: carouselWidth }]}>
      {/* ── Carousel Slider ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={stopAutoSlide}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ width: carouselWidth * HERO_SLIDES.length }}
      >
        {HERO_SLIDES.map((slide) => (
          <LinearGradient
            key={slide.id}
            colors={slide.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.slideCard, { width: carouselWidth }]}
          >
            {/* Top Badge & Header */}
            <View style={styles.topHeaderRow}>
              <View style={styles.boxBadge}>
                <Ionicons name="cube" size={12} color="#000" style={{ marginRight: 4 }} />
                <Text style={styles.boxBadgeText}>{slide.badge}</Text>
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
            </View>

            {/* Product Shelf Showcase Row (White cards - Image 2 Replica) */}
            <View style={styles.shelfRow}>
              {slide.products.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.productFrame}
                  activeOpacity={0.85}
                  onPress={() => onProductPress?.(item.id) || onShopNow(slide.category)}
                >
                  {/* Discount sticker in corner */}
                  <View style={styles.discountSticker}>
                    <Text style={styles.discountStickerText}>-{item.discountPercent}%</Text>
                  </View>

                  {/* Product thumbnail */}
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.productImg}
                    contentFit="cover"
                    transition={150}
                  />

                  {/* Price Tag (Red bold) */}
                  <Text style={styles.shelfPriceText} numberOfLines={1}>
                    {item.priceEtb} <Text style={styles.etbUnit}>ETB</Text>
                  </Text>
                  <Text style={styles.shelfOriginalPrice} numberOfLines={1}>
                    {item.originalPriceEtb}
                  </Text>
                  <Text style={styles.shelfItemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Center Glowing "Shop Now ▶" Button ── */}
            <View style={styles.buttonCenterWrap}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={styles.shopNowPillBtn}
                  activeOpacity={0.88}
                  onPress={() => onShopNow(slide.category)}
                >
                  {/* Base Green Gradient */}
                  <LinearGradient
                    colors={['#00E676', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />

                  {/* Animated Light Shimmer Glide (nesbraq reflection) */}
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.shimmerOverlay,
                      {
                        transform: [
                          { translateX: shimmerAnim },
                          { rotate: '25deg' },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        'rgba(255, 255, 255, 0)',
                        'rgba(255, 255, 255, 0.65)',
                        'rgba(255, 255, 255, 0)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: 45, height: '100%' }}
                    />
                  </Animated.View>

                  <Text style={styles.shopNowBtnText}>Shop Now</Text>
                  <Ionicons name="play" size={13} color="#000000" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* ── Pagination Indicator Dots (● ○ ○) ── */}
      <View style={styles.paginationRow}>
        {HERO_SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              scrollRef.current?.scrollTo({ x: i * carouselWidth, animated: true });
              setActiveIndex(i);
            }}
            style={[
              styles.dot,
              activeIndex === i ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    alignSelf: 'center',
  },
  slideCard: {
    borderRadius: 20,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    overflow: 'hidden',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  topHeaderRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  boxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E676',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 14,
    marginBottom: 4,
  },
  boxBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  // Shelf Row (Image 2 Replica)
  shelfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  productFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 5,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  discountSticker: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 5,
    zIndex: 2,
  },
  discountStickerText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  productImg: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginBottom: 3,
  },
  shelfPriceText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  etbUnit: {
    fontSize: 8,
    fontWeight: '700',
  },
  shelfOriginalPrice: {
    color: '#94A3B8',
    fontSize: 8.5,
    textDecorationLine: 'line-through',
    marginTop: -1,
  },
  shelfItemTitle: {
    color: '#1E293B',
    fontSize: 8.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
    maxWidth: '100%',
  },

  // Center Glowing Button
  buttonCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopNowPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 9,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: 0,
    width: 60,
  },
  shopNowBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Pagination
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#00E676',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
