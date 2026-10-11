import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Colors } from '../constants/colors';
import Skeleton from '../components/ui/Skeleton';

interface CachedTrainee {
  trainee: any;
  timestamp: number;
}

const traineeProfileCache: Record<string, CachedTrainee> = {};

export default function TraineeProfilePage() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const cached = uid ? traineeProfileCache[uid] : undefined;

  const [trainee, setTrainee] = useState<any>(cached?.trainee || null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (!uid) return;
    const c = traineeProfileCache[uid];
    if (c) {
      setTrainee(c.trainee);
      setLoading(false);
      if (Date.now() - c.timestamp > 2 * 60 * 1000) {
        fetchTrainee(false);
      }
    } else {
      fetchTrainee(true);
    }
  }, [uid]);

  const fetchTrainee = async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const docRef = doc(db, 'users', uid!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTrainee(data);
        traineeProfileCache[uid!] = {
          trainee: data,
          timestamp: Date.now(),
        };
      }
    } catch (e) {
      console.warn(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header: avatar + name + location */}
          <View style={styles.header}>
            <Skeleton width={100} height={100} borderRadius={50} style={{ marginBottom: 16 }} />
            <Skeleton width={180} height={24} borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton width={100} height={14} borderRadius={4} />
          </View>
          {/* Cards */}
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.card, { marginBottom: 16 }]}>
              <Skeleton width={110} height={13} borderRadius={4} style={{ marginBottom: 10 }} />
              <Skeleton width="70%" height={18} borderRadius={4} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!trainee) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: '#FFF' }}>Trainee not found.</Text>
      </View>
    );
  }

  const avatarUrl = `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${uid}.jpg`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image
            source={avatarUrl}
            placeholder={`https://ui-avatars.com/api/?name=${encodeURIComponent(trainee.name || 'Trainee')}&background=10B981&color=fff&size=150`}
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.avatar}
          />
          <Text style={styles.name}>{trainee.name || trainee.username || 'Trainee'}</Text>
          <Text style={styles.location}>
            <Ionicons name="location" size={14} color={Colors.textMuted} /> {trainee.city || 'Unknown City'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fitness Goals</Text>
          <Text style={styles.infoText}>{trainee.fitnessGoal || 'Not specified'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          <Text style={styles.infoText}>{trainee.experienceLevel || 'Beginner'}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <Text style={styles.infoText}>{trainee.activityLevel || 'Not specified'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: Colors.primary, marginBottom: 16 },
  name: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  location: { color: Colors.textMuted, fontSize: 14 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 16, marginBottom: 16 },
  sectionTitle: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  infoText: { color: '#FFF', fontSize: 16 },
});
