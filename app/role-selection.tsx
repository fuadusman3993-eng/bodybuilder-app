import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/auth/Logo';
import { Colors } from '../constants/colors';

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleSelectRole = (role: 'user' | 'coach') => {
    router.push({ pathname: '/register', params: { role } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Logo size="small" />
        </View>
        <View style={{ width: 40 }} /> {/* Spacer to center logo */}
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            How would you like{'\n'}to use <Text style={styles.titleHighlight}>FitPulse?</Text>
          </Text>
          <Text style={styles.subtitle}>
            Choose your role to get the best experience{'\n'}tailored to your goals.
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Trainee Card */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => handleSelectRole('user')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={32} color="#000" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>As a Trainee</Text>
              <Text style={styles.cardSubTitle}>(Normal User)</Text>
              <Text style={styles.cardDesc}>
                Get personalized workouts, track{'\n'}your progress and achieve your goals.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </TouchableOpacity>

          {/* Coach Card */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => handleSelectRole('coach')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="stopwatch-outline" size={32} color="#000" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>As a Coach</Text>
              <Text style={styles.cardDesc}>
                Create programs, manage clients,{'\n'}and grow your coaching business.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  title: { 
    color: '#FFFFFF', 
    fontSize: 28, 
    fontWeight: '800', 
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 36
  },
  titleHighlight: { color: Colors.primary },
  subtitle: { 
    color: '#AAAAAA', 
    fontSize: 14, 
    textAlign: 'center',
    lineHeight: 22
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubTitle: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 6,
  },
  cardDesc: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 'auto', 
    paddingBottom: 24,
    paddingTop: 16
  },
  footerText: { color: '#888', fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
