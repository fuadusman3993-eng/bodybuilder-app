import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Image, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const BANNERS = [
  {
    id: '1',
    tag: 'NEW CHALLENGE',
    title: '30 Days',
    titleAccent: 'Better You',
    subtitle: 'Build healthy habits. See real results.',
    quote: 'Discipline\nBuilds\nFreedom',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1000&q=80',
    route: '/challenge',
  },
  {
    id: '2',
    tag: 'TRENDING',
    title: 'Find Your',
    titleAccent: 'Coach',
    subtitle: 'Train with certified professionals.',
    quote: 'Stronger\nEvery\nDay',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1000&q=80',
    route: '/(tabs)/chat',
  },
  {
    id: '3',
    tag: 'NEW WORKOUT',
    title: 'Push Your',
    titleAccent: 'Limits',
    subtitle: 'Daily exercises for maximum growth.',
    quote: 'No Pain\nNo Gain',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1000&q=80',
    route: '/workout',
  },
];

export default function HeroBanner() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const heroHeight = Math.max(Math.round(width * 0.62), 200);
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
              {/* Background Photo */}
              <Image
                source={{ uri: current.image }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              {/* Dark gradient overlay */}
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
              />

              {/* Top: tag badge */}
              <View style={styles.topRow}>
                <View style={styles.tagBadge}>
                  <View style={styles.tagDot} />
                  <Text style={styles.tagText}>{current.tag}</Text>
                </View>
              </View>

              {/* Motivational quote — top right */}
              <View style={styles.quoteWrap}>
                {current.id === '1' ? (
                  <View style={styles.quoteSignature}>
                    <Text style={styles.quoteTextGreen}>Discipline</Text>
                    <Text style={styles.quoteTextWhite}>Builds</Text>
                    <View>
                      <Text style={styles.quoteTextWhite}>Freedom</Text>
                      <View style={styles.quoteUnderline} />
                    </View>
                  </View>
                ) : (
                  <Text style={styles.quoteText}>{current.quote}</Text>
                )}
              </View>

              {/* Bottom content */}
              <View style={styles.bottomContent}>
                <Text style={styles.title}>
                  {current.title}{'\n'}
                  <Text style={styles.titleAccent}>{current.titleAccent}</Text>
                </Text>
                <Text style={styles.subtitle}>{current.subtitle}</Text>
                <TouchableOpacity
                  style={styles.joinBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push(current.route as any)}
                >
                  <Text style={styles.joinBtnText}>Join Now  →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Dots indicator (Absolute overlay) */}
        <View style={styles.dots}>
          {BANNERS.map((_, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => {
                scrollViewRef.current?.scrollTo({ x: i * bannerWidth, animated: true });
                setActiveIndex(i);
              }}
            >
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
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
  },
  topRow: { padding: 14, position: 'absolute', top: 0, left: 0 },
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
    position: 'absolute',
    top: 14,
    right: 18,
    alignItems: 'flex-end',
  },
  quoteSignature: {
    alignItems: 'center',
    transform: [{ rotate: '-12deg' }],
    marginTop: 5,
    marginRight: 5,
  },
  quoteTextGreen: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quoteTextWhite: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quoteUnderline: {
    height: 3,
    backgroundColor: Colors.primary,
    width: '100%',
    marginTop: 2,
    borderRadius: 2,
  },
  quoteText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'right',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  bottomContent: { position: 'absolute', bottom: 40, left: 18, right: 18 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleAccent: { color: Colors.primary },
  subtitle: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.95)', 
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  joinBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  dots: {
    position: 'absolute',
    bottom: 14,
    right: 18,
    flexDirection: 'row',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 18, backgroundColor: Colors.primary },
});
