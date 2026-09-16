import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import Badge from './Badge';

interface LockedFeatureConfig {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  badge: string;
  badgeVariant: 'primary' | 'premium';
  title: string;
  whatItDoes: string;
  whyUseful: string;
  tier: string;
  afterUpgrade: string;
  ctaLabel: string;
}

const FEATURE_CONFIGS: Record<string, LockedFeatureConfig> = {
  chat: {
    icon: 'chatbubbles-outline',
    iconColor: Colors.primary,
    iconBg: 'rgba(16,185,129,0.12)',
    badge: 'Free Account Required',
    badgeVariant: 'primary',
    title: 'Talk to Your AI Coach — Anytime',
    whatItDoes:
      'Chat directly with an AI-powered fitness coach that knows your goals, tracks your progress, and adjusts your plan in real time.',
    whyUseful:
      'Most people quit because they have no guidance. With an AI coach available 24/7, you get instant answers, motivation, and accountability — no appointment needed.',
    tier: 'Free Account',
    afterUpgrade:
      'After signing up, you can message your AI coach immediately, browse coach profiles, and join group coaching sessions.',
    ctaLabel: 'Create Free Account',
  },
  community: {
    icon: 'people-outline',
    iconColor: '#818CF8',
    iconBg: 'rgba(129,140,248,0.12)',
    badge: 'Free Account Required',
    badgeVariant: 'primary',
    title: 'Join a Community That Gets You',
    whatItDoes:
      'Share your workout wins, post progress photos, follow other athletes, and get real reactions from people on the same journey.',
    whyUseful:
      'Research shows people are 65% more likely to hit their fitness goals when they share progress publicly. Your wins inspire others — and theirs will inspire you.',
    tier: 'Free Account',
    afterUpgrade:
      'Once signed up, you can post instantly, follow trainers, comment on transformations, and discover people near you.',
    ctaLabel: 'Join the Community',
  },
  create: {
    icon: 'create-outline',
    iconColor: Colors.primary,
    iconBg: 'rgba(16,185,129,0.12)',
    badge: 'Free Account Required',
    badgeVariant: 'primary',
    title: 'Share Your Progress with the World',
    whatItDoes:
      'Post your workouts, transformation photos, and personal records. Tag coaches, exercises, and gyms to build your fitness identity.',
    whyUseful:
      'Documenting your journey keeps you accountable. Your posts become a personal record of how far you have come — and a source of motivation for others.',
    tier: 'Free Account',
    afterUpgrade:
      'After signing up, you can post photos, videos, and workout logs immediately. Your profile becomes your fitness portfolio.',
    ctaLabel: 'Start Sharing',
  },
  profile: {
    icon: 'person-circle-outline',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    badge: 'Free Account Required',
    badgeVariant: 'primary',
    title: 'Build Your Fitness Identity',
    whatItDoes:
      'Your profile tracks every workout, streak, achievement, and milestone. It becomes a living record of your transformation over time.',
    whyUseful:
      'Seeing your stats grow — more workouts, longer streaks, heavier lifts — is one of the most powerful motivators in fitness. Your profile is your proof.',
    tier: 'Free Account',
    afterUpgrade:
      'After signing up, your workout history syncs automatically. You earn badges, set personal records, and can share your profile with coaches.',
    ctaLabel: 'Create Your Profile',
  },
};

interface GuestBlockerProps {
  feature: keyof typeof FEATURE_CONFIGS;
}

export default function GuestBlocker({ feature }: GuestBlockerProps) {
  const router = useRouter();
  const config = FEATURE_CONFIGS[feature] ?? FEATURE_CONFIGS.chat;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={52} color={config.iconColor} />
        </View>

        {/* Badge */}
        <Badge label={config.badge} variant={config.badgeVariant} style={styles.badge} />

        {/* Title */}
        <Text style={styles.title}>{config.title}</Text>

        {/* What it does */}
        <Text style={styles.body}>{config.whatItDoes}</Text>

        {/* Why useful */}
        <View style={styles.infoBox}>
          <Ionicons name="bulb-outline" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
          <Text style={styles.infoText}>{config.whyUseful}</Text>
        </View>

        {/* Tier unlock */}
        <View style={styles.tierRow}>
          <Ionicons name="lock-open-outline" size={14} color={Colors.primary} />
          <Text style={styles.tierText}>
            Unlocked with a <Text style={styles.tierHighlight}>{config.tier}</Text>
          </Text>
        </View>

        {/* After upgrade */}
        <View style={styles.afterBox}>
          <Text style={styles.afterLabel}>After signing up:</Text>
          <Text style={styles.afterText}>{config.afterUpgrade}</Text>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.ctaLabel}>{config.ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.background} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.laterButton} onPress={() => router.back()}>
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 33,
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#CCC',
    lineHeight: 20,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  tierText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tierHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  afterBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  afterLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  afterText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    gap: 12,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ctaLabel: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  laterButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
