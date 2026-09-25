import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

export default function AddStory() {
  const router = useRouter();
  const { user } = useUserStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadStory = async () => {
    if (!imageUri) {
      Alert.alert('No image', 'Please select a photo first.');
      return;
    }
    if (!user.uid) {
      Alert.alert('Not logged in', 'Please log in first.');
      return;
    }

    setUploading(true);
    try {
      // Convert to blob and upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const ext = imageUri.split('.').pop() || 'jpg';
      const fileName = `story_${user.uid}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, blob, { contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      // Get avatar url from Supabase avatars bucket
      const avatarUrl = `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`;

      // Save to stories table
      const { error: dbError } = await supabase.from('stories').insert({
        uid: user.uid,
        username: user.name || 'User',
        avatar_url: avatarUrl,
        image_url: urlData.publicUrl,
        caption: caption.trim() || null,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      Alert.alert('✅ Story posted!', 'Your story is now live for 24 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Upload failed', e.message || 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Story</Text>
          <TouchableOpacity
            style={[styles.postBtn, uploading && { opacity: 0.6 }]}
            onPress={uploadStory}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Preview */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="image-outline" size={60} color={Colors.textMuted} />
                <Text style={styles.placeholderText}>Tap to select a photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionText}>Gallery</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          <View style={styles.captionContainer}>
            <Text style={styles.captionLabel}>Caption (optional)</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Write something motivating..."
              placeholderTextColor={Colors.textMuted}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{caption.length}/200</Text>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText}>Stories disappear after 24 hours</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  postBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  postBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  imagePicker: {
    marginHorizontal: 16,
    marginTop: 20,
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  placeholderText: { color: Colors.textMuted, fontSize: 14 },
  actions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  actionText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  divider: { width: 1, backgroundColor: Colors.border },
  captionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  captionLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  captionInput: {
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: { color: Colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 6 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 30,
  },
  infoText: { color: Colors.textMuted, fontSize: 12 },
});
