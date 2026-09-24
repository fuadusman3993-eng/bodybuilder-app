import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Image } from 'react-native';
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
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
    route: '/challenge',
  },
  {
    id: '2',
    tag: 'TRENDING',
    title: 'Find Your',
    titleAccent: 'Coach',
    subtitle: 'Train with certified professionals.',
    quote: 'Stronger\nEvery\nDay',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=80',
    route: '/(tabs)/chat',
  },
];

export default function HeroBanner() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const heroHeight = Math.round(width * 0.62);
  const current = BANNERS[activeIndex];

  return (
    <View style={[styles.container, { marginTop: 16 }]}>
      <View style={[styles.banner, { height: Math.max(heroHeight, 200) }]}>
        {/* Background Photo */}
        <Image
          source={{ uri: current.image }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        {/* Dark gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.4)']}
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
          <Text style={styles.quoteText}>{current.quote}</Text>
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

        {/* Dots indicator */}
        <View style={styles.dots}>
          {BANNERS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setActiveIndex(i)}>
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
  banner: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  topRow: { padding: 14 },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
  quoteText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'right',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  bottomContent: { paddingHorizontal: 18, paddingBottom: 40 },
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
