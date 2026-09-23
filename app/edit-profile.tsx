import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();

  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // Trainee fields
  const [weight, setWeight] = useState('');
  // Coach fields
  const [experience, setExperience] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) return;
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.username || data.name || user.name);
        setBio(data.bio || '');
        setAvatar(data.avatar || null);
        if (user.role === 'coach') {
          setExperience(data.experience?.toString() || '');
        } else {
          setWeight(data.weight?.toString() || '');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await uploadToSupabase(result.assets[0].base64);
    }
  };

  const uploadToSupabase = async (base64Img: string) => {
    setIsUploading(true);
    try {
      const uid = auth.currentUser?.uid || user.uid;
      const fileName = `${uid}-${Date.now()}.jpg`;

      // Decode base64 to Blob
      const res = await fetch(`data:image/jpeg;base64,${base64Img}`);
      const blob = await res.blob();

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatar(publicUrl);
    } catch (error: any) {
      console.error('Upload Error:', error);
      Alert.alert('Upload Failed', 'Make sure you created the "avatars" bucket in Supabase and made it public.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) return;

      const updateData: any = {
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar,
      };

      if (user.role === 'coach') {
        updateData.experience = experience;
      } else {
        updateData.weight = weight;
      }

      await updateDoc(doc(db, 'users', uid), updateData);
      
      setUser({ ...user, name: name.trim() }); // Keep store in sync
      
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading || isUploading}>
          {isLoading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Avatar Upload */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} disabled={isUploading}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#666"
            placeholder="Your name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholderTextColor="#666"
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={3}
          />
        </View>

        {user.role === 'coach' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              value={experience}
              onChangeText={setExperience}
              placeholderTextColor="#666"
              placeholder="e.g. 5"
              keyboardType="number-pad"
            />
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholderTextColor="#666"
              placeholder="e.g. 75"
              keyboardType="numeric"
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  saveText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: Colors.surfaceLight },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.surfaceLight },
  avatarInitial: { color: '#000', fontSize: 36, fontWeight: '800' },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.surfaceLight, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#888', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, paddingHorizontal: 16, height: 52, color: '#FFF', fontSize: 16 },
  textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
});
