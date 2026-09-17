import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUserStore, UserTier } from '../store/userStore';
import PremiumUpgradeModal from '../components/modals/PremiumUpgradeModal';

const { width } = Dimensions.get('window');

const PREVIEW_DAYS = [
  { day: 1, title: 'Full Body', active: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200' },
  { day: 2, title: 'Upper Body', locked: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop' },
  { day: 3, title: 'Lower Body', locked: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop' },
  { day: 4, title: 'Full Body', locked: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop' },
  { day: 5, title: 'Upper Body', locked: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop' },
];

export default function ChallengeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useUserStore();
  const [premiumVisible, setPremiumVisible] = useState(false);

  const heroHeight = Math.round(width * 0.9);

  const handleJoin = () => {
    if (user.tier === UserTier.PREMIUM) {
      // Premium: full access, start the workout
      router.push('/workout');
    } else {
      // Guest or Free: show Premium upsell
      setPremiumVisible(true);
    }
  };

  const handleUpgradePress = () => {
    setPremiumVisible(false);
    // After upgrading (simulated in PremiumUpgradeModal), user becomes PREMIUM
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.scrollContent}>
        {/* HERO SECTION */}
        <View style={[styles.heroBackground, { height: heroHeight }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1526506190296-65b50a14f9d6?q=80&w=800&auto=format&fit=crop&grayscale=true' }}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.8 }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#000']}
            style={styles.heroGradient}
          />
          
          <View style={[styles.header, { marginTop: Math.max(insets.top, 16) }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Start Challenge</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerBtn}>
                <Ionicons name="share-outline" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn}>
                <Ionicons name="bookmark-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Ionicons name="flame" size={12} color="#FFF" />
              <Text style={styles.badgeText}>14 Days Challenge</Text>
            </View>
            
            <Text style={styles.mainTitle}>Build Muscle{'\n'}in 14 Days</Text>
            <Text style={styles.subtitle}>Real workouts. Better nutrition.{'\n'}A stronger you.</Text>
            
            {/* Quick Info Row */}
            <View style={styles.quickInfoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="barbell-outline" size={20} color="#FFF" />
                <View>
                  <Text style={styles.infoValue}>14 Days</Text>
                  <Text style={styles.infoLabel}>Duration</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="stats-chart" size={18} color="#FFF" />
                <View>
                  <Text style={styles.infoValue}>Beginner</Text>
                  <Text style={styles.infoLabel}>Level</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="body-outline" size={20} color="#FFF" />
                <View>
                  <Text style={styles.infoValue}>Full Body</Text>
                  <Text style={styles.infoLabel}>Focus</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* What You'll Get */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="locate-outline" size={20} color="#FFF" />
                <Text style={styles.cardTitle}>What You'll Get</Text>
              </View>
            </View>
            <View style={styles.cardLayout}>
              <Text style={styles.cardDesc}>
                A complete 14-day program with structured workouts, nutrition guidance, and progress tracking to help you build muscle and boost your energy levels.
              </Text>
              <View style={styles.cardList}>
                <CheckItem text="Daily workout plans" />
                <CheckItem text="Nutrition guide" />
                <CheckItem text="Progress tracking" />
                <CheckItem text="Motivation & support" />
              </View>
            </View>
          </View>

          {/* Challenge Overview */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Challenge Overview</Text>
            <TouchableOpacity style={styles.seeDetails}>
              <Text style={styles.seeDetailsText}>See Details</Text>
              <Ionicons name="arrow-forward" size={14} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.overviewGrid}>
            <OverviewItem icon="calendar-outline" value="14" label="Days" />
            <OverviewItem icon="barbell-outline" value="5" label="Workouts/Week" />
            <OverviewItem icon="flame-outline" value="~300-500" label="Calories Burned/Day" />
            <OverviewItem icon="trending-up" value="+3-6kg" label="Potential Muscle Gain" />
          </View>

          {/* Daily Plan Preview */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>Daily Plan Preview</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day 1 of 14</Text>
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.previewScroll}
            snapToInterval={140}
            decelerationRate="fast"
          >
            {PREVIEW_DAYS.map((day) => (
              <TouchableOpacity key={day.day} style={[styles.dayCard, day.active && styles.dayCardActive]} activeOpacity={0.9}>
                <View style={styles.dayCardHeader}>
                  <View>
                    <Text style={styles.dayCardTitle}>Day {day.day}</Text>
                    <Text style={styles.dayCardSub}>{day.title}</Text>
                  </View>
                  {day.active && <Ionicons name="checkmark-circle" size={18} color="#FFF" />}
                  {day.locked && <Ionicons name="lock-closed-outline" size={16} color="#888" />}
                </View>
                <View style={styles.dayCardImg}>
                  <Image
                    source={{ uri: day.image }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 8 }]}
                    resizeMode="cover"
                  />
                  <View style={styles.dayCardImgOverlay} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Premium Promotion */}
          <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.9}>
            <View style={styles.premiumBg}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop&grayscale=true' }}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.4, borderRadius: 16 }]}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(20,20,20,0.95)', 'rgba(0,0,0,0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumGradient}
              />
              <View style={styles.premiumContent}>
                <View style={styles.premiumTextCol}>
                  <View style={styles.premiumHeader}>
                    <Ionicons name="star" size={14} color="#FFF" />
                    <Text style={styles.premiumTitle}>Go Premium for More</Text>
                  </View>
                  <Text style={styles.premiumDesc}>
                    Unlock personalized coaching, advanced tracking and exclusive challenges.
                  </Text>
                </View>
                <View style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                  <Ionicons name="arrow-forward" size={14} color="#000" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.joinBtn} activeOpacity={0.85} onPress={handleJoin}>
          <Text style={styles.joinBtnText}>Join Challenge</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
        <View style={styles.footerNote}>
          <Ionicons name="lock-closed-outline" size={10} color="#888" />
          <Text style={styles.footerText}>Free to join  •  Upgrade for full access</Text>
        </View>
      </View>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        visible={premiumVisible}
        onClose={() => setPremiumVisible(false)}
        featureTitle="Full 14-Day Challenge Access"
        featureDescription="Get access to all 14 days of structured workouts, daily nutrition guides, progress tracking, and 1-on-1 coaching support throughout the challenge."
      />
    </View>
  );
}


function CheckItem({ text }: { text: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons name="checkmark-circle" size={16} color="#FFF" />
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

function OverviewItem({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <View style={styles.overviewItem}>
      <Ionicons name={icon} size={22} color="#FFF" style={{ marginBottom: 6 }} />
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  heroBackground: {
    width: '100%',
    height: undefined, // height set inline from useWindowDimensions
    minHeight: 380,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    lineHeight: 20,
    marginBottom: 24,
  },
  quickInfoRow: {
    flexDirection: 'row',
    gap: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  infoLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  bodyContent: {
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: -20,
  },
  cardTopRow: {
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  cardLayout: {
    flexDirection: 'column',
    gap: 16,
  },
  cardDesc: {
    flex: 1,
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
  cardList: {
    flex: 1,
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    color: '#FFF',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  seeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeDetailsText: {
    color: '#888',
    fontSize: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 11,
    color: '#888',
  },
  dayBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadgeText: {
    color: '#FFF',
    fontSize: 11,
  },
  previewScroll: {
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  dayCard: {
    width: 130,
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    padding: 12,
    gap: 12,
    flexShrink: 0,
  },
  dayCardActive: {
    borderColor: '#FFF',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    flexShrink: 1,
  },
  dayCardSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    flexShrink: 1,
  },
  dayCardImg: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dayCardImgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  premiumBanner: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  premiumBg: {
    width: '100%',
  },
  premiumGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  premiumTextCol: {
    flex: 1,
    flexShrink: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  premiumTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    flexShrink: 1,
  },
  premiumDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    flexShrink: 1,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    flexShrink: 0,
  },
  upgradeBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  joinBtn: {
    backgroundColor: '#FFF',
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  joinBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  footerNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  footerText: {
    color: '#888',
    fontSize: 11,
  },
});
