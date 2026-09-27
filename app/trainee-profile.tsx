import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Colors } from '../constants/colors';

export default function TraineeProfilePage() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [trainee, setTrainee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainee();
  }, [uid]);

  const fetchTrainee = async () => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTrainee(docSnap.data());
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
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
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
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
