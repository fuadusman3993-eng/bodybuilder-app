import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Image, ActivityIndicator, Alert, Animated, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

const BG = '#0A0F1A';

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateTo = (val: number) => {
    setProgress(val);
    Animated.timing(progressAnim, {
      toValue: val / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };

  const handlePost = async () => {
    if (!imageUri || !user.uid) {
      Alert.alert('Please select a photo first.');
      return;
    }
    setUploading(true);
    animateTo(20);

    try {
      // 1. Fetch image as blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
      const fileName = `${user.uid}_${Date.now()}.${ext}`;

      animateTo(50);

      // 2. Upload to Supabase storage bucket 'posts'
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, blob, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;

      animateTo(75);

      // 3. Get public URL
      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
      const avatarUrl = `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`;

      // 4. Insert post record
      const { error: dbError } = await supabase.from('posts').insert({
        uid: user.uid,
        username: user.name || 'User',
        avatar_url: avatarUrl,
        image_url: urlData.publicUrl,
        caption: caption.trim() || null,
        likes_count: 0,
        created_at: new Date().toISOString(),
      });
      if (dbError) throw dbError;

      animateTo(100);
      setTimeout(() => {
        Alert.alert('✅ Posted!', 'Your post is now live.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }, 400);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message || 'Something went wrong.');
      setUploading(false);
      setProgress(0);
      progressAnim.setValue(0);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, (!imageUri || uploading) && { opacity: 0.4 }]}
          onPress={handlePost}
          disabled={!imageUri || uploading}
        >
          <Text style={styles.postBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {uploading && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
            }]}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.pickedImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.placeholderText}>Tap to select a photo</Text>
            </View>
          )}
          {imageUri && (
            <View style={styles.changePhotoOverlay}>
              <Ionicons name="camera-outline" size={20} color="#FFF" />
              <Text style={styles.changePhotoText}>Change</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Image
            source={{ uri: `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg` }}
            style={styles.miniAvatar}
            defaultSource={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150' }}
          />
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor={Colors.textMuted}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={300}
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📸 Tips for great posts</Text>
          <Text style={styles.tipText}>• Show your workout, progress, or daily routine</Text>
          <Text style={styles.tipText}>• Add a caption to inspire your followers</Text>
          <Text style={styles.tipText}>• Posts stay on your profile permanently</Text>
        </View>

        {uploading && (
          <View style={styles.uploadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.uploadingText}>Uploading... {progress}%</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },

  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 0 },
  progressFill: { height: '100%', backgroundColor: Colors.primary },

  scroll: { padding: 16, paddingBottom: 80 },

  imagePicker: { borderRadius: 16, overflow: 'hidden', height: 360, marginBottom: 16, position: 'relative' },
  pickedImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.6)', justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', gap: 12 },
  placeholderText: { color: Colors.textMuted, fontSize: 14 },
  changePhotoOverlay: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  changePhotoText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  captionContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  miniAvatar: { width: 36, height: 36, borderRadius: 18, marginTop: 4 },
  captionInput: { flex: 1, color: Colors.textPrimary, fontSize: 14, lineHeight: 22, minHeight: 60 },

  tipsCard: { backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 8 },
  tipsTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  tipText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },

  uploadingState: { alignItems: 'center', marginTop: 30, gap: 12 },
  uploadingText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
