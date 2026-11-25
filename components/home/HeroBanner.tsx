import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Image, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../store/themeStore';

const BANNERS = [
  {
    id: '1',
    tag: 'NEW CHALLENGE',
    title: '30 Days',
    titleAccent: 'Better You',
    subtitle: 'Build healthy habits. See real results.',
    quote: 'Discipline\nBuilds\nFreedom',
    image: require('../../assets/images/banners/challenge-hero.jpg'),
    route: '/challenge',
  },
  {
    id: '2',
    tag: 'TRENDING',
    title: 'Find Your',
    titleAccent: 'Coach',
    subtitle: 'Train with certified professionals.',
    quote: 'Stronger\nEvery\nDay',
    image: require('../../assets/images/banners/coach-hero.jpg'),
    route: '/(tabs)/chat',
  },
  {
    id: '3',
    tag: 'NEW WORKOUT',
    title: 'Push Your',
    titleAccent: 'Limits',
    subtitle: 'Daily exercises for maximum growth.',
    quote: 'No Pain\nNo Gain',
    image: require('../../assets/images/banners/workout-hero.jpg'),
    route: '/workout',
  },
  {
    id: '4',
    tag: 'FITPULSE STORE',
    title: 'Supplements &',
    titleAccent: 'Pro Gear',
    subtitle: 'Consult Marketing AI & buy with Coins or Chapa.',
    quote: 'Fuel\nYour\nGrowth',
    image: require('../../assets/images/banners/gear-hero.jpg'),
    route: '/marketplace',
  },
];

export default function HeroBanner() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const heroHeight = Math.max(Math.round(width * 0.68), 248);
  const bannerWidth = width - 32; // 16px padding on each side

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  return (
    <View style={[styles.container, { marginTop: 16 }]}>
      <View style={[styles.bannerContainer, { height: heroHeight, width: bannerWidth }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
        >
          {BANNERS.map((current) => (
            <View key={current.id} style={{ width: bannerWidth, height: heroHeight }}>
              {/* Background Photo (local bundled asset for 0ms instant display) */}
              <Image
                source={current.image}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              {/* Dark gradient overlay */}
              <LinearGradient
                colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.62)', 'rgba(0,0,0,0.90)']}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.cardInner}>
                {/* Top row: tag badge (left) + motivational quote (right) */}
                <View style={styles.topRow}>
                  <View style={styles.tagBadge}>
                    <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.tagText}>{current.tag}</Text>
                  </View>

                  <View style={styles.quoteWrap}>
                    {current.id === '1' ? (
                      <View style={styles.quoteSignature}>
                        <Text style={[styles.quoteTextGreen, { color: colors.primary }]}>Discipline</Text>
                        <Text style={styles.quoteTextWhite}>Builds</Text>
                        <View>
                          <Text style={styles.quoteTextWhite}>Freedom</Text>
                          <View style={[styles.quoteUnderline, { backgroundColor: colors.primary }]} />
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.quoteText, { color: colors.primary }]}>{current.quote}</Text>
                    )}
                  </View>
                </View>

                {/* Bottom content */}
                <View style={styles.bottomContent}>
                  <Text style={styles.title}>
                    {current.title}{'\n'}
                    <Text style={[styles.titleAccent, { color: colors.primary }]}>{current.titleAccent}</Text>
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={2}>{current.subtitle}</Text>
                  <View style={styles.bottomActionRow}>
                    <TouchableOpacity
                      style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.85}
                      onPress={() => router.push(current.route as any)}
                    >
                      <Text style={styles.joinBtnText}>Join Now</Text>
                      <Ionicons name="arrow-forward" size={15} color="#000000" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Dots indicator (Bottom-right overlay aligned with Join Now row) */}
        <View style={styles.dots}>
          {BANNERS.map((_, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => {
                scrollViewRef.current?.scrollTo({ x: i * bannerWidth, animated: true });
                setActiveIndex(i);
              }}
            >
              <View style={[styles.dot, i === activeIndex && [styles.dotActive, { backgroundColor: colors.primary }]]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  bannerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0A0E17',
  },
  cardInner: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  tagText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  quoteWrap: {
    alignItems: 'flex-end',
  },
  quoteSignature: {
    alignItems: 'center',
    transform: [{ rotate: '-8deg' }],
    marginRight: 2,
  },
  quoteTextGreen: {
    color: Colors.primary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '800',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quoteTextWhite: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '800',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quoteUnderline: {
    height: 2.5,
    backgroundColor: Colors.primary,
    width: '100%',
    marginTop: 2,
    borderRadius: 2,
  },
  quoteText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'right',
    lineHeight: 19,
    letterSpacing: -0.3,
  },
  bottomContent: {
    justifyContent: 'flex-end',
    paddingRight: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 33,
    letterSpacing: -0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleAccent: { color: Colors.primary },
  subtitle: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.95)', 
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 30,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  dots: {
    position: 'absolute',
    bottom: 22,
    right: 16,
    flexDirection: 'row',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 18, backgroundColor: Colors.primary },
});
