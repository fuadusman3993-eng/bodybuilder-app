import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';

const COUNTRIES = ['Ethiopia', 'USA', 'UAE', 'UK', 'Canada', 'Australia', 'Germany', 'Other'];
const ETHIOPIA_CITIES = ['Addis Ababa', 'Adama', 'Hawassa', 'Dire Dawa', 'Bahir Dar', 'Mekelle', 'Gondar', 'Jimma'];

export default function CreateProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();

  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEthiopia = country === 'Ethiopia';
  const needsCustomCity = country && country !== 'Ethiopia';

  const handleCountrySelect = (c: string) => {
    setCountry(c);
    setCity('');
    setCustomCity('');
    setError('');
  };

  const handleComplete = async () => {
    if (!username.trim()) { setError('Please choose a username.'); return; }
    if (!country) { setError('Please select your country.'); return; }
    if (isEthiopia && !city) { setError('Please select your city.'); return; }
    if (needsCustomCity && !customCity.trim()) { setError('Please type your city name.'); return; }

    const finalCity = isEthiopia ? city : customCity.trim();

    setIsLoading(true);
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), {
          username: username.trim(),
          country,
          city: finalCity,
        });
      }
      setUser({ ...user, name: username.trim(), country, city: finalCity });

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
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          <View style={s.iconWrap}>
            <Ionicons name="person-circle-outline" size={64} color={Colors.primary} />
          </View>

          <Text style={s.title}>Set Up Your Profile</Text>
          <Text style={s.subtitle}>This is how you'll appear to others in FitPulse.</Text>

          {/* Username */}
          <View style={[s.inputWrap, error && !username.trim() ? s.inputError : null]}>
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

          {/* Country Selector */}
          <Text style={s.sectionLabel}>Which country are you in?</Text>
          <View style={s.chipGrid}>
            {COUNTRIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.chip, country === c && s.chipActive]}
                onPress={() => handleCountrySelect(c)}
              >
                <Text style={[s.chipText, country === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ethiopian City Selector */}
          {isEthiopia && (
            <>
              <Text style={s.sectionLabel}>Which city?</Text>
              <View style={s.chipGrid}>
                {ETHIOPIA_CITIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.chip, city === c && s.chipActive]}
                    onPress={() => { setCity(c); setError(''); }}
                  >
                    <Text style={[s.chipText, city === c && s.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Custom City Input for Non-Ethiopia */}
          {needsCustomCity && (
            <>
              <Text style={s.sectionLabel}>Which city are you in?</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  placeholder="e.g. New York, Dubai, London..."
                  placeholderTextColor="#666"
                  value={customCity}
                  onChangeText={(t) => { setCustomCity(t); setError(''); }}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <TouchableOpacity style={s.btn} onPress={handleComplete} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Complete Profile</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { paddingHorizontal: 24, paddingTop: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  iconWrap: { alignItems: 'center', marginBottom: 20 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  sectionLabel: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 12, marginTop: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 8 },
  inputError: { borderColor: '#EF4444' },
  atSymbol: { color: Colors.primary, fontSize: 18, fontWeight: '700', marginRight: 8 },
  input: { flex: 1, color: '#FFF', fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 12, marginBottom: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#2A2A2A' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: '#888', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  btn: { backgroundColor: Colors.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
