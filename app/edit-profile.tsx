import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { getProfile, syncUserProfile } from '../lib/profileService';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import UserAvatar, { AvatarIconStyle, getAvatarColor } from '../components/ui/UserAvatar';
import AvatarCustomizerModal from '../components/profile/AvatarCustomizerModal';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();

  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState<string>(
    user.avatarColor || getAvatarColor(user.uid, user.name)
  );
  const [avatarIcon, setAvatarIcon] = useState<AvatarIconStyle>(
    (user.avatarIcon as AvatarIconStyle) || 'initials'
  );
  const [showCustomizer, setShowCustomizer] = useState(false);

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

      // 1. Load from Supabase Unified Profile
      const prof = await getProfile(uid);
      if (prof) {
        setName(prof.name || user.name || '');
        setBio(prof.bio || '');
        setAvatar(prof.avatar_url || null);
        if (prof.avatar_color) setAvatarColor(prof.avatar_color);
        if (prof.avatar_icon) setAvatarIcon(prof.avatar_icon as AvatarIconStyle);
      }

      // 2. Also check Firestore for extra fields
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!prof) {
            setName(data.username || data.name || user.name);
            setBio(data.bio || '');
            setAvatar(data.avatar || null);
          }
          if (user.role === 'coach') {
            setExperience(data.experience?.toString() || '');
          } else {
            setWeight(data.weight?.toString() || '');
          }
        }
      } catch (_) {}
    } catch (e) {
      console.error(e);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setAvatar(result.assets[0].uri);
        await uploadToSupabase(result.assets[0].uri);
      }
    } catch (e) {
      console.warn(e);
      setIsUploading(false);
    }
  };

  const uploadToSupabase = async (uri: string) => {
    setIsUploading(true);
    try {
      const uid = auth.currentUser?.uid || user.uid;
      const fileName = `${uid}.jpg`;

      const res = await fetch(uri);
      const blob = await res.blob();

      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatar(`${publicUrl}?t=${Date.now()}`);
    } catch (error: any) {
      console.error('Upload Error:', error);
      Alert.alert('Upload Failed', error.message || 'Make sure the "avatars" bucket exists and is public.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) return;

      // 1. Save to Supabase Unified Profile (SSOT)
      await syncUserProfile({
        uid,
        name: name.trim(),
        bio: bio.trim(),
        avatar_url: avatar || undefined,
        role: user.role || 'user',
        avatar_color: avatarColor,
        avatar_icon: avatarIcon,
      });

      // 2. If coach, also update coach_profiles
      if (user.role === 'coach') {
        try {
          await supabase
            .from('coach_profiles')
            .update({
              name: name.trim(),
              bio: bio.trim(),
              avatar_url: avatar || undefined,
            })
            .eq('uid', uid);
        } catch (_) {}
      }

      // 3. Keep Firestore in sync for backwards-compatibility
      try {
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
      } catch (_) {}

      // 4. Update Zustand store
      setUser({
        ...user,
        name: name.trim(),
        avatar: avatar || user.avatar,
        avatarColor,
        avatarIcon,
      });

      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarStyleSave = async (color: string, icon: AvatarIconStyle) => {
    setAvatarColor(color);
    setAvatarIcon(icon);
    // Persist immediately so the change is visible even if user doesn't tap "Save"
    const uid = auth.currentUser?.uid || user.uid;
    if (uid) {
      try {
        await supabase
          .from('profiles')
          .update({ avatar_color: color, avatar_icon: icon, updated_at: new Date().toISOString() })
          .eq('uid', uid);
      } catch (_) {}
      setUser({ ...user, avatarColor: color, avatarIcon: icon });
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

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {/* Live avatar preview */}
          <View style={styles.avatarWrap}>
            {avatar && !avatar.includes('ui-avatars.com') ? (
              <>
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
                {isUploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                )}
              </>
            ) : (
              <UserAvatar
                uid={user.uid}
                name={name || user.name}
                avatarColor={avatarColor}
                avatarIcon={avatarIcon}
                size={100}
              />
            )}
            {/* Camera badge */}
            <TouchableOpacity
              style={styles.editIconBadge}
              onPress={pickImage}
              disabled={isUploading}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Action buttons below avatar */}
          <TouchableOpacity
            style={styles.avatarActionBtn}
            onPress={pickImage}
            disabled={isUploading}
          >
            <Ionicons name="image-outline" size={16} color={Colors.primary} />
            <Text style={styles.avatarActionText}>Upload Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.avatarActionBtn, { marginTop: 8 }]}
            onPress={() => setShowCustomizer(true)}
          >
            <Ionicons name="color-palette-outline" size={16} color={Colors.primary} />
            <Text style={styles.avatarActionText}>Customize Color & Style</Text>
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

      {/* Avatar Customizer Modal */}
      <AvatarCustomizerModal
        visible={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        uid={user.uid}
        name={name || user.name}
        currentColor={avatarColor}
        currentIcon={avatarIcon}
        onSave={handleAvatarStyleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  saveText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.surfaceLight,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarActionText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#888', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#FFF',
    fontSize: 16,
  },
  textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
});
