import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';

const CITIES = ['Addis Ababa', 'Adama', 'Hawassa', 'Dire Dawa', 'Bahir Dar', 'Mekelle', 'Gondar', 'Jimma', 'Other'];

export default function CreateProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    if (!username.trim()) {
      setError('Please choose a username.');
      return;
    }
    if (!city) {
      setError('Please select your city. This helps you find coaches and trainees nearby.');
      return;
    }
    
    const finalCity = city === 'Other' ? customCity.trim() : city;
    if (city === 'Other' && !finalCity) {
      setError('Please type your city name.');
      return;
    }
    
    setIsLoading(true);
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), {
          username: username.trim(),
          city: finalCity,
        });
      }
      
      setUser({ ...user, name: username.trim(), city: finalCity });
      
      if (user.role === 'coach') {
        router.replace('/coach-onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container}>
          
          <View style={s.iconWrap}>
            <Ionicons name="person-circle-outline" size={64} color={Colors.primary} />
          </View>
          
          <Text style={s.title}>Choose a Username</Text>
          <Text style={s.subtitle}>This is how you will appear to other users in FitPulse.</Text>
          
          <View style={[s.inputWrap, error ? s.inputError : null]}>
            <Text style={s.atSymbol}>@</Text>
            <TextInput
              style={s.input}
              placeholder="username"
              placeholderTextColor="#666"
              value={username}
              onChangeText={(t) => { setUsername(t); setError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={[s.subtitle, { marginTop: 24, marginBottom: 12 }]}>Which city are you in? (Important for discovering local coaches)</Text>
          <View style={s.cityGrid}>
            {CITIES.map(c => (
              <TouchableOpacity 
                key={c} 
                style={[s.cityBtn, city === c && s.cityBtnActive]}
                onPress={() => setCity(c)}
              >
                <Text style={[s.cityBtnText, city === c && s.cityBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {city === 'Other' && (
            <View style={[s.inputWrap, { marginTop: 12 }, error ? s.inputError : null]}>
              <TextInput
                style={s.input}
                placeholder="Type your city name"
                placeholderTextColor="#666"
                value={customCity}
                onChangeText={(t) => { setCustomCity(t); setError(''); }}
                autoCapitalize="words"
              />
            </View>
          )}

          {error ? <Text style={s.errorText}>{error}</Text> : null}
          
          <TouchableOpacity style={s.btn} onPress={handleComplete} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Complete Profile</Text>}
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 12 },
  inputError: { borderColor: '#EF4444' },
  atSymbol: { color: Colors.primary, fontSize: 18, fontWeight: '700', marginRight: 8 },
  input: { flex: 1, color: '#FFF', fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  cityBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#2A2A2A' },
  cityBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cityBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  cityBtnTextActive: { color: '#000' },
  btn: { backgroundColor: Colors.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' }
});
