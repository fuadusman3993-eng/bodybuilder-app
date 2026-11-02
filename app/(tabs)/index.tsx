import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/colors';
import Header from '../../components/layout/Header';
import HeroBanner from '../../components/home/HeroBanner';
import StoriesRow from '../../components/home/StoriesRow';
import QuickActions from '../../components/home/QuickActions';
import CommunityFeed from '../../components/home/CommunityFeed';
import CoachHome from '../../components/home/CoachHome';
import { useUserStore } from '../../store/userStore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();

  if (user.role === 'coach') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <CoachHome />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        bounces={true}
        overScrollMode="always"
      >
        <Header />
        <StoriesRow />
        <HeroBanner />
        <QuickActions />
        <CommunityFeed />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: {},
});
