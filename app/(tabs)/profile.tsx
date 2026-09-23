import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import GuestBlocker from '../../components/ui/GuestBlocker';
import { useRouter } from 'expo-router';
import { signOut } from '../../lib/authService';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 32 - 16) / 3;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  
  const [activeTab, setActiveTab] = useState('Posts');
  const [profileData, setProfileData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user.tier !== UserTier.GUEST) {
      fetchProfile();
    }
  }, [user.tier]);

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) return;
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  if (user.tier === UserTier.GUEST) {
    return <GuestBlocker feature="profile" />;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      setUser({ tier: UserTier.GUEST });
      router.replace('/login');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const isCoach = user.role === 'coach';
  
  // Real or fallback data
  const avatar = profileData?.avatar;
  const bio = profileData?.bio || (isCoach ? 'Ready to train you to the next level.' : 'No bio yet.');
  const stat1Label = isCoach ? 'Clients' : 'Workouts';
  const stat1Value = profileData?.workouts || 0;
  const stat2Label = isCoach ? 'Experience' : 'Streak';
  const stat2Value = (isCoach ? profileData?.experience : profileData?.streak) || 0;
  const stat3Label = isCoach ? 'Rating' : 'Weight';
  const stat3Value = (isCoach ? profileData?.rating : profileData?.weight) || (isCoach ? 'New' : '-');

  // Dynamic Tabs based on role
  const tabs = isCoach 
    ? ['Programs', 'Reviews', 'Gallery'] 
    : ['Posts', 'Progress', 'Achievements'];

  // Temporary placeholders for grid
  const gridImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {avatar ? (
             <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
            </View>
          )}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profileData?.name || profileData?.username || user.name}</Text>
            {isCoach && <Ionicons name="checkmark-circle" size={20} color={Colors.info} />}
          </View>
          <Text style={styles.title}>{isCoach ? 'Pro Coach' : 'Fitness Enthusiast'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stat1Value}</Text>
            <Text style={styles.statLabel}>{stat1Label}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stat2Value}{stat2Label === 'Experience' ? ' yrs' : ''}</Text>
            <Text style={styles.statLabel}>{stat2Label}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stat3Value}{stat3Label === 'Weight' ? ' kg' : ''}</Text>
            <Text style={styles.statLabel}>{stat3Label}</Text>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => router.push('/edit-profile')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <Text style={styles.bio}>{bio}</Text>

        {/* Profile Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid Gallery */}
        <View style={styles.gridContainer}>
          {gridImages.map((img, index) => (
            <TouchableOpacity key={index} activeOpacity={0.8}>
              <Image source={{ uri: img }} style={styles.gridImage} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  scrollContent: { paddingBottom: 24 },
  profileInfo: { alignItems: 'center', marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.surfaceLight },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.surfaceLight },
  avatarInitial: { color: '#000', fontSize: 36, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  name: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  title: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', marginTop: 24, paddingHorizontal: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  editButton: { marginHorizontal: 16, marginTop: 24, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center' },
  editButtonText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  bio: { fontSize: 14, color: Colors.textPrimary, textAlign: 'center', marginTop: 20, marginHorizontal: 20, lineHeight: 22 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: Colors.border, marginTop: 24 },
  tab: { paddingVertical: 12, paddingHorizontal: 16 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  activeTabText: { color: Colors.textPrimary },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  gridImage: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 8, backgroundColor: Colors.surface },
});
