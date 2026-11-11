/**
 * SupermarketHeroCarousel
 * ─────────────────────────────────────────────────────────────
 * Authentic Image 2 Saudi Supermarket Replica in FitPulse Green:
 * 1. Curved non-rectangular banner silhouette with sculpted bottom apron
 * 2. Center green tab extends downwards ("weta bela") matching "Shop Now ▶"
 * 3. "Shop Now ▶" in crisp white text with looping 60fps light shimmer sweep
 * 4. Products AUTO-SCROLL horizontally across the shelf in clean white cards
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
import { MarketplaceCategory } from '../../lib/marketplaceData';
import { useTheme } from '../../store/themeStore';

export interface ShelfProduct {
  id: string;
  title: string;
  weight: string;
  priceEtb: number;
  originalPriceEtb: number;
  discountPercent: number;
  imageUrl: string;
  category: MarketplaceCategory;
}

const SHELF_PRODUCTS: ShelfProduct[] = [
  {
    id: 'prod-chicken-1',
    title: 'Sadia Chicken Breasts',
    weight: '450g',
    priceEtb: 420,
    originalPriceEtb: 495,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
    category: 'poultry_meat',
  },
  {
    id: 'prod-eggs-1',
    title: 'Farm Fresh Eggs (30)',
    weight: '30 Eggs',
    priceEtb: 480,
    originalPriceEtb: 580,
    discountPercent: 17,
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80',
    category: 'dairy_eggs',
  },
  {
    id: 'prod-chicken-2',
    title: 'Al Kabeer Tender Strips',
    weight: '270g',
    priceEtb: 310,
    originalPriceEtb: 375,
    discountPercent: 17,
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    category: 'poultry_meat',
  },
  {
    id: 'prod-salmon-1',
    title: 'Atlantic Salmon Fillets',
    weight: '400g',
    priceEtb: 750,
    originalPriceEtb: 850,
    discountPercent: 12,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    category: 'poultry_meat',
  },
  {
    id: 'prod-yogurt-1',
    title: 'Greek Yogurt 0% Fat',
    weight: '450g',
    priceEtb: 195,
    originalPriceEtb: 240,
    discountPercent: 18,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    category: 'dairy_eggs',
  },
  {
    id: 'prod-blueberries-1',
    title: 'Imported Blueberries',
    weight: '125g',
    priceEtb: 280,
    originalPriceEtb: 350,
    discountPercent: 20,
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&q=80',
    category: 'fresh_produce',
  },
  {
    id: 'prod-oats-1',
    title: 'Whole Rolled Oats',
    weight: '1kg',
    priceEtb: 320,
    originalPriceEtb: 400,
    discountPercent: 20,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
    category: 'carbs_fuel',
  },
  {
    id: 'prod-pb-1',
    title: '100% Pure Peanut Butter',
    weight: '500g',
    priceEtb: 360,
    originalPriceEtb: 450,
    discountPercent: 20,
    imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
    category: 'healthy_fats',
  },
  {
    id: 'prod-bananas-1',
    title: 'Hawassa Sweet Bananas',
    weight: '1kg',
    priceEtb: 120,
    originalPriceEtb: 150,
    discountPercent: 20,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=80',
    category: 'fresh_produce',
  },
  {
    id: 'prod-1',
    title: 'Gold Standard Whey',
    weight: '2kg',
    priceEtb: 4900,
    originalPriceEtb: 5800,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&q=80',
    category: 'supplements',
  },
  {
    id: 'prod-2',
    title: 'Creatine Monohydrate',
    weight: '300g',
    priceEtb: 2100,
    originalPriceEtb: 2500,
    discountPercent: 16,
    imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80',
    category: 'supplements',
  },
];

const CARD_WIDTH = 96;
const CARD_GAP = 8;
const CARD_STEP = CARD_WIDTH + CARD_GAP; // 104px per scroll step

interface Props {
  onShopNow: (category: MarketplaceCategory) => void;
  onProductPress?: (productId: string) => void;
}

export default function SupermarketHeroCarousel({ onShopNow, onProductPress }: Props) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const bannerWidth = Math.min(width - 32, 600);

  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef<number>(0);
  const autoScrollTimer = useRef<any>(null);
  const isUserTouchingRef = useRef<boolean>(false);

  // Shimmer / Gleam animation for "Shop Now" button
  const shimmerAnim = useRef(new Animated.Value(-120)).current;

  // Pulse animation for button glow
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Looping light sweep animation across the "Shop Now" button
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 220,
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

    // 2. Subtle button breathing scale
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.035,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
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

  // ── Auto-Scroll Product Reel (Items auto-scroll, not banner!) ──
  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [bannerWidth]);

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollTimer.current = setInterval(() => {
      if (isUserTouchingRef.current) return;

      const maxScroll = Math.max(0, SHELF_PRODUCTS.length * CARD_STEP - (bannerWidth - 24));
      let nextOffset = scrollOffsetRef.current + CARD_STEP;

      if (nextOffset > maxScroll) {
        // Smoothly loop back to start
        nextOffset = 0;
      }

      scrollOffsetRef.current = nextOffset;
      scrollRef.current?.scrollTo({ x: nextOffset, animated: true });
    }, 2400); // Ticks every 2.4s
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.x;
  };

  const handleScrollBegin = () => {
    isUserTouchingRef.current = true;
    stopAutoScroll();
  };

  const handleScrollEnd = () => {
    isUserTouchingRef.current = false;
    startAutoScroll();
  };

  return (
    <View style={[styles.outerWrapper, { width: bannerWidth }]}>
      {/* ── Main Green Shelf Body ── */}
      <LinearGradient
        colors={[colors.surfaceLight, colors.surface, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bannerBody, { borderColor: `${colors.primary}40`, shadowColor: colors.primary }]}
      >
        {/* Top Header Badge */}
        <View style={styles.topBadgeRow}>
          <View style={[styles.pillBadge, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}50` }]}>
            <Text style={[styles.pillBadgeText, { color: colors.primary }]}>⚡ WEEKLY SUPERMARKET DEALS • UP TO 30% OFF</Text>
          </View>
        </View>

        {/* ── Auto-Scrolling Product Shelf (Image 1 Style) ── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={styles.shelfScrollContent}
        >
          {SHELF_PRODUCTS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.productFrame}
              activeOpacity={0.85}
              onPress={() => onProductPress?.(item.id) || onShopNow(item.category)}
            >
              {/* Corner Discount Sticker (-15% off) */}
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>-{item.discountPercent}%</Text>
              </View>

              {/* Product Thumbnail */}
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.productImage}
                contentFit="contain"
                transition={150}
              />

              {/* Sale Price in Red Bold */}
              <Text style={styles.salePriceText} numberOfLines={1}>
                {item.priceEtb} <Text style={styles.currencyText}>ETB</Text>
              </Text>

              {/* Strikethrough Original Price */}
              <Text style={styles.originalPriceText} numberOfLines={1}>
                {item.originalPriceEtb}
              </Text>

              {/* Product Title */}
              <Text style={styles.productTitleText} numberOfLines={1}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* ── Center Sculpted Green Apron / Tab extending downwards ("weta bela") ── */}
      <View style={styles.apronContainer}>
        {/* Curved Green Base matching the banner */}
        <LinearGradient
          colors={[colors.surface, colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.apronTab, { borderColor: `${colors.primary}40` }]}
        >
          {/* Animated Glowing & Shimmering "Shop Now ▶" Button (White text - Image 2) */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.shopNowBtn, { shadowColor: colors.primary }]}
              activeOpacity={0.88}
              onPress={() => onShopNow('all')}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark || colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Shimmer Light Reflection Sweep (nesbraq) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shimmerEffect,
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
                    'rgba(255, 255, 255, 0.7)',
                    'rgba(255, 255, 255, 0)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 45, height: '100%' }}
                />
              </Animated.View>

              {/* Crisp High-Contrast Text & Arrow */}
              <Text style={[styles.shopNowWhiteText, { color: '#000000', fontWeight: '900' }]}>Shop Now</Text>
              <Ionicons name="play" size={12} color="#000000" style={{ marginLeft: 5 }} />
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
  },
  bannerBody: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    borderBottomColor: 'rgba(0, 230, 118, 0.15)',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  topBadgeRow: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  pillBadge: {
    backgroundColor: '#00E676',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  pillBadgeText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // Auto-scrolling Shelf Content (Image 1 Style)
  shelfScrollContent: {
    paddingHorizontal: 12,
    gap: CARD_GAP,
    paddingBottom: 2,
  },
  productFrame: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 5,
    zIndex: 2,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  productImage: {
    width: '100%',
    height: 54,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    marginBottom: 3,
  },
  salePriceText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '900',
    lineHeight: 14,
  },
  currencyText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  originalPriceText: {
    color: '#94A3B8',
    fontSize: 9,
    textDecorationLine: 'line-through',
    marginTop: -1,
  },
  productTitleText: {
    color: '#1E293B',
    fontSize: 8.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
    maxWidth: '100%',
  },

  // ── Protruding Center Apron / Tab ("weta bela" shape - Image 2 Replica) ──
  apronContainer: {
    alignItems: 'center',
    marginTop: -8, // Seamlessly overlaps the bottom of the shelf
    zIndex: 10,
  },
  apronTab: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 5,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  // Glowing / Shimmering Shop Now Button with White Text
  shopNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 8.5,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 5,
  },
  shimmerEffect: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: 0,
    width: 60,
  },
  shopNowWhiteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
