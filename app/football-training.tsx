import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../store/themeStore';
import BackButton from '../components/ui/BackButton';

type TrainingTab = 'Gym' | 'Field';

export default function FootballTrainingScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TrainingTab>('Gym');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="light" />

      {/* ── 1. Top Header with Back Button and TikTok-Style Tabs ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.leftBtnWrap}>
          <BackButton fallbackRoute="/(tabs)" />
        </View>

        {/* TikTok-Style Tabs (English Only: Gym | Field) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('Gym')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Gym' ? styles.activeTabText : styles.inactiveTabText,
              ]}
            >
              Gym
            </Text>
            {activeTab === 'Gym' && (
              <View style={[styles.activeIndicator, { backgroundColor: '#00E676' }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('Field')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Field' ? styles.activeTabText : styles.inactiveTabText,
              ]}
            >
              Field
            </Text>
            {activeTab === 'Field' && (
              <View style={[styles.activeIndicator, { backgroundColor: '#00E676' }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Right Spacer to balance the BackButton on the left */}
        <View style={styles.rightSpacer} />
      </View>

      {/* ── 2. Empty Body (ከስር ባዶ) ── */}
      <View style={styles.body} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftBtnWrap: {
    width: 44,
    alignItems: 'flex-start',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  inactiveTabText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
  rightSpacer: {
    width: 44,
  },
  body: {
    flex: 1,
  },
});
